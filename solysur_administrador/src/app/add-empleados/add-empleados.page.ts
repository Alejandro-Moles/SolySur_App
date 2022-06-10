import { Component, OnInit } from '@angular/core';
import {AlertController, LoadingController, ModalController} from '@ionic/angular';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {passwordValidation} from '../validators/password';
import {dniValidation} from '../validators/dni';
import { AuthService } from '../services/auth.service';
import { DbService } from '../services/db.service';
import {Router} from "@angular/router";
import * as CryptoJS from 'crypto-js';
import {DbLocalService} from "../services/db-local.service";
import {Network} from "@capacitor/network";
import {Storage} from "@ionic/storage-angular";




@Component({
  selector: 'app-add-empleados',
  templateUrl: './add-empleados.page.html',
  styleUrls: ['./add-empleados.page.scss'],
})
export class AddEmpleadosPage implements OnInit {
  datosEmpleado: FormGroup;
  showPass= false;
  passIcon = 'eye-off-outline';
  categoria = true;
  datosEncriptados ='';
  secretKey = 'yoursecretkey';
  abecedario = [
    {letra: 'T'},{letra: 'R'},{letra: 'W'},{letra: 'A'},{letra: 'G'},{letra: 'M'},{letra: 'Y'},{letra: 'F'},{letra: 'P'},{letra: 'D'},
    {letra: 'X'},{letra: 'B'},{letra: 'N'},{letra: 'J'},{letra: 'Z'},{letra: 'S'},{letra: 'Q'},{letra: 'V'},{letra: 'H'},{letra: 'L'},
    {letra: 'C'},{letra: 'K'},{letra: 'E'},
  ];
  dniCompleto: any;
  datosTrabajo: any;
  estado: any;
  objetoEmpleado: Array<any>;
  constructor(private modalController: ModalController,
              private fb: FormBuilder,
              private auth: AuthService,
              private loadingController: LoadingController,
              private alertController: AlertController,
              private db: DbService,
              private router: Router,
              private dbLocal: DbLocalService,
              private storage: Storage
              ) { }

  ngOnInit() {
    this.datosEmpleado = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidation()]],
      name: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+$')]],
      dni: ['', [Validators.required, dniValidation(), Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      trabajo: ['', Validators.required]
    });
  }

  togglePass(){
    this.showPass = !this.showPass;
    if(this.passIcon === 'eye'){
      this.passIcon = 'eye-off-outline';
    }else{
      this.passIcon = 'eye';
    }
  }

  async closeModel(){
    const close = 'Modal Removed';
    await this.modalController.dismiss(close);
  }

  async alta(){
    const dni = this.datosEmpleado.value.dni;
    const indice = dni % 23;
    const letraDni = this.abecedario[indice].letra;
    this.dniCompleto = dni+''+letraDni;

    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      if (!this.estado) {
        //aqui no tendria conexion a internet
        this.registerOffline();
      } else {
        //aqui si tendria conexion a internet
        this.register();
      }
    });
  }

  getemail() {
    return this.datosEmpleado.get('email');
  }

  getpassword() {
    return this.datosEmpleado.get('password');
  }

  getDni(){
    return this.datosEmpleado.get('dni');
  }

  getName(){
    return this.datosEmpleado.get('name');
  }

  async register(){
    const loading = await this.loadingController.create();
    await loading.present();
    //compruebo si en la base de datos hay alguien con el mismo dni para en ese caso no insertarlo
    const condicion = this.db.comprobarDatos(this.dniCompleto);

    if(await condicion === false){
      //compruebo si el uausrio ya esta dado de alta
      const usuario = this.db.sacarAdministrador(this.datosEmpleado.value.email);
      usuario.then(data =>{
        //si el registro esta vacio quiere decir que el usuario no esta dado de alta
        if(data.empty){
          //encripto la contraseña del usuario
          this.encriptar(this.datosEmpleado.value.password);
          this.insertarRegistroEmpleado(data,loading);
        }else{
          //si el registro esta con datos quiere decir que el usuario esta dado de alta
          this.showAlert('Error al dar de alta', 'Este usuario ya esta dado de alta');
          loading.dismiss();
        }
      });
    }else{
      this.showAlert('Error al dar de alta', 'Este Dni ya esta en uso');
      await loading.dismiss();
    }
  }

  async showAlert(header, message) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // @ts-ignore
  async ionViewWillEnter(): boolean | Promise<any> {
    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      if (!this.estado) {
        //aqui no tendria conexion a internet
        this.cargarDatosOffline();
      } else {
        //aqui si tendria conexion a internet
        this.cargarDatosOnline();
      }
    });
  }

  async checkCategoria(){
    this.categoria = !this.categoria;
  }

  async insertarRegistroEmpleado(user, loading){
    //miro lo que hay dentro de la variable para sacar el uid que caracteriza al usuario
      //llamo al metodo de insert user para meter en la coleccion los datos que se necesitan para dar de alta a un empleado
      const registro = this.auth.insertUser(this.datosEmpleado.value.name,
        this.dniCompleto,
        this.datosEmpleado.value.trabajo.nombreTrabajo,
        this.datosEmpleado.value.email,
        this.categoria,
        this.datosEncriptados);

      //lo inserto tambien en la base de datos local
      // eslint-disable-next-line max-len
      this.dbLocal.aniadirUsuarios(this.categoria,this.dniCompleto,this.datosEmpleado.value.email,this.datosEmpleado.value.name,this.datosEmpleado.value.trabajo.nombreTrabajo,this.datosEncriptados);

      registro.then(data =>{
        if(data){
          loading.dismiss();
          this.showAlert('Usuario registrado', 'Ahora este empleado esta dado de alta');
          this.closeModel();
          this.router.navigateByUrl(`/tabs`);
        }else{
          this.showAlert('Error', 'Ha ocurrido un error al intentar dar de alta al usuario');
        }
      });
  }

  //este metodo me encripta una cadena de string usando una key, solo se puede desincriptar bien con esa key
  async encriptar(datos){
    console.log(datos);
    this.datosEncriptados = CryptoJS.AES.encrypt(JSON.stringify(datos),this.secretKey).toString();
  }

  async desenciptar(datos){
    const bytes = CryptoJS.AES.decrypt(datos,this.secretKey);
    let obj;
    return obj = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  async cargarDatosOnline(){
    this.datosTrabajo = new Array();
    const trabajoQuery = await this.db.obtenerDatosTrabajos();
    trabajoQuery.forEach((trabajo) =>{
      this.datosTrabajo.push(trabajo.data());
    });
  }

  cargarDatosOffline(){
    const trabajos = this.dbLocal.fetchTrabajo();
    trabajos.subscribe(data =>{
      this.datosTrabajo = data;
    });
  }


  //este metodo me registra el usuario si no hay internet
  registerOffline(){
    //compruebo si existe un usuario con ese dni en la base de datos local
    const user = this.dbLocal.obtenerUsuarioPorDni(this.dniCompleto);
    user.then(res =>{
      if(!res){
        //luego compruebo si existe un suario con ese email en la base de datos local
        const userEmail = this.dbLocal.obtenerUsuarioPorEmail(this.datosEmpleado.value.email);
        userEmail.then(resultado =>{
          if(!resultado){
            this.ingresarEmpleadoOffline();
            this.showAlert('Usuario registrado', 'Ahora este empleado esta dado de alta');
            this.closeModel();
            this.router.navigateByUrl(`/tabs`);
          }else{
            this.showAlert('Error', 'Ese correo ya esta en uso');
          }
        });
      }else{
        this.showAlert('Error', 'Este dni ya esta en uso');
      }
    });
  }


  //metodo que me inserta en la base de datos local el usuario
  ingresarEmpleadoOffline(){
    this.encriptar(this.datosEmpleado.value.password);
    this.objetoEmpleado = new Array<any>();

    const dato = {
      userName: this.datosEmpleado.value.name,
      userEmail: this.datosEmpleado.value.email,
      userDni: this.dniCompleto,
      userCategoria: this.categoria,
      userTrabajo: this.datosEmpleado.value.trabajo.nombreTrabajo,
      userContrasenia: this.datosEncriptados
    };

    // eslint-disable-next-line max-len
    this.dbLocal.aniadirUsuarios(this.categoria,this.dniCompleto,this.datosEmpleado.value.email,this.datosEmpleado.value.name,this.datosEmpleado.value.trabajo.nombreTrabajo,this.datosEncriptados);

    //lo meto en el storage para que asi, cuando haya internet se me actualicen los datos en la abase de datos externa
    this.storage.get('usuario').then(value=>{
      if(value === null){
        console.log('Primera vez que se meten datos offline');
        value.forEach(datos =>{
          this.objetoEmpleado.push(dato);
        });
        this.storage.set('usuario', this.objetoEmpleado);
      }else{
        console.log('Hay datos que no se han sincronizado');
        this.objetoEmpleado.push(value);
        this.objetoEmpleado.push(dato);
        this.storage.set('usuario', this.objetoEmpleado);
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import {AppComponent} from '../app.component';
import {passwordValidation} from '../validators/password';
import { AuthService } from '../services/auth.service';
import { NavController} from '@ionic/angular';
import {DbService} from "../services/db.service";
import * as CryptoJS from 'crypto-js';
import { Network } from '@capacitor/network';
import {Storage} from "@ionic/storage-angular";
import {DbLocalService} from "../services/db-local.service";


@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.page.html',
  styleUrls: ['./log-in.page.scss'],
})
export class LogInPage implements OnInit {
  credentials: FormGroup;
  showPass = false;
  passIcon = 'eye-off-outline';
  datosUsuario: any;
  estado: any;
  secretKey = 'yoursecretkey';
  contraseniaDesencriptada = '';

  constructor(private fb: FormBuilder,
              private loadingController: LoadingController,
              private alertController: AlertController,
              private router: Router,
              private appComponent: AppComponent,
              private auth: AuthService,
              public navCtrl: NavController,
              private db: DbService,
              private storage: Storage,
              private dbLocal: DbLocalService
  ) {
  }

  ngOnInit() {
    this.storage.create();
    this.comprobarInternet();

    this.credentials = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidation()]],
    });

    this.storage.get('email').then(value => {
      if (value !== null) {
        this.router.navigateByUrl(`/tabs`);
      }
    });
  }

  togglePass() {
    this.showPass = !this.showPass;
    if (this.passIcon === 'eye') {
      this.passIcon = 'eye-off-outline';
    } else {
      this.passIcon = 'eye';
    }
  }

  getemail() {
    return this.credentials.get('email');
  }

  getpassword() {
    return this.credentials.get('password');
  }


  async login() {
    const loading = await this.loadingController.create();
    await loading.present();

    //compruebo si hay internet, y dependiendo de si hay o no me realiza un metodo u otro
    const network = Network.getStatus().then(data => {
      this.estado = data.connected;
      if (!this.estado) {
        const user = this.dbLocal.obtenerUsuarioPorEmail(this.credentials.value.email);
        user.then(res => {
          if(res === false){
            this.showAlert('Error', 'Ha ocurrido un error inesperado');
          }else{
            this.iniciarLoginOffline(res);
          }
        });
      }else {
        console.log('Si hay internet');
        this.iniciarLoginOnline();
      }
    });
    await loading.dismiss();
  }

  async showAlert(header, message) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  //este metodo me rellena los datos del usuario en un array, si hay internet
  async rellerarDatosUsuario() {
    const querySnapshot = await this.db.sacarEmpleado(this.auth.getUserProfile().uid);
    querySnapshot.forEach((doc) => {
      this.datosUsuario = doc.data();
    });
    return this.datosUsuario;
  }

  //este metodo me inicia el login si hay internet y me guarda en el storage el email para que si sales de la aplicacion y entras se mantenga la sesion
  iniciarLoginOnline() {
    const user = this.db.sacarEmpleadoEmail(this.credentials.value.email);
    user.then(data => {
      if (data.empty) {
        this.showAlert('Error', 'No existe un usuario con ese email');
      } else {
        data.forEach(userData => {
          this.desenciptar(userData.data().userContrasenia);
          if (this.contraseniaDesencriptada === this.credentials.value.password) {
            this.storage.set('email', this.credentials.value.email);
            this.router.navigateByUrl(`/tabs`);
          } else {
            this.showAlert('Error', 'Contraseña incorrecta');
          }
        });
      }
    });
  }

  //este metodo me desencripta la contraseña que tengo guardada en la base de datos
  async desenciptar(datos) {
    const bytes = CryptoJS.AES.decrypt(datos, this.secretKey);
    this.contraseniaDesencriptada = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  //me inserta los datos de la externa en la local de la tabla de usuarios
  insertardatosUsuarios() {
    const users = this.db.obtenerDatosEmpleados();
    // eslint-disable-next-line @typescript-eslint/no-shadow
    users.then(res => {
      res.forEach(usuario => {
        this.dbLocal.aniadirUsuarios(
          usuario.data().userCategoria,
          usuario.data().userDni,
          usuario.data().userEmail,
          usuario.data().userName,
          usuario.data().userTrabajo,
          usuario.data().userContrasenia
        );
      });
    });
  }

  //me inserta los datos de la externa en la local de la tabla de obras
  insertardatosObras(){
    const obras = this.db.obtenerDatosObras();
    obras.then(res=>{
      res.forEach(obra =>{
        this.dbLocal.aniadirObras(
          obra.data().obraLatitud,
          obra.data().obraLongitud,
          obra.data().obraName
        );
      });
    });
  }

  //me inserta los datos de la externa en la local de la tabla de trabajos
  insertardatosTrabajos(){
    const obras = this.db.obtenerDatosTrabajos();
    obras.then(res=>{
      res.forEach(trabajo =>{
        this.dbLocal.aniadirTrabajos(
          trabajo.data().identificadorTrabajo,
          trabajo.data().nombreTrabajo,
        );
      });
    });
  }

  //me inserta los datos de la externa en la local de la tabla de motivos
  insertardatosMotivos(){
    const obras = this.db.obtenerDatosMotivos();
    obras.then(res=>{
      res.forEach(motivo =>{
        this.dbLocal.aniadirMotivos(
          motivo.data().identificadorMotivo,
          motivo.data().nombreMotivo,
        );
      });
    });
  }

  //este metodo me comprueba el internet y me realiza los diferentes metodos para insertar datos
  comprobarInternet(){
    const network = Network.getStatus().then(data=>{
      this.estado = data.connected;
      if(!this.estado){
      }else{
        this.dbLocal.dbState().subscribe((res) => {
          console.log(res);
          if(res){
            this.dbLocal.borrarDatosTablaUsers();
            this.dbLocal.borrarDatosTablaObras();
            this.dbLocal.borrarDatosTablaTrabajos();
            this.dbLocal.borrarDatosTablaMotivos();

            this.insertardatosUsuarios();
            this.insertardatosMotivos();
            this.insertardatosTrabajos();
            this.insertardatosObras();
          }
        });
      }
    });
  }

  //este metodo me inicia el login si no hay internet y me guarda en el storage el email para que si sales de la aplicacion y entras se mantenga la sesion
  iniciarLoginOffline(res){
    this.desenciptar(res.userContrasenia);
    if(this.contraseniaDesencriptada === this.credentials.value.password){
      this.storage.set('email', this.credentials.value.email);
      this.router.navigateByUrl(`/tabs`);
    }else{
      this.showAlert('Error', 'La contraseña o el email no es correcto');
    }
  }
}

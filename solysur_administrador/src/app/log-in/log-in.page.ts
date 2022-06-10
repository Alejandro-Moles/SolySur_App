import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import {AppComponent} from '../app.component';
import {passwordValidation} from '../validators/password';
import { AuthService } from '../services/auth.service';
import { NavController} from '@ionic/angular';
import {DbService} from '../services/db.service';
import { Network } from '@capacitor/network';
import {SQLite} from '@ionic-native/sqlite/ngx';
import {DbLocalService} from '../services/db-local.service';
import * as CryptoJS from 'crypto-js';
import {Storage} from '@ionic/storage-angular';


@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.page.html',
  styleUrls: ['./log-in.page.scss'],
})
export class LogInPage implements OnInit {
  credentials: FormGroup;
  showPass= false;
  passIcon = 'eye-off-outline';
  datosUsuario: any;
  estado: any;
  baseDatosLocal: boolean;

  data: any[] = [];
  userLocal: any;
  secretKey = 'yoursecretkey';
  contraseniaDesencriptada ='';

  //TODO La mayoria de los metodos estan ya comentados en el codigo de la aplicacion de solysur_empleados_final

  constructor(private fb: FormBuilder,
              private loadingController: LoadingController,
              private alertController: AlertController,
              private router: Router,
              private appComponent: AppComponent,
              private auth: AuthService,
              public navCtrl: NavController,
              private db: DbService,
              private sqLite: SQLite,
              private dbLocal: DbLocalService,
              private storage: Storage) {
  }

  ngOnInit() {
    this.comprobarInternet();
    this.storage.create();

    this.credentials = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidation()]],
    });
    this.storage.get('email').then(value =>{
      if(value !== null){
        this.router.navigateByUrl(`/tabs`);
      }
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

  getemail() {
    return this.credentials.get('email');
  }

  getpassword() {
    return this.credentials.get('password');
  }


  async login() {
      const network = Network.getStatus().then(data=>{
        this.estado = data.connected;
        if(!this.estado){
          const user = this.dbLocal.obtenerUsuarioPorEmail(this.credentials.value.email);
          user.then(res => {
            if(res === false){
              this.showAlert('Error', 'Ha ocurrido un error inesperado');
            }else{
              this.ingresarOffline(res);
            }
          });
        }else{
          this.realizarLogin();
        }
      });
  }

  async showAlert(header, message) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }


  async realizarLogin(){
    const loading = await this.loadingController.create();
    await loading.present();

    const user = this.db.sacarAdministrador(this.credentials.value.email);
    user.then(data=>{
      if(data.empty){
        this.showAlert('Error', 'No existe un usuario con ese email');
      }else{
        data.forEach(userData =>{
          this.desenciptar(userData.data().userContrasenia);
          if(this.contraseniaDesencriptada === this.credentials.value.password){
            loading.dismiss();
            this.storage.set('email', this.credentials.value.email);
            this.router.navigateByUrl(`/tabs`);
          }else{
            this.showAlert('Error', 'Contraseña incorrecta');
            loading.dismiss();
          }
        });
      }
      loading.dismiss();
    });
  }

  async desenciptar(datos){
    const bytes = CryptoJS.AES.decrypt(datos,this.secretKey);
    this.contraseniaDesencriptada = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  async ingresarOffline(res){
    const loading = await this.loadingController.create();
    await loading.present();

    this.desenciptar(res.userContrasenia);

    if(this.contraseniaDesencriptada === this.credentials.value.password){
      loading.dismiss();
      this.storage.set('email', this.credentials.value.email);
      this.router.navigateByUrl(`/tabs`);
    }else{
      loading.dismiss();
      this.showAlert('Error', 'La contraseña o el email no es correcto');
    }
  }

  insertardatosUsuarios(){
    const users = this.db.obtenerDatosEmpleados();
    // eslint-disable-next-line @typescript-eslint/no-shadow
    users.then(res =>{
      res.forEach(usuario =>{
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

  insertardatosMotivos(){
    const obras = this.db.sacarMotivos();
    obras.then(res=>{
      res.forEach(motivo =>{
        this.dbLocal.aniadirMotivos(
          motivo.data().identificadorMotivo,
          motivo.data().nombreMotivo,
        );
      });
    });
  }

  comprobarInternet(){
    const network = Network.getStatus().then(data=>{
      this.estado = data.connected;
      if(!this.estado){
      }else{
        this.dbLocal.dbState().subscribe((res) => {
          if(res){
            this.dbLocal.borrarDatosTablaUsers();
            this.dbLocal.borrarDatosTablaObras();
            this.dbLocal.borrarDatosTablaTrabajos();
            this.dbLocal.borrarDatosTablaMotivos();
            this.dbLocal.borrarDatosTablaFichajes();

            this.insertardatosUsuarios();
            this.insertardatosObras();
            this.insertardatosTrabajos();
            this.insertardatosMotivos();
            this.insertardatosFichajes();
          }
        });
      }
    });
  }

  insertardatosFichajes(){
    console.log('Rellenando fichgajes');
    const fichajes = this.db.sacarFichajes();
    fichajes.then(res => {
      res.forEach(fichaje => {
        console.log(JSON.stringify(fichaje.data()));
        this.dbLocal.aniadirFichajes(
          fichaje.data().fichajeNombre,fichaje.data().fichajeDni,
          fichaje.data().fichajeTrabajo,fichaje.data().fichajeObra,
          fichaje.data().fichajeEstadoEntrada,fichaje.data().fichajeEstadoSalida,
          fichaje.data().fichajeMotivoEntrada,fichaje.data().fichajeMotivoSalida,
          fichaje.data().fichajeFechaDia, fichaje.data().fichajeFechaMes,
          fichaje.data().fichajeFechaAnio, fichaje.data().fichajeHoraEntrada,
          fichaje.data().fichajeHoraSalida, fichaje.data().fichajeIdentificador
        );
      });
    });
  }
}

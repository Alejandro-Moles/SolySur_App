import {Component, OnInit} from '@angular/core';
import {AlertController, LoadingController} from "@ionic/angular";
import {AuthService} from "../services/auth.service";
import {Router} from "@angular/router";
import {DbService} from "../services/db.service";
import {Network} from '@capacitor/network';
import {fromEvent} from "rxjs";
import {debounceTime} from "rxjs/operators";
import {Storage} from "@ionic/storage-angular";
import {DbLocalService} from "../services/db-local.service";




@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit{

  nombreUsuario: any;
  correoUsuario: any;
  ocupacionUsuario: any;
  categoriaUsuario: any;
  estado: boolean;

  emailSesionIniciada: string;


  constructor(
    private alertController: AlertController,
    private auth: AuthService,
    private router: Router,
    private db: DbService,
    private loadingController: LoadingController,
    private storage: Storage,
    private dbLocal: DbLocalService
  ) {}

  ngOnInit(): void {
    Network.addListener('networkStatusChange', status => {
      console.log(status.connected);
      if (status.connected) {
        //this.showAlert('Modo Online', 'Ahora mismo usted tiene conexion a internet');
        this.estado = true;
        this.syncUsuarios();
        this.syncObras();
        this.syncMotivos();
        this.syncMotivosActualizar();
        this.syncTrabajos();
        this.syncTrabajosActualizar();
        this.comprobarInternet();
      } else {
        //this.showAlert('Modo Offline', 'Ahora mismo usted no tiene conexion a internet');
        this.estado = false;
      }
    });
  }

  async logOut(){
    const header = 'Cerrar Sesión';
    const message =  '¿Estas seguro que quieres cerrar sesión?';
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          id: 'cancel-button',
          handler: (blah) => {
          }
        }, {
          text: 'Okay',
          id: 'confirm-button',
          handler: () => {
            this.storage.remove('email');
            this.router.navigateByUrl(``);
          }
        }
      ]
    });
    await alert.present();
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
  ionViewWillEnter(): boolean | Promise<any>{
    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      if (!this.estado) {
        //aqui no tendria conexion a internet
        this.rellenarDatosUsuarioOffline();
      } else {
        //aqui si tendria conexion a internet y me cargaria los datos de la externa en la local y me sincronizaria la local con la externa
        this.rellerarDatosUsuario();
        this.syncUsuarios();
        this.syncObras();
        this.syncMotivos();
        this.syncMotivosActualizar();
        this.syncTrabajos();
        this.syncTrabajosActualizar();
      }
    });
  }


  async rellerarDatosUsuario(){
    this.storage.get('email').then(value =>{
      if(value !== null){
        this.obtenerDatosPorEmail(value);
      }
    });
  }

  rellenarDatosUsuarioOffline(){
    this.storage.get('email').then(value =>{
      if(value !== null){
        this.obtenerDatosPorEmailOffline(value);
      }
    });
  }

  //me carga los datos del usuario pasandole un email en online
  async obtenerDatosPorEmail(email){
    const querySnapshot = await this.db.sacarAdministrador(email);
    querySnapshot.forEach((doc)=>{
      this.nombreUsuario = doc.data().userName;
      this.correoUsuario = doc.data().userEmail;
      this.categoriaUsuario = doc.data().userCategoria;
      this.ocupacionUsuario = doc.data().userTrabajo;
    });

    if(this.categoriaUsuario){
      this.categoriaUsuario = 'Administrador';
    }else{
      this.categoriaUsuario = 'Empleado';
    }
  }

  async obtenerDatosPorEmailOffline(email){
    const user = this.dbLocal.obtenerUsuarioPorEmail(email);
    user.then(res =>{
      if(res){
        this.insertarDatosOffline(res);
      }
    });
  }

//me carga los datos del usuario pasandole un email en offline
  insertarDatosOffline(res){
    this.nombreUsuario = res.userName;
    this.correoUsuario = res.userEmail;
    this.categoriaUsuario = res.userCategoria;
    this.ocupacionUsuario = res.userTrabajo;

    if(this.categoriaUsuario){
      this.categoriaUsuario = 'Administrador';
    }else{
      this.categoriaUsuario = 'Empleado';
    }
  }


  //me sincroniza los datos de usuarios
  syncUsuarios(){
    this.storage.get('usuario').then(value =>{
      if(value !== null){
        this.db.sincronizarDatosUsuarios(value);
        this.showAlert('Informacion', 'Se ha actualizado los usuarios');
        this.storage.remove('usuario');
      }
    });
  }

  //me sincroniza los datos de obras
  syncObras(){
    this.storage.get('obras').then(value =>{
      if(value !== null){
        this.db.sincronizarDatosObras(value);
        this.showAlert('Informacion', 'Se ha actualizado las obras');
        this.storage.remove('obras');
      }
    });
  }

  //me sincroniza los datos de motivos
  syncMotivos(){
    this.storage.get('motivosInsertar').then(value =>{
      if(value !== null){
        this.db.sincronizarDatosMotivosInsertar(value);
        this.showAlert('Informacion', 'Se ha actualizado los motivos, se han insertado motivos');
        this.storage.remove('motivosInsertar');
      }
    });
  }

  //me sincroniza los datos de motivos que se tienen que actualizar
  syncMotivosActualizar(){
    this.storage.get('motivosActualizar').then(value=>{
      if(value !== null){
        this.db.sincronizarDatosMotivosActualizar(value);
        this.showAlert('Informacion', 'Se ha actualizado los motivos, se han actualizado motivos');
        this.storage.remove('motivosActualizar');
      }
    });
  }

  //me sincroniza los datos de trabajos
  syncTrabajos(){
    this.storage.get('trabajosInsertar').then(value=>{
      if(value !== null){
        this.db.sincronizarDatosTrabajosInsertar(value);
        this.showAlert('Informacion', 'Se ha actualizado los trabajos, se han insertado trabajos');
        this.storage.remove('trabajosInsertar');
      }
    });
  }

  //me sincroniza los datos de trabajos que se tienen que actualizar
  syncTrabajosActualizar(){
    this.storage.get('trabajosActualizar').then(value=>{
      if(value !== null){
        this.db.sincronizarDatosTrabajosActualizar(value);
        this.showAlert('Informacion', 'Se ha actualizado los trabajos, se han actualizado trabajos');
        this.storage.remove('trabajosActualizar');
      }
    });
  }

  //este metodo me comprueba si hay internet, y si hay me mete ls datos de la externa en la local y me sincroniza los datos
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

  //TODO Los sigueintes metodos me cargan los datos de la base de datos local en sus respectiovas tablas de la base de datos local
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
    const trabajos = this.db.obtenerDatosTrabajos();
    trabajos.then(res=>{
      res.forEach(trabajo =>{
        this.dbLocal.aniadirTrabajos(
          trabajo.data().identificadorTrabajo,
          trabajo.data().nombreTrabajo,
        );
      });
    });
  }

  insertardatosMotivos(){
    const motivos = this.db.sacarMotivos();
    motivos.then(res=>{
      res.forEach(motivo =>{
        this.dbLocal.aniadirMotivos(
          motivo.data().identificadorMotivo,
          motivo.data().nombreMotivo,
        );
      });
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

import { Component, OnInit} from '@angular/core';
import {ActionSheetController, AlertController, ModalController} from '@ionic/angular';
import {AddEmpleadosPage} from '../add-empleados/add-empleados.page';
import {DbService} from '../services/db.service';
import {ChangeDetectorRef} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';
import {FichajesEmpleadosPage} from "../fichajes-empleados/fichajes-empleados.page";
import {Network} from "@capacitor/network";
import {DbLocalService} from "../services/db-local.service";
import {user} from "@angular/fire/auth";
import {Storage} from "@ionic/storage-angular";

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit{

  public arrayEmpleados: Array<any>;
  estado: any;

  constructor(
    private modalController: ModalController,
    private db: DbService,
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private alertController: AlertController,
    private router: Router,
    public actionSheetController: ActionSheetController,
    private dbLocal: DbLocalService,
    private storage: Storage
  ) {
  }

  //metodo que me abre un modal, donde se añadiran empleados
  async presentModal() {
    const modal = await this.modalController.create({
      component: AddEmpleadosPage,
    });
    return await modal.present();
  }

  async ngOnInit() {
  }


  //metodo que me deslogea
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
            //quito del storage el campo email para que no se pueda volver a iniciar sesion sin ingrsear la contraseña
            this.storage.remove('email');
            this.router.navigateByUrl(``);
          }
        }
      ]
    });
    await alert.present();
  }


  // @ts-ignore
  ionViewWillEnter(): boolean | Promise<any>{
    //dependiendo de si hay internet o no, mecarga los datos que se vana usar de una manera u otra
    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      console.log(this.estado);
      if (!this.estado) {
        this.insertardatosEmpleadosOffline();
      } else {
        this.insertardatosEmpleadosOnline();
      }
    });
  }

  //me muestra una ventana de opciones para el usuario seleccionado
  public async showActionSheet(empleado) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Empleados',
      buttons: [
        {
          text: 'Fichajes',
          role: '',
          icon: 'receipt',
          handler: () => {
            this.presentFichajes(empleado);
          }
        }]
    });
    await actionSheet.present();
  }

  //este metodo me manda a otro eb el que se abre el modal de fichajes dependiendo de si hay internet o no me manda a uno u otro
  async presentFichajes(empleado){
    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      console.log(this.estado);
      if (!this.estado) {
        this.abrirModalOffline(empleado);
      } else {
        this.abrirModalOnline(empleado);
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


  async insertardatosEmpleadosOnline(){
    this.arrayEmpleados = new Array();
    console.log('Entra en online');
    const empleados = await this.db.obtenerDatosEmpleados();
      empleados.forEach((data=>{
        console.log(JSON.stringify(data));
        this.arrayEmpleados.push(data.data());
      }));
  }

  insertardatosEmpleadosOffline(){
    const empleados = this.dbLocal.fetchUsers();
    empleados.subscribe(data =>{
      this.arrayEmpleados = data;
    });
  }

  async abrirModalOnline(empleado){
    const fichaje = await this.db.obtenerDatosFichajes(empleado.userDni);
    if(fichaje.empty){
      this.showAlert('Error', 'Este trabajador todavia no tiene registrado ningun fichaje');
    }else{
      this.abrirModal(empleado);;
    }
  }

  async abrirModalOffline(empleado){
    this.dbLocal.obtenerFichajePorDni(empleado.userDni).then(value => {
      if(!value){
        this.showAlert('Error', 'Este trabajador todavía no tiene fichajes');
      }else{
        this.abrirModal(empleado);
      }
    });
  }

  async abrirModal(empleado){
    console.log(JSON.stringify(empleado));
    const modal = await this.modalController.create({
      component: FichajesEmpleadosPage,
      componentProps:{
        empleado
      }
    });
    return await modal.present();
  }
}

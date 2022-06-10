import { Component } from '@angular/core';
import {ActionSheetController, AlertController, ModalController} from "@ionic/angular";
import {AuthService} from "../services/auth.service";
import {Router} from "@angular/router";
import {AddObrasPage} from "../add-obras/add-obras.page";
import {DbService} from "../services/db.service";
import {Network} from "@capacitor/network";
import {DbLocalService} from "../services/db-local.service";
import {Storage} from "@ionic/storage-angular";


@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  public arrayObras: Array<any>;
  estado: any;

  constructor(
    private alertController: AlertController,
    private auth: AuthService,
    private router: Router,
    private modalController: ModalController,
    private db: DbService,
    public actionSheetController: ActionSheetController,
    private dbLocal: DbLocalService,
    private storage: Storage
  ) {
  }

  async logOut() {
    const header = 'Cerrar Sesión';
    const message = '¿Estas seguro que quieres cerrar sesión?';
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

  async presentModal() {
    const modal = await this.modalController.create({
      component: AddObrasPage,
    });

    return await modal.present();
  }

  // @ts-ignore
  ionViewWillEnter(): boolean | Promise<any> {
    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      if (!this.estado) {
        //aqui no tendria conexion a internet
        this.rellenarDatosObrasOffline();
      } else {
        //aqui si tendria conexion a internet
        this.rellerarDatosObrasOnline();
      }
    });
  }
  mensajeInternet(){
    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      if (!this.estado) {
        this.showAlert('Modo Offline', 'Ahora mismo usted no tiene conexión a internet');
      } else {
        this.showAlert('Modo Online', 'Ahora mismo usted tiene conexión a internet');
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

  //me rellena los datos de las obras si no hay internet
  rellenarDatosObrasOffline(){
    const obras = this.dbLocal.fetchObra();
    obras.subscribe(data=>{
      this.arrayObras = data;
    });
  }

  //me rellena los datos de las obras si hay internet
  rellerarDatosObrasOnline(){
    this.arrayObras = new Array();
    const obras = this.db.obtenerDatosObras();
    obras.then(datos => {
      datos.forEach((data => {
        this.arrayObras.push(data.data());
      }));
    });
  }
}

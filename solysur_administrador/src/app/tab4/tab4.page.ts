import { Component, OnInit } from '@angular/core';
import {ActionSheetController, AlertController, LoadingController} from '@ionic/angular';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';
import {DbService} from '../services/db.service';
import {Network} from '@capacitor/network';
import {DbLocalService} from '../services/db-local.service';
import {Storage} from "@ionic/storage-angular";

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page implements OnInit {

  arrayMotivos: any;
  estado: any;
  objetoMotivo: Array<any>;
  constructor(
    private alertController: AlertController,
    private auth: AuthService,
    private router: Router,
    private db: DbService,
    private loadingController: LoadingController,
    public actionSheetController: ActionSheetController,
    private dbLocal: DbLocalService,
    private storage: Storage
  ) { }

  ngOnInit() {
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

  // @ts-ignore
  ionViewWillEnter(): boolean | Promise<any> {
    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      console.log(this.estado);
      if (!this.estado) {
        //aqui no tendria conexion a internet
        this.rellenarDatosMotivosOffline();
      } else {
        //aqui si tendria conexion a internet
        this.rellerarDatosMotivosOnline();
      }
    });
  }

  //TODO Este metodo me muestra un input donde se tendran que insertar dos valores, el motivo y su identificador. Esto se hara pora insertarlos en la base de datos
  async mostrarInputMotivosInsertar(){
    const alert = await this.alertController.create({
      header: 'Seleccione el motivo de la falta y su identificador',
      inputs: [
        {
          name: 'txtMotivo',
          type: 'text',
          placeholder: 'Motivo'
        },{
          name: 'txtIdentificador',
          type: 'text',
          placeholder: 'Identificador'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          id: 'cancel-button',
          handler: (blah) => {
          }
        }, {
          text: 'Ok',
          handler: ( data ) => {
            if(data.txtMotivo === '' || data.txtIdentificador === ''){
              this.showAlert('Error', 'Necesita rellenar los campos');
            }else{
              const network = Network.getStatus().then(conexion=> {
                this.estado = conexion.connected;
                if (!this.estado) {
                  //aqui no tendria conexion a internet
                  this.aniadirMotivoOffline(data.txtMotivo, data.txtIdentificador);
                } else {
                  //aqui si tendria conexion a internet
                  this.aniadirMotivoOnline(data.txtMotivo, data.txtIdentificador);
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  //Metodo que me añade el motivo en la bas de datos externa
  async aniadirMotivoOnline(motivo, identificador){
    const loading = await this.loadingController.create();
    await loading.present();
    const comprobarMotivo = this.db.sacarMotivosPorIdentificador(identificador);
    comprobarMotivo.then(data =>{
      if(data.empty){
        const meterMotivo = this.db.meterMotivo(motivo, identificador);
        //tambien me la añade en la local para que aparezca si se va el internet
        this.dbLocal.aniadirMotivos(identificador,motivo);
        meterMotivo.then(dato =>{
          if(dato === 0){
            this.showAlert('Motivo insertado', 'Todo ha salido correctamente');
            loading.dismiss();
            this.ionViewWillEnter();
          }else{
            this.showAlert('Error', 'Ha habido un error al insertar el motivo');
            loading.dismiss();
          }
        });
      }else{
        //si hay un motivo con un identificador ya existente salta este error
        this.showAlert('Error', 'Ya existe  un motivo con ese identificador');
        loading.dismiss();
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


  //este metodo me abre una ventana donde se muetran las opciones que se pueden hacer con ese motivo
  public async showActionSheet(motivo) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Motivo',
      buttons: [
        {
          text: 'Editar',
          role: '',
          icon: 'build',
          handler: () => {
            this.mostrarInputMotivosEditar(motivo);
          }
        }]
    });
    await actionSheet.present();
  }


  //TODO Este metodo me muestra un input donde se escribira el motivo para que se actualice el texto del motivo en si
  async mostrarInputMotivosEditar(motivo){
    const alert = await this.alertController.create({
      header: 'Escriba los datos que quiere editar',
      inputs: [
        {
          name: 'txtMotivo',
          type: 'text',
          value: motivo.nombreMotivo,
          placeholder: 'Motivo'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          id: 'cancel-button',
          handler: (blah) => {
          }
        }, {
          text: 'Ok',
          handler: ( data ) => {
            //data es lo que el usuario ha escrito, si esta vacio salta un error
            if(data.txtMotivo === ''){
              this.showAlert('Error', 'Necesita rellenar los campos');
            }else{
              const network = Network.getStatus().then(conexion=> {
                this.estado = conexion.connected;
                if (!this.estado) {
                  //aqui no tendria conexion a internet
                  this.modificarMotivoOffline(data.txtMotivo, motivo.identificadorMotivo);
                } else {
                  //aqui si tendria conexion a internet
                  this.modificarMotivoOnline(data.txtMotivo,motivo.identificadorMotivo);
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  //Este metodo me modifica en motivo si  hay internet, por lo que me modificaria el motivo en la base de datos externa y local
  async modificarMotivoOnline(motivo, identificador){
    const loading = await this.loadingController.create();
    await loading.present();
    const modificarMotivo = this.db.modificarMotivo(motivo,identificador);
    modificarMotivo.then(dato =>{
      if(dato === 0){
        this.showAlert('Motivo insertado', 'Todo ha salido correctamente');
        loading.dismiss();
        this.ionViewWillEnter();
      }else{
        this.showAlert('Error', 'Ha habido un error al insertar el motivo');
        loading.dismiss();
      }
    });
  }

  //este metodo me rellena el array de motivos si no hay internet, es decir me coge los datos de la base de datos local
  rellenarDatosMotivosOffline(){
    this.arrayMotivos = new Array();
    const motivo = this.dbLocal.fetchMotivo();
    motivo.subscribe(data =>{
      this.arrayMotivos = data;
      console.log(JSON.stringify(data));
    });
  }

  //este metodo me rellena el array de motivos si hay internet, es decir me coge los datos de la base de datos externa
  rellerarDatosMotivosOnline(){
    this.arrayMotivos = new Array();
    const obras = this.db.sacarMotivos();
    obras.then(datos => {
      datos.forEach((data => {
        this.arrayMotivos.push(data.data());
      }));
    });
  }

  //Este metodo me modifica en motivo si no hay internet, por lo que me añadiria el motivo en la base de datos local
  async aniadirMotivoOffline(motivo, identificador){
    const loading = await this.loadingController.create();
    await loading.present();
    const comprobarMotivo = this.dbLocal.obtenerMotivoPorIdentificador(identificador);
    comprobarMotivo.then(data =>{
      if(!data){
        this.dbLocal.aniadirMotivos(identificador,motivo);
        this.storageMotivoInsertar(motivo,identificador);
        this.showAlert('Motivo insertado', 'Motivo insertado correctamente');
        this.ionViewWillEnter();
      }else{
        this.showAlert('Error', 'Ya hay un motivo con ese identificador');
      }
      loading.dismiss();
    });
  }

  //este metodo me inserta en el storage el o los motivos que se han insertado mientras no habia internet, para mas tarde sincronizarlos
  storageMotivoInsertar(motivo, identificador){
    this.objetoMotivo = new Array();
    const dato = {
      nombreMotivo: motivo,
      identificadorMotivo: identificador
    };

    this.storage.get('motivosInsertar').then(value=>{
      if(value !== null){
        value.forEach(data =>{
          this.objetoMotivo.push(data);
        });
        this.objetoMotivo.push(dato);
        this.storage.set('motivosInsertar', this.objetoMotivo);
      }else{
        this.objetoMotivo.push(dato);
        this.storage.set('motivosInsertar', this.objetoMotivo);
      }
    });
  }

  //Este metodo me modifica en motivo si no hay internet, por lo que me modificaria el motivo en la base de datos local
  async modificarMotivoOffline(motivo, identificador){
    const loading = await this.loadingController.create();
    await loading.present();

    this.objetoMotivo = new Array();
    const dato = {
      nombreMotivo: motivo,
      identificadorMotivo: identificador
    };
    this.dbLocal.modificarMotivos(identificador, motivo);
    //este metodo me inserta en el storage el o los motivos que se han actualizado mientras no habia internet, para mas tarde sincronizarlos
    this.storage.get('motivosActualizar').then(value=>{
      if(value !== null){
        value.forEach(data =>{
          this.objetoMotivo.push(data);
        });
        this.objetoMotivo.push(dato);
        this.storage.set('motivosActualizar', this.objetoMotivo);
      }else{
        this.objetoMotivo.push(dato);
        this.storage.set('motivosActualizar', this.objetoMotivo);
      }
    });

    this.showAlert('Motivo actualizado', 'Motivo actualizado perfectamente');
    loading.dismiss();
  }
}

import { Component, OnInit } from '@angular/core';
import {ActionSheetController, AlertController, LoadingController} from "@ionic/angular";
import {AuthService} from "../services/auth.service";
import {Router} from "@angular/router";
import {DbService} from "../services/db.service";
import {Network} from "@capacitor/network";
import {DbLocalService} from "../services/db-local.service";
import {Storage} from "@ionic/storage-angular";

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
})
export class Tab5Page implements OnInit {

  arrayTrabajos: any;
  estado: any;
  objetoTrabajo: Array<any>;

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
      if (!this.estado) {
        //aqui no tendria conexion a internet
        this.rellenarDatosTrabajosOffline();
      } else {
        //aqui si tendria conexion a internet
        this.rellerarDatosTrabajosOnline();
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

//este metodo me abre una ventana donde se muetran las opciones que se pueden hacer con ese trabajo
  public async showActionSheet(trabajo) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Ocupación',
      buttons: [
        {
          text: 'Editar',
          role: '',
          icon: 'build',
          handler: () => {
            this.mostrarInputTrabajoEditar(trabajo);
          }
        }]
    });
    await actionSheet.present();
  }

  //TODO Este metodo me muestra un input donde se escribira el trabajo para que se actualice el texto del motivo en si
  async mostrarInputTrabajoEditar(trabajo){
    const alert = await this.alertController.create({
      header: 'Escriba los datos que quiere editar',
      inputs: [
        {
          name: 'txtTrabajo',
          type: 'text',
          value: trabajo.nombreTrabajo,
          placeholder: 'Ocupación'
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
            if(data.txtTrabajo === ''){
              this.showAlert('Error', 'Necesita rellenar los campos');
            }else{
              const network = Network.getStatus().then(dataTrabajo=> {
                this.estado = dataTrabajo.connected;
                if (!this.estado) {
                  //aqui no tendria conexion a internet
                  this.modificarTrabajoOffline(data.txtTrabajo,trabajo.identificadorTrabajo);
                } else {
                  //aqui si tendria conexion a internet
                  this.modificarTrabajoOnline(data.txtTrabajo,trabajo.identificadorTrabajo);
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  //TODO Este metodo me muestra un input donde se tendran que insertar dos valores, el trabajo y su identificador.
  async mostrarInputTrabajoInsertar(){
    const alert = await this.alertController.create({
      header: 'Escriba el trabajo que quiere insertar',
      inputs: [
        {
          name: 'txtTrabajo',
          type: 'text',
          placeholder: 'Ocupación'
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
            //data guarda en este caso los dos datos como si fuese un objeto y sus atributos
            if(data.txtTrabajo === '' || data.txtIdentificador ===''){
              this.showAlert('Error', 'Necesita rellenar los campos');
            }else{
              const network = Network.getStatus().then(dataTrabajo=> {
                this.estado = dataTrabajo.connected;
                if (!this.estado) {
                  //aqui no tendria conexion a internet
                  this.insertarTrabajoOffline(data.txtTrabajo,data.txtIdentificador);
                } else {
                  //aqui si tendria conexion a internet
                  this.insertarTrabajoOnline(data.txtTrabajo,data.txtIdentificador);
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  //este metodo me inserta el trabajo en la base de datos si hay internet, mete los datos tanto en la base de datos local como la externa
  async insertarTrabajoOnline(trabajo, identificador){
    const loading = await this.loadingController.create();
    await loading.present();
    const comprobarTrabajo = this.db.sacarTrabajosPorIdentificador(identificador);
    comprobarTrabajo.then(data=>{
      if(data.empty){
        //si esta vacio quiere decir que se puede insertar
        const meterTrabajo = this.db.meterTrabajos(trabajo, identificador);
        meterTrabajo.then(dato =>{
          if(dato === 0){
            this.dbLocal.aniadirTrabajos(identificador, trabajo);
            this.showAlert('Trabajo insertado', 'Todo ha salido correctamente');
            loading.dismiss();
            this.ionViewWillEnter();
          }else{
            this.showAlert('Error', 'Ha habido un error al insertar la ocupación');
            loading.dismiss();
          }
        });
      }else{
        //si ya existe un identificador para ese trabajo
        this.showAlert('Error', 'Ya existe el identificador para este trabajo');
        loading.dismiss();
      }
    });
  }

  //metodo que me llena los datos de los trabajos existentes si no hay internet
  rellenarDatosTrabajosOffline(){
    const trabajos = this.dbLocal.fetchTrabajo();
    trabajos.subscribe(data =>{
      this.arrayTrabajos = data;
    });
  }

  //metodo que me llena los datos de los trabajos existentes si hay internet
  rellerarDatosTrabajosOnline(){
    this.arrayTrabajos = new Array();
    const obras = this.db.sacarTrabajos();
    obras.then(datos => {
      datos.forEach((data => {
        this.arrayTrabajos.push(data.data());
      }));
    });
  }

  //metodo que me inserta los trabajos si no hay internet, es decir se me insertaria solo en la base de datos local
  async insertarTrabajoOffline(nombreTrabajo, identificador){
    const loading = await this.loadingController.create();
    await loading.present();

    const trabajo = this.dbLocal.obtenerTrabajoPorIdentificador(identificador);
    trabajo.then(data=>{
      if(!data){
        this.dbLocal.aniadirTrabajos(identificador,nombreTrabajo);
        this.storageInsertarTrabajo(nombreTrabajo,identificador);
        this.showAlert('Trabajo insertado', 'Trabajo insertado correctamente');
        loading.dismiss();
        this.ionViewWillEnter();
      }else{
        this.showAlert('Error', 'Ya existe un trabajo con ese identificador');
        loading.dismiss();
      }
    });
  }

  //metodo que me inserta en el storage los trabajos que se han insertado en el modo offline para que cuando haya internet me los sincronice
  storageInsertarTrabajo(trabajo, identificador){
    this.objetoTrabajo = new Array();
    const dato = {
      nombreTrabajo: trabajo,
      identificadorTrabajo: identificador
    };

    this.storage.get('trabajosInsertar').then(value=>{
      if(value !== null){
        value.forEach(data =>{
          this.objetoTrabajo.push(data);
        });
        this.objetoTrabajo.push(dato);
        this.storage.set('trabajosInsertar', this.objetoTrabajo);
      }else{
        this.objetoTrabajo.push(dato);
        this.storage.set('trabajosInsertar', this.objetoTrabajo);
      }
    });
  }

  //metodo que me modifica el trabajo si hay internet, es decir me lo actualizaria en la base de datos externa y la local
  async modificarTrabajoOnline(trabajo,identificador){
    const loading = await this.loadingController.create();
    await loading.present();
    const modificarMotivo = this.db.modificarTrabajo(trabajo,identificador);
    modificarMotivo.then(dato =>{
      if(dato === 0){
        this.showAlert('Trabajo insertado', 'Todo ha salido correctamente');
        loading.dismiss();
        this.ionViewWillEnter();
      }else{
        this.showAlert('Error', 'Ha habido un error al editar el trabajo');
        loading.dismiss();
      }
    });
  }

  //Este metodo me modifica en trabajo si no hay internet, por lo que me modificaria el trabajo en la base de datos local
  async modificarTrabajoOffline(trabajo, identificador){
    const loading = await this.loadingController.create();
    await loading.present();

    this.objetoTrabajo = new Array();
    console.log(trabajo);
    const dato = {
      nombreTrabajo: trabajo,
      identificadorTrabajo: identificador
    };

    this.dbLocal.modificarTrabajos(identificador, trabajo);
    //este metodo me inserta en el storage el o los trabajos que se han actualizado mientras no habia internet, para mas tarde sincronizarlos
    this.storage.get('trabajosActualizar').then(value=>{
      if(value !== null){
        value.forEach(data =>{
          this.objetoTrabajo.push(data);
        });
        this.objetoTrabajo.push(dato);
        this.storage.set('trabajosActualizar', this.objetoTrabajo);
      }else{
        this.objetoTrabajo.push(dato);
        this.storage.set('trabajosActualizar', this.objetoTrabajo);
      }
    });

    this.showAlert('Trabajo actualizado', 'El trabajo ha sido actualizado perfectamente');
    loading.dismiss();
  }
}

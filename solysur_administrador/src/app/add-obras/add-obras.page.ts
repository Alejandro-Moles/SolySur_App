import { Component, OnInit } from '@angular/core';
import {AlertController, LoadingController, ModalController} from "@ionic/angular";
import { Geolocation } from '@ionic-native/geolocation/ngx';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {passwordValidation} from "../validators/password";
import {DbService} from "../services/db.service";
import {Router} from "@angular/router";
import {Network} from "@capacitor/network";
import {DbLocalService} from "../services/db-local.service";
import {Storage} from "@ionic/storage-angular";


@Component({
  selector: 'app-add-obras',
  templateUrl: './add-obras.page.html',
  styleUrls: ['./add-obras.page.scss'],
})
export class AddObrasPage implements OnInit {

  datosObra: FormGroup;
  latitude: any = 0;
  longitude: any = 0;
  estado: any;
  objetoObra: Array<any>;
  constructor(private modalController: ModalController,
              private geolocation: Geolocation,
              private fb: FormBuilder,
              private alertController: AlertController,
              private loadingController: LoadingController,
              private router: Router,
              private db: DbService,
              private dbLocal: DbLocalService,
              private storage: Storage) { }
  ngOnInit() {
    this.datosObra = this.fb.group({
      name: ['', [Validators.required]],
      latitud: [this.latitude, [Validators.required, Validators.pattern(/^-?(0|[1-9.])+$/)]],
      longitud: [this.longitude, [Validators.required,Validators.pattern(/^-?(0|[1-9.])+$/)]],
    });
  }

  async closeModel(){
    const close = 'Modal Removed';
    await this.modalController.dismiss(close);
  }


  //metodo que me saca las coordenadas actuales
  getCurrentCoordinates(){
    this.geolocation.getCurrentPosition().then((resp) =>{
      this.latitude = resp.coords.latitude;
      this.longitude  = resp.coords.longitude;
    }).catch((error) =>{
      this.showAlert('Error', 'Ha ocurrido un error al intentar obtener su localización');
    });
  }

  //metodo que me da de alta la obra
  async alta(){
    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      if (!this.estado) {
        //aqui no tendria conexion a internet
        this.insertarObraOffline();
      } else {
        //aqui si tendria conexion a internet
        this.insertarObraOnline();
      }
    });
  }

  getName(){
    return this.datosObra.get('name');
  }

  getLatitud(){
    return this.datosObra.get('latitud');
  }

  getLongitud(){
    return this.datosObra.get('longitud');
  }

  async showAlert(header, message) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  //metodo que me inserta la obra si hay internet, es decir me meteria los datos en la base de datos externa y en la local
  async insertarObraOnline(){
    const loading = await this.loadingController.create();
    await loading.present();
    const obra = await this.db.insertarObra(this.datosObra.value.name, this.latitude, this.longitude);
    this.dbLocal.aniadirObras(this.datosObra.value.latitud,this.datosObra.value.longitud,this.datosObra.value.name);
    if(obra === true){
      loading.dismiss();
      this.showAlert('Obra registrada', 'Ahora este obra esta dada de alta');
      this.closeModel();
      this.router.navigateByUrl(`/tabs`);
    }else{
      this.showAlert('Error', 'Ha ocurrido un error al dar de alta la obra');
      loading.dismiss();
    }
  }

  //metodo que me inserta la obras si no hay internet, por lo que me meteria los datos en la base de datos local y en el storage
  async insertarObraOffline(){
    const obra = this.dbLocal.obtenerObraPorNombre(this.datosObra.value.name);
    obra.then(res=>{
      if(!res){
        this.insertarStorageObra();
        this.showAlert('Obra registrada', 'Ahora este obra esta dada de alta');
        this.closeModel();
        this.router.navigateByUrl(`/tabs`);
      }else{
        this.showAlert('Error', 'Ya hay una obra registrada con ese nomnre');
      }
    });
  }

  //Metodo que inserta los datos en el storage para que asi, cuando haya internet se me actualicen los datos en la abase de datos externa
  insertarStorageObra(){
    this.objetoObra = new Array<any>();
    const dato = {
      obraName: this.datosObra.value.name,
      obraLatitud: this.datosObra.value.latitud,
      obraLongitud: this.datosObra.value.longitud,
    };
    this.dbLocal.aniadirObras(this.datosObra.value.latitud,this.datosObra.value.longitud,this.datosObra.value.name);

    this.storage.get('obras').then(value =>{
      if(value !== null){
        value.forEach(datos=>{
          this.objetoObra.push(datos);
        });
        this.objetoObra.push(dato);
        this.storage.set('obras', this.objetoObra);
      }else{
        this.objetoObra.push(dato);
        this.storage.set('obras', this.objetoObra);
      }
    });
  }
}


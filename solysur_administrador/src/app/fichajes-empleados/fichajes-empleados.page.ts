import { Component, OnInit } from '@angular/core';
import {AlertController, ModalController, NavParams} from "@ionic/angular";
import {Router} from "@angular/router";
import {AuthService} from "../services/auth.service";
import {DbService} from "../services/db.service";
import {DatosFichajePage} from "../datos-fichaje/datos-fichaje.page";
import {Network} from "@capacitor/network";
import {DbLocalService} from "../services/db-local.service";

@Component({
  selector: 'app-fichajes-empleados',
  templateUrl: './fichajes-empleados.page.html',
  styleUrls: ['./fichajes-empleados.page.scss'],
})
export class FichajesEmpleadosPage implements OnInit {

  datosFichajes: any;
  textoBusqueda = '';
  identificadorFichaje: string;
  estado: any;

  constructor(private alertController: AlertController,
              private router: Router,
              private auth: AuthService,
              private modalController: ModalController,
              private parametros: NavParams,
              private db: DbService,
              private dbLocal: DbLocalService) { }

  ngOnInit() {
  }

  async closeModel(){
    const close = 'Modal Removed';
    await this.modalController.dismiss(close);
  }

  // @ts-ignore
  async ionViewWillEnter(): boolean | Promise<any> {
    const network = Network.getStatus().then(data=> {
      this.estado = data.connected;
      if (!this.estado) {
        //aqui no tendria conexion a internet
        this.cargarArrayFichajesOffline();
      } else {
        //aqui si tendria conexion a internet
        this.cargarArrayFichajesOnline();
      }
    });
  }

  async buscar(event){
    this.textoBusqueda = event.detail.value;
  }


  async abrirDatosFichajes(fichaje){
    const modal = await this.modalController.create({
      component: DatosFichajePage,
      componentProps:{
        fichaje
      }
    });
    return await modal.present();
  }

  async cargarArrayFichajesOffline(){
    this.dbLocal.obtenerFichajePorDniLista(this.parametros.data.empleado.userDni);
    this.datosFichajes = new Array();
    const fichajes =  this.dbLocal.fetchFichajesDni().subscribe(data =>{
      this.datosFichajes = data;
    });
  }

  async cargarArrayFichajesOnline(){
    this.datosFichajes = new Array();
    const fichaje = await this.db.obtenerDatosFichajes(this.parametros.data.empleado.userDni);
    fichaje.forEach((doc)=>{
      this.datosFichajes.push(doc.data());
    });
  }

}

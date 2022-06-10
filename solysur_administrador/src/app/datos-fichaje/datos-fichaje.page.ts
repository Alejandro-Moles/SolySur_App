import { Component, OnInit } from '@angular/core';
import {AlertController, ModalController, NavParams} from "@ionic/angular";
import {Router} from "@angular/router";
import {AuthService} from "../services/auth.service";

@Component({
  selector: 'app-datos-fichaje',
  templateUrl: './datos-fichaje.page.html',
  styleUrls: ['./datos-fichaje.page.scss'],
})
export class DatosFichajePage implements OnInit {

  constructor(private alertController: AlertController,
              private router: Router,
              private auth: AuthService,
              private modalController: ModalController,
              private parametros: NavParams,) { }

  ngOnInit() {
  }

  async closeModel(){
    const close = 'Modal Removed';
    await this.modalController.dismiss(close);
  }


  // @ts-ignore
  ionViewWillEnter(): boolean | Promise<any>{
    console.log(this.parametros.data.fichaje.fichajeDni);
  }
}

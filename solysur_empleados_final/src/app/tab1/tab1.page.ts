import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {DbService} from '../services/db.service';
import {AlertController, LoadingController} from '@ionic/angular';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as moment from 'moment';
import { Geolocation } from '@ionic-native/geolocation/ngx';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  constructor( private auth: AuthService,
               private alertController: AlertController,
               private router: Router,
               ) {
  }
  ngOnInit(): void {
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
            this.auth.logout();
            this.router.navigateByUrl(``);
          }
        }
      ]
    });
    await alert.present();
  }
}

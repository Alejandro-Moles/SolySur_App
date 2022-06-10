import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DatosFichajePageRoutingModule } from './datos-fichaje-routing.module';

import { DatosFichajePage } from './datos-fichaje.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DatosFichajePageRoutingModule
  ],
  declarations: [DatosFichajePage]
})
export class DatosFichajePageModule {}

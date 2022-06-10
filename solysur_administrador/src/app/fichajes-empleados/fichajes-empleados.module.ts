import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FichajesEmpleadosPageRoutingModule } from './fichajes-empleados-routing.module';

import { FichajesEmpleadosPage } from './fichajes-empleados.page';
import {PipesModule} from "../pipes/pipes.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FichajesEmpleadosPageRoutingModule,
    PipesModule
  ],
  declarations: [FichajesEmpleadosPage]
})
export class FichajesEmpleadosPageModule {}

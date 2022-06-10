import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AddEmpleadosPageRoutingModule } from './add-empleados-routing.module';
import { AddEmpleadosPage } from './add-empleados.page';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddEmpleadosPageRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [AddEmpleadosPage]
})
export class AddEmpleadosPageModule {}

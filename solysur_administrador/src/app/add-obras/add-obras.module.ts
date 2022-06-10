import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AddObrasPageRoutingModule } from './add-obras-routing.module';
import { AddObrasPage } from './add-obras.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddObrasPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [AddObrasPage]
})
export class AddObrasPageModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddEmpleadosPage } from './add-empleados.page';

const routes: Routes = [
  {
    path: '',
    component: AddEmpleadosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddEmpleadosPageRoutingModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FichajesEmpleadosPage } from './fichajes-empleados.page';

const routes: Routes = [
  {
    path: '',
    component: FichajesEmpleadosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FichajesEmpleadosPageRoutingModule {}

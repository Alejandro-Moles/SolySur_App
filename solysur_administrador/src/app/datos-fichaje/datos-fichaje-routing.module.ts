import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DatosFichajePage } from './datos-fichaje.page';

const routes: Routes = [
  {
    path: '',
    component: DatosFichajePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DatosFichajePageRoutingModule {}

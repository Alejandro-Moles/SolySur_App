import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddObrasPage } from './add-obras.page';

const routes: Routes = [
  {
    path: '',
    component: AddObrasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddObrasPageRoutingModule {}

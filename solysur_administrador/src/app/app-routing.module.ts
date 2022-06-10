import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: '',
    loadChildren: () => import('./log-in/log-in.module').then( m => m.LogInPageModule)
  },
  {
    path: 'tab4',
    loadChildren: () => import('./tab4/tab4.module').then( m => m.Tab4PageModule)
  },
  {
    path: 'add-empleados',
    loadChildren: () => import('./add-empleados/add-empleados.module').then( m => m.AddEmpleadosPageModule)
  },  {
    path: 'add-obras',
    loadChildren: () => import('./add-obras/add-obras.module').then( m => m.AddObrasPageModule)
  },
  {
    path: 'fichajes-empleados',
    loadChildren: () => import('./fichajes-empleados/fichajes-empleados.module').then( m => m.FichajesEmpleadosPageModule)
  },
  {
    path: 'datos-fichaje',
    loadChildren: () => import('./datos-fichaje/datos-fichaje.module').then( m => m.DatosFichajePageModule)
  },
  {
    path: 'tab5',
    loadChildren: () => import('./tab5/tab5.module').then( m => m.Tab5PageModule)
  }

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

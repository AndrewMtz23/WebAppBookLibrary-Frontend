import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AccountRecoveryComponent } from './account-recovery.component';
import { PublicShellComponent } from '../../core/layouts/public-shell/public-shell.component';

const routes: Routes = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: AccountRecoveryComponent, data: { mode: 'forgot' } },
      { path: 'reset-password', component: AccountRecoveryComponent, data: { mode: 'reset' } },
      { path: 'verify-email', component: AccountRecoveryComponent, data: { mode: 'verify' } },
      { path: '', pathMatch: 'full', redirectTo: 'login' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}

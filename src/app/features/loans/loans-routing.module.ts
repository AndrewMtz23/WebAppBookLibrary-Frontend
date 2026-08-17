import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoansUserComponent } from './loansuser/loansuser.component';

import { AuthGuard } from 'src/app/core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LoansUserComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoansRoutingModule {}

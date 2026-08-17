// 📁 features/security-dashboard/security-dashboard-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SecurityDashboardComponent } from './security-dashboard.component';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { RoleGuard } from 'src/app/core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: SecurityDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: ['admin'] // ✅ SOLO ADMINISTRADORES
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecurityDashboardRoutingModule {}
import { StaffPageHeaderComponent } from '../../../../shared/ui/staff-page-header/staff-page-header.component';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardPeriodControlsComponent } from '../../../../shared/dashboard/dashboard-period-controls.component';
import { DashboardRankComponent, DashboardRankLink } from '../../../../shared/dashboard/dashboard-rank.component';
import { DashboardSeriesComponent } from '../../../../shared/dashboard/dashboard-series.component';
import { MetricCardComponent } from '../../../../shared/dashboard/metric-card.component';
import { AdminDashboardFacade } from '../data-access/admin-dashboard.facade';
import { AdminDashboardResponse } from '../data-access/admin-dashboard.models';

@Component({ selector:'app-admin-dashboard-page', standalone:true, imports: [StaffPageHeaderComponent, DatePipe,RouterLink,DashboardPeriodControlsComponent,DashboardRankComponent,DashboardSeriesComponent,MetricCardComponent], providers:[AdminDashboardFacade], templateUrl:'./admin-dashboard-page.component.html', styleUrl:'../../../../shared/dashboard/dashboard-page.scss', styles:['.distribution li{display:block;padding:0}.distribution li a{display:flex;justify-content:space-between;padding:.5rem 0;color:var(--color-text);text-decoration:none}.distribution li a:hover,.distribution li a:focus-visible{color:var(--color-primary);text-decoration:underline}'], changeDetection:ChangeDetectionStrategy.OnPush })
export class AdminDashboardPageComponent {
  readonly dashboard=inject(AdminDashboardFacade);
  periodParams(data:AdminDashboardResponse,extra:Record<string,string|boolean>){return{...extra,from:data.from,to:data.to};}
  top(data:AdminDashboardResponse):DashboardRankLink[]{return data.topReservedTitles.map(item=>({...item,route:['/admin/loans'],queryParams:this.periodParams(data,{bookId:item.id,dateField:'reservedAt'})}));}
}

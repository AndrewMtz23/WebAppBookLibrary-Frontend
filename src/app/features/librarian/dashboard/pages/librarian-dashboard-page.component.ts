import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardPeriodControlsComponent } from '../../../../shared/dashboard/dashboard-period-controls.component';
import { DashboardRankComponent, DashboardRankLink } from '../../../../shared/dashboard/dashboard-rank.component';
import { MetricCardComponent } from '../../../../shared/dashboard/metric-card.component';
import { LibrarianDashboardFacade } from '../data-access/librarian-dashboard.facade';
import { LibrarianDashboardResponse } from '../data-access/librarian-dashboard.models';

@Component({ selector:'app-librarian-dashboard-page', standalone:true, imports:[DatePipe,RouterLink,DashboardPeriodControlsComponent,DashboardRankComponent,MetricCardComponent], providers:[LibrarianDashboardFacade], templateUrl:'./librarian-dashboard-page.component.html', styleUrl:'../../../../shared/dashboard/dashboard-page.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class LibrarianDashboardPageComponent {
  readonly dashboard=inject(LibrarianDashboardFacade);
  periodParams(data:LibrarianDashboardResponse, extra:Record<string,string|boolean>){return{...extra,from:data.from,to:data.to};}
  top(data:LibrarianDashboardResponse):DashboardRankLink[]{return data.topReservedTitles.map(item=>({...item,route:['/librarian/loans'],queryParams:this.periodParams(data,{bookId:item.id,dateField:'reservedAt'})}));}
  quiet(data:LibrarianDashboardResponse):DashboardRankLink[]{return data.titlesWithoutReservations.map(item=>({...item,route:['/librarian/books'],queryParams:{bookId:item.id,isActive:true}}));}
}

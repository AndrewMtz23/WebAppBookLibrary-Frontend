import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ErrorStateComponent } from '../../../../shared/ui/error-state/error-state.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { LibraryLoan, MyLibraryFacade } from '../../data-access/my-library.facade';

@Component({
  selector: 'app-my-library-page', standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, PageHeaderComponent, ErrorStateComponent, SkeletonComponent],
  templateUrl: './my-library-page.component.html', styleUrl: './my-library-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyLibraryPageComponent {
  readonly facade = inject(MyLibraryFacade);
  readonly sections: readonly { key: 'active' | 'dueSoon' | 'overdue' | 'history'; title: string; description: string }[] = [
    { key: 'active', title: 'Activos', description: 'Lecturas vigentes y accesos digitales.' },
    { key: 'dueSoon', title: 'Por vencer', description: 'Préstamos que vencen en los próximos tres días.' },
    { key: 'overdue', title: 'Vencidos', description: 'Préstamos físicos que requieren atención.' },
    { key: 'history', title: 'Historial', description: 'Reservas devueltas o canceladas.' }
  ];

  loans(key: 'active' | 'dueSoon' | 'overdue' | 'history'): readonly LibraryLoan[] { return this.facade[key](); }
}

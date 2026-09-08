import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppBrandComponent } from '../../../shared/ui/app-brand/app-brand.component';

@Component({ selector: 'app-access-denied', standalone: true, imports: [AppBrandComponent, MatButtonModule, MatIconModule, RouterLink], templateUrl: './access-denied.component.html', styleUrls: ['./access-denied.component.scss'], changeDetection: ChangeDetectionStrategy.OnPush })
export class AccessDeniedComponent {}

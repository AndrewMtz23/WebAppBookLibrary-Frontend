import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface PageHeaderConfig { readonly eyebrow?: string; readonly title: string; readonly description?: string; }

@Component({ selector: 'app-page-header', standalone: true, templateUrl: './page-header.component.html', styleUrl: './page-header.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class PageHeaderComponent { @Input({ required: true }) config!: PageHeaderConfig; }

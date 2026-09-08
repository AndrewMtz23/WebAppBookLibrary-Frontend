import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppBrandComponent } from '../../../shared/ui/app-brand/app-brand.component';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [AppBrandComponent, RouterOutlet],
  templateUrl: './public-shell.component.html',
  styleUrls: ['./public-shell.component.scss']
})
export class PublicShellComponent {}

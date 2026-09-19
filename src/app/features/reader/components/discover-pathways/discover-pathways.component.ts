import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface PathwayItem {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly link: string;
  readonly queryParams?: Record<string, string>;
  readonly variant: 'blue' | 'green' | 'amber';
}

@Component({
  selector: 'app-discover-pathways',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './discover-pathways.component.html',
  styleUrl: './discover-pathways.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoverPathwaysComponent {
  readonly pathways: readonly PathwayItem[] = [
    {
      title: 'Lecturas Rápidas',
      description: 'Obras y relatos ágiles para disfrutar a tu ritmo en pausas cotidianas o trayectos.',
      icon: 'auto_stories',
      link: '/app/catalog',
      queryParams: { genre: 'Ficción' },
      variant: 'blue'
    },
    {
      title: 'Colección Digital',
      description: 'Lectura inmediata en pantalla con modo oscuro, tipografía ajustable y sin esperas.',
      icon: 'devices',
      link: '/app/catalog',
      queryParams: { mediaType: 'digital' },
      variant: 'green'
    },
    {
      title: 'Reserva en Sala',
      description: 'Aparta ejemplares físicos de nuestra biblioteca y recógelos en recepción listos para ti.',
      icon: 'local_library',
      link: '/app/catalog',
      queryParams: { mediaType: 'physical' },
      variant: 'amber'
    }
  ];
}

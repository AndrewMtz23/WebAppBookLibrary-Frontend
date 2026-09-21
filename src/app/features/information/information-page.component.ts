import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ReaderNavbarComponent } from '../../shared/ui/reader-navbar/reader-navbar.component';
import { SiteFooterComponent } from '../../shared/ui/site-footer/site-footer.component';

const PAGES = {
  about: { label: 'Sobre BookLibrary', title: 'Un lugar para tus próximas lecturas.', intro: 'Descubre libros, guarda los que te interesan y reúne tus reservas físicas y digitales en una misma biblioteca.', icon: 'auto_stories' },
  help: { label: 'Ayuda y preguntas frecuentes', title: 'Leer empieza con una buena respuesta.', intro: 'Lo esencial para explorar el catálogo, guardar tus hallazgos y llevar el control de tus préstamos.', icon: 'help_outline' },
  contact: { label: 'Contacto y soporte', title: 'Estamos del otro lado de tu biblioteca.', intro: 'Si algo no funciona como esperabas, prepara los detalles y comunícalos al personal responsable de tu biblioteca.', icon: 'support_agent' },
  'loan-guide': { label: 'Guía de préstamos', title: 'Del catálogo a tu próxima lectura.', intro: 'Conoce cómo reservar, qué cambia entre formatos y dónde revisar los plazos de tus libros.', icon: 'menu_book' }
} as const;
type InformationPage = keyof typeof PAGES;

@Component({
  selector: 'app-information-page', standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, ReaderNavbarComponent, SiteFooterComponent],
  templateUrl: './information-page.component.html',
  styleUrl: './information-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InformationPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  get page(): InformationPage { return this.data()['page'] as InformationPage; }
  get content() { return PAGES[this.page]; }
  readonly links = Object.entries(PAGES).map(([path, value]) => ({ path: '/' + path, label: value.label, icon: value.icon }));
  readonly questions = [
    { question: '¿Necesito una cuenta para ver los libros?', answer: 'No. Puedes explorar Descubrir, buscar en el Catálogo y abrir las fichas sin iniciar sesión. Al intentar reservar o guardar un libro, aparecerá una ventana para iniciar sesión o registrarte.' },
    { question: '¿Cómo reservo un libro?', answer: 'Abre su ficha, revisa el formato y la disponibilidad, e inicia sesión con tu cuenta de lector. Pulsa Reservar si es físico o Reservar acceso digital si es digital. Después encontrarás la reserva en Mi biblioteca. Si ya tienes una reserva activa de ese libro, consulta la existente.' },
    { question: '¿Cómo guardo un libro en favoritos?', answer: 'Pulsa el corazón o el botón Guardar. El aviso Libro guardado confirma que se añadió a tus favoritos. Puedes consultarlos en Favoritos y pulsar de nuevo el corazón para quitar uno. Guardar un libro no reserva un ejemplar.' },
    { question: '¿Dónde veo mis préstamos y sus fechas?', answer: 'Inicia sesión y entra en Mi biblioteca. Ahí puedes consultar tus reservas, su estado y el vencimiento de los préstamos físicos, además de acceder a tus libros digitales.' },
    { question: '¿Qué hago si no hay ejemplares disponibles?', answer: 'Puedes guardar el libro en favoritos y volver a consultar su ficha más adelante. Consulta al personal sobre su disponibilidad; guardarlo no te coloca en una lista de espera.' },
    { question: '¿Por qué no abre un libro digital?', answer: 'Comprueba que tu reserva siga activa y vuelve a abrir el recurso desde Mi biblioteca. El enlace se abre en otra pestaña y puede depender de un sitio externo. Si falla, anota el título, la dirección y el mensaje de error para reportarlo al personal.' },
    { question: '¿Cómo devuelvo o cancelo una reserva?', answer: 'Abre Mi biblioteca y revisa las acciones de la reserva. Para un ejemplar físico, coordina también la entrega con el personal: registrar una devolución en pantalla no sustituye entregar el libro. Consulta la Guía de préstamos para conocer las diferencias entre formatos.' }
  ];
}

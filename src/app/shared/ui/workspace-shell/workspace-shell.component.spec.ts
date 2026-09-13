import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NavigationGroup, NavigationItem } from '../../../core/navigation/navigation.model';
import { WorkspaceShellComponent } from './workspace-shell.component';

describe('WorkspaceShellComponent', () => {
  let fixture: ComponentFixture<WorkspaceShellComponent>;
  let component: WorkspaceShellComponent;

  const navigation: readonly NavigationItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: ['/admin/dashboard'], exact: true, roles: ['admin'] },
    { label: 'Usuarios', icon: 'group', route: ['/admin/users'], roles: ['admin'] },
    { label: 'Sitio público', icon: 'public', route: ['/app/discover'], roles: ['admin'] }
  ];
  const groups: readonly NavigationGroup[] = [
    { label: 'Gestión', icon: 'dashboard_customize', items: navigation.slice(0, 2) },
    { label: 'Control', icon: 'admin_panel_settings', items: navigation.slice(2) }
  ];

  beforeEach(async () => {
    localStorage.removeItem('booklibrary_sidebar_collapsed');

    await TestBed.configureTestingModule({
      imports: [WorkspaceShellComponent, RouterTestingModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceShellComponent);
    component = fixture.componentInstance;
    component.navigation = navigation;
    component.navigationGroups = groups;
    component.username = 'Marina';
    component.contextLabel = 'Administración';
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem('booklibrary_sidebar_collapsed'));

  it('collapses the desktop sidebar and remembers the preference', () => {
    const toggle = fixture.nativeElement.querySelector('[aria-label="Contraer navegación"]') as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.workspace').classList).toContain('workspace--sidebar-collapsed');
    expect(fixture.nativeElement.querySelector('.brand__name')).toBeNull();
    expect(localStorage.getItem('booklibrary_sidebar_collapsed')).toBe('true');
    expect(fixture.nativeElement.querySelector('[aria-label="Expandir navegación"]')).not.toBeNull();
  });

  it('restores a collapsed sidebar preference', () => {
    fixture.destroy();
    localStorage.setItem('booklibrary_sidebar_collapsed', 'true');

    fixture = TestBed.createComponent(WorkspaceShellComponent);
    component = fixture.componentInstance;
    component.navigation = navigation;
    component.navigationGroups = groups;
    component.username = 'Marina';
    component.contextLabel = 'Administración';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.workspace').classList).toContain('workspace--sidebar-collapsed');
  });

  it('renders staff destinations inside expandable tree areas', () => {
    const control = fixture.nativeElement.querySelector('[aria-controls="navigation-group-control"]') as HTMLButtonElement;

    expect(control).not.toBeNull();
    expect(control.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Sitio público');

    control.click();
    fixture.detectChanges();

    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#navigation-group-control')).toBeNull();
  });

  it('uses a desktop navbar with the authenticated identity for readers', () => {
    fixture.componentRef.setInput('navigation', [
      { label: 'Descubrir', icon: 'explore', route: ['/app/discover'], roles: ['user'] },
      { label: 'Mi biblioteca', icon: 'bookmarks', route: ['/app/my-library'], roles: ['user'] },
      { label: 'Perfil', icon: 'person', route: ['/app/profile'], roles: ['user'] }
    ] satisfies readonly NavigationItem[]);
    fixture.componentRef.setInput('variant', 'reader');
    fixture.componentRef.setInput('username', 'Lilith Argueta');
    fixture.componentRef.setInput('workspaceRoute', ['/admin/dashboard']);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.reader-navbar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.workspace__sidebar')).toBeNull();
    expect(getComputedStyle(fixture.nativeElement.querySelector('.workspace')).display).toBe('block');
    expect(fixture.nativeElement.querySelector('.reader-navbar').textContent).toContain('Lilith Argueta');
    expect(fixture.nativeElement.querySelector('.reader-navbar').textContent).toContain('Mi biblioteca');
    expect(fixture.nativeElement.querySelector('.reader-navbar').textContent).toContain('Panel');
  });

  it('asks for confirmation before requesting logout', () => {
    const emit = spyOn(component.logoutRequested, 'emit');

    (fixture.nativeElement.querySelector('[aria-label="Cerrar sesión"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.logout-dialog[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain('¿Seguro que deseas cerrar sesión?');
    expect(emit).not.toHaveBeenCalled();
  });

  it('cancels logout without ending the session', () => {
    const emit = spyOn(component.logoutRequested, 'emit');
    (fixture.nativeElement.querySelector('[aria-label="Cerrar sesión"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.logout-dialog__cancel') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.logout-dialog')).toBeNull();
    expect(emit).not.toHaveBeenCalled();
  });

  it('shows the closing-session state after confirmation and requests logout', () => {
    const emit = spyOn(component.logoutRequested, 'emit');
    (fixture.nativeElement.querySelector('[aria-label="Cerrar sesión"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.logout-dialog__confirm') as HTMLButtonElement).click();
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('.logout-loading[role="dialog"]');
    expect(loading).not.toBeNull();
    expect(loading.textContent).toContain('Cerrando sesión…');
    expect(emit).toHaveBeenCalledTimes(1);
  });
});

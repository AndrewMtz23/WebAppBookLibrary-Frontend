import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NavigationItem } from '../../../core/navigation/navigation.model';
import { WorkspaceShellComponent } from './workspace-shell.component';

describe('WorkspaceShellComponent', () => {
  let fixture: ComponentFixture<WorkspaceShellComponent>;
  let component: WorkspaceShellComponent;

  const navigation: readonly NavigationItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: ['/admin/dashboard'], exact: true, roles: ['admin'] },
    { label: 'Usuarios', icon: 'group', route: ['/admin/users'], roles: ['admin'] }
  ];

  beforeEach(async () => {
    localStorage.removeItem('booklibrary_sidebar_collapsed');

    await TestBed.configureTestingModule({
      imports: [WorkspaceShellComponent, RouterTestingModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceShellComponent);
    component = fixture.componentInstance;
    component.navigation = navigation;
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
    component.username = 'Marina';
    component.contextLabel = 'Administración';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.workspace').classList).toContain('workspace--sidebar-collapsed');
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

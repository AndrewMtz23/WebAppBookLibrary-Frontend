import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, filter, forkJoin, map, of, switchMap } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { BranchChoice, BranchContextService } from './branch-context.service';

@Component({
  selector: 'app-branch-selector', standalone: true, imports: [FormsModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (originError()) { <p role="alert">No se pudo resolver la sucursal del ejemplar. Comprueba tu acceso o consulta a administración.</p> }
    @if (error()) { <p role="alert">No se pudieron cargar las sucursales. <button type="button" (click)="reload()">Reintentar</button></p> }
    @else if (!context.ready()) { <p role="status">Cargando sucursales…</p> }
    @else if (context.enabled()) {
      <div class="branch-context"><label for="active-branch">Sucursal activa</label>
      <select id="active-branch" [ngModel]="context.selectedId() ?? ''" (ngModelChange)="select($event, true)">
        <option value="" disabled>Selecciona una sucursal</option>
        @for (branch of context.branches(); track branch.id) { <option [value]="branch.id">{{ branch.name }} · {{ branch.code }}</option> }
      </select>
      @if (!context.branches().length) { <span>No tienes sucursales disponibles. Contacta a administración.</span> }
      @else { <span>El catálogo y las operaciones corresponden a esta sucursal.</span> }
      </div>
    }
  `,
  styles: [`:host{display:block}.branch-context{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;padding:1rem 0;border-bottom:1px solid var(--color-border,#ddd);margin-bottom:1.25rem}label{font-weight:600}select,button{font:inherit;padding:.65rem;border-radius:.5rem}select{max-width:100%;background:var(--color-surface,#fff);color:var(--color-text,#222)}span{font-size:.85rem;flex-basis:100%}`]
})
export class BranchSelectorComponent {
  readonly context = inject(BranchContextService);
  readonly error = signal(false);
  readonly originError = signal(false);
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);
  private readonly router = inject(Router);
  private get storageKey() { return `booklibrary_branch_${this.auth.sessionSnapshot?.user.id ?? 'guest'}`; }
  constructor() {
    this.auth.session$.pipe(map(s => `${s?.user.id ?? ''}:${s?.user.role ?? ''}`), distinctUntilChanged(),
      switchMap(() => { this.context.reset(); return this.load(); }), takeUntilDestroyed(this.destroy)).subscribe();
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), switchMap(() => { this.selectRequested(); return this.resolveCopyOrigin(); }), takeUntilDestroyed(this.destroy)).subscribe();
  }
  select(id: string, updateUrl = false): void {
    this.context.select(id);
    if (this.context.selectedId() !== id) return;
    sessionStorage.setItem(this.storageKey, id);
    if (updateUrl) void this.router.navigate([], {queryParams:{branch:id},queryParamsHandling:'merge',replaceUrl:true});
  }
  private selectRequested(): void {
    const id = this.router.parseUrl(this.router.url).queryParams['branch'];
    if (typeof id === 'string') this.select(id);
  }
  private resolveCopyOrigin() {
    this.originError.set(false);
    const url = this.router.url;
    const match = /^\/(?:admin|librarian)\/copies\/([a-f0-9]{24})(?:[?;]|$)/i.exec(url);
    if (!this.context.enabled() || !match) return of(undefined);
    return this.http.get<{ branchId: string }>(`/api/copies/${match[1]}/context`).pipe(map(origin => {
      if (this.router.url === url) {
        this.select(origin.branchId);
        if (this.context.selectedId() !== origin.branchId) this.originError.set(true);
      }
    }), catchError(() => { if (this.router.url === url) this.originError.set(true); return of(undefined); }));
  }
  reload(): void { this.load().pipe(takeUntilDestroyed(this.destroy)).subscribe(); }
  private load() {
    this.error.set(false);
    const role = this.auth.sessionSnapshot?.user.role;
    return forkJoin({ state: this.http.get<{ enabled: boolean }>('/api/branches/context'),
      branches: this.http.get<BranchChoice[]>(role === 'admin' || role === 'librarian' ? '/api/branches/my' : '/api/branches')
    }).pipe(map(({ state, branches }) => {
      this.context.setBranches(branches, state.enabled);
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved) this.context.select(saved);
      this.selectRequested();
    }), switchMap(() => this.resolveCopyOrigin()), catchError(() => { this.error.set(true); return of(undefined); }));
  }
}

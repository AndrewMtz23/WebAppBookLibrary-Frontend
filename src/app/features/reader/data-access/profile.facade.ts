import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ReaderProfile, UpdateProfileRequest } from '../models/reader.models';
import { AuthService } from '../../../core/services/auth.service';
import { OperationNotificationService } from '../../../core/services/operation-notification.service';
import { ReaderService } from './reader.service';

export interface ProfileResource<T> { data: T; loading: boolean; error: string | null; }

@Injectable()
export class ProfileFacade {
  private readonly reader = inject(ReaderService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(OperationNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly conflict = signal(false);
  readonly profile = signal<ProfileResource<ReaderProfile | null>>(pending(null));
  readonly activeReservations = signal<ProfileResource<number | null>>(pending(null));
  readonly returnedBooks = signal<ProfileResource<number | null>>(pending(null));
  readonly favorites = signal<ProfileResource<number | null>>(pending(null));

  constructor() { this.load(); }

  load(): void {
    if (this.saving()) return;
    this.profile.set(pending(null)); this.saveError.set(''); this.conflict.set(false);
    this.reader.getProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: profile => {
        this.profile.set({ data: profile, loading: false, error: null });
        if (profile.role === 'user') {
          this.capture(this.reader.getLoans({ status: 'active', page: 1, pageSize: 1 }), this.activeReservations, value => value.totalItems, 'No disponible');
          this.capture(this.reader.getLoans({ status: 'returned', page: 1, pageSize: 1 }), this.returnedBooks, value => value.totalItems, 'No disponible');
          this.capture(this.reader.getFavorites(1, 1), this.favorites, value => value.totalItems, 'No disponible');
        }
      },
      error: () => this.profile.set({ data: null, loading: false, error: 'No pudimos cargar tu cuenta.' })
    });
  }

  save(request: UpdateProfileRequest): void {
    if (this.saving() || this.conflict()) return;
    this.saving.set(true); this.saveError.set('');
    this.reader.updateProfile(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: profile => {
        this.saving.set(false);
        this.profile.set({ data: profile, loading: false, error: null });
        this.auth.syncCurrentUser(profile);
        this.notifications.success('Perfil actualizado.');
      },
      error: error => {
        this.saving.set(false); this.conflict.set(error.status === 409);
        const message = error.status === 409
          ? 'El correo ya está en uso o tu cuenta cambió. Conservamos tus cambios; copia lo que necesites y recarga el perfil antes de reintentar.'
          : 'No pudimos guardar tu perfil. Revisa los datos e intenta de nuevo.';
        this.saveError.set(message); this.notifications.error(message);
      }
    });
  }

  private capture<T, R>(source: Observable<T>, target: { set(value: ProfileResource<R | null>): void }, select: (value: T) => R, error: string): void {
    source.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => target.set({ data: select(value), loading: false, error: null }),
      error: () => target.set({ data: null, loading: false, error })
    });
  }
}

function pending<T>(data: T): ProfileResource<T> { return { data, loading: true, error: null }; }

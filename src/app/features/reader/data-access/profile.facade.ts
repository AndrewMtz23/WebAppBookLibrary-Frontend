import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReaderProfile } from '../models/reader.models';
import { ReaderService } from './reader.service';

export interface ProfileResource<T> { data: T; loading: boolean; error: string | null; }

@Injectable()
export class ProfileFacade {
  private readonly reader = inject(ReaderService);
  readonly profile = signal<ProfileResource<ReaderProfile | null>>(pending(null));
  readonly activeReservations = signal<ProfileResource<number | null>>(pending(null));
  readonly returnedBooks = signal<ProfileResource<number | null>>(pending(null));
  readonly favorites = signal<ProfileResource<number | null>>(pending(null));

  constructor() { this.load(); }

  load(): void {
    this.capture(this.reader.getProfile(), this.profile, value => value, 'No pudimos cargar tu identidad.');
    this.capture(this.reader.getLoans({ status: 'active', page: 1, pageSize: 1 }), this.activeReservations, value => value.totalItems, 'No disponible');
    this.capture(this.reader.getLoans({ status: 'returned', page: 1, pageSize: 1 }), this.returnedBooks, value => value.totalItems, 'No disponible');
    this.capture(this.reader.getFavorites(1, 1), this.favorites, value => value.totalItems, 'No disponible');
  }

  private capture<T, R>(source: Observable<T>, target: { set(value: ProfileResource<R | null>): void }, select: (value: T) => R, error: string): void {
    source.subscribe({
      next: value => target.set({ data: select(value), loading: false, error: null }),
      error: () => target.set({ data: null, loading: false, error })
    });
  }
}

function pending<T>(data: T): ProfileResource<T> { return { data, loading: true, error: null }; }

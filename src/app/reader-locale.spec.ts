import { LOCALE_ID } from '@angular/core';
import { formatDate } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { AppModule } from './app.module';

describe('application date locale', () => {
  it('renders reader dates in Spanish', () => {
    TestBed.configureTestingModule({ imports: [AppModule] });
    expect(formatDate('2026-09-22T12:00:00Z', 'longDate', TestBed.inject(LOCALE_ID), 'UTC')).toBe('22 de septiembre de 2026');
  });
});

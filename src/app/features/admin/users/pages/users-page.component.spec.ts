import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersPageComponent } from './users-page.component';

describe('UsersPageComponent', () => {
  it('supplies one page heading without nesting another main inside the staff shell landmark', () => {
    TestBed.configureTestingModule({ imports: [UsersPageComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { getUserId: () => 'self' } }] });
    const fixture = TestBed.createComponent(UsersPageComponent); fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    expect(fixture.nativeElement.querySelector('main')).toBeNull();
  });
});

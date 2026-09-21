import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterComponent } from './register.component';

describe('registration return destination', () => {
  for (const destination of ['/app/catalog/book1?source=discover', '//evil.example']) {
    it(`preserves only a safe destination: ${destination}`, () => {
      const navigate = jasmine.createSpy('navigate');
      const auth = { register: () => of({ message: 'created' }) } as unknown as AuthService;
      const router = { navigate } as unknown as Router;
      const notice = { open: jasmine.createSpy() } as unknown as MatSnackBar;
      const route = { snapshot: { queryParamMap: convertToParamMap({ returnUrl: destination }) } } as ActivatedRoute;
      const component = new RegisterComponent(auth, router, notice, route);
      component.username = 'reader'; component.email = 'reader@example.invalid';
      component.password = component.confirmPassword = 'SafeTest!123';
      component.register();
      expect(navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: destination.startsWith('//') ? null : destination } });
      navigate.calls.reset();
      component.navigateToLogin();
      expect(navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: destination.startsWith('//') ? null : destination } });
    });
  }
});

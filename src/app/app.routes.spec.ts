import { routes } from './app.routes';

describe('public legal routes', () => {
  it('exposes privacy and legal documents without authentication guards', () => {
    for (const path of ['privacy', 'legal', 'about', 'help', 'contact', 'loan-guide']) {
      const route = routes.find(candidate => candidate.path === path);

      expect(route).toBeDefined();
      expect(route?.loadComponent).toBeDefined();
      expect(route?.canActivate).toBeUndefined();
    }
  });
});

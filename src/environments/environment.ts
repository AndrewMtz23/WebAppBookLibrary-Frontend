// Development environment configuration
export const environment = {
  production: false,
  // Backend API URL - Override via proxy.conf.json during development
  // or via .env file variables
  apiUrl: 'https://localhost:7086',
  debug: true
};
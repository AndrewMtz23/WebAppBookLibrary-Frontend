# Book Library Client - Frontend

## Overview

Book Library Client is an Angular-based single-page application (SPA) for managing library operations. It provides users with an intuitive interface to browse books, manage loans, and track their library activity. The application integrates with the WebAppBookLibrary backend API for authentication and data management.

## Features

- User registration and authentication with JWT tokens
- Browse and search library books
- Request and manage book loans
- View loan history and return dates
- User profile management
- Responsive design for desktop and mobile devices
- Material Design UI components
- Real-time status updates

## Technology Stack

- Angular 17
- TypeScript
- Angular Material
- RxJS
- Angular Router
- Highcharts (for analytics and visualizations)
- Sass/SCSS

## Project Structure

```
Book-Library-Client/
├── src/
│   ├── app/                    # Application components and modules
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── services/           # HTTP services
│   │   ├── models/             # TypeScript interfaces and types
│   │   ├── guards/             # Route guards
│   │   ├── interceptors/       # HTTP interceptors
│   │   ├── app.component.*    # Root component
│   │   └── app.routes.ts      # Route definitions
│   ├── assets/                 # Static assets
│   ├── environments/           # Environment configurations
│   ├── styles.scss             # Global styles
│   ├── index.html              # HTML entry point
│   └── main.ts                 # Application bootstrap
├── public/                     # Static files
├── angular.json                # Angular CLI configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.app.json          # App-specific TypeScript config
├── tsconfig.spec.json         # Test-specific TypeScript config
├── karma.conf.js              # Test runner configuration
├── proxy.conf.json            # Development proxy configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Prerequisites

- Node.js 18+ and npm 9+
- Angular CLI 17+
- Code editor (VS Code, WebStorm, etc.)
- The WebAppBookLibrary backend running locally or accessible via network

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Book-Library-Client
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file with your backend configuration:

```env
# API Configuration
API_BASE_URL=https://localhost:7086
API_PROXY_TARGET=https://localhost:7086

# Application Environment
ENVIRONMENT=development

# CORS and Security
ENABLE_DEBUG_LOGS=true
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Update Environment Files

Create or update `src/environments/environment.ts` with your backend URL:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7086'
};
```

Create or update `src/environments/environment.prod.ts` for production:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api-url.com'
};
```

### 5. Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:4200`

## Available Scripts

### Development Server

```bash
npm start
# or
ng serve --proxy-config proxy.conf.json
```

Navigate to `http://localhost:4200`. The application will automatically reload when you modify source files.

### Build

```bash
npm run build
# or
ng build
```

The build artifacts will be stored in the `dist/` directory.

### Production Build

```bash
ng build --configuration production
```

### Watch Mode

```bash
npm run watch
# or
ng build --watch --configuration development
```

### Running Tests

```bash
npm test
# or
ng test
```

Tests will run using Karma test runner.

### Code Linting

```bash
ng lint
```

## Environment Configuration Details

### Development Environment

- Debug logs are enabled
- CORS proxy is configured to forward requests to localhost:7086
- Development-friendly error messages

### Production Environment

- Debug logs are disabled
- API calls go directly to production server
- Error messages are user-friendly without technical details
- Source maps are disabled for smaller bundle size

### Proxy Configuration

The `proxy.conf.json` file handles CORS by proxying API requests to the backend during development:

```json
{
  "/api/*": {
    "target": "https://localhost:7086",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

This configuration allows the frontend (localhost:4200) to make requests to the backend (localhost:7086) without CORS issues.

## Key Services

### AuthService

Handles user authentication:
- User registration
- User login
- Token management
- Token refresh
- Logout

### BookService

Manages book-related operations:
- Fetch all books
- Search books
- Get book details
- Create/Edit/Delete books (admin)

### LoanService

Handles loan operations:
- Request book loan
- Get user loans
- Return books
- View loan history

## HTTP Interceptors

The application uses HTTP interceptors for:
- Adding JWT tokens to request headers
- Handling 401 Unauthorized responses
- Error handling and logging
- Request/response logging in development

## Route Guards

- AuthGuard: Protects routes that require authentication
- AdminGuard: Protects admin-only routes
- LoginGuard: Prevents authenticated users from accessing login page

## Architecture

### State Management

The application uses RxJS for state management through services. Each service maintains application state through BehaviorSubjects and Observables.

### Component Communication

Components communicate through:
- Shared services with Observables
- Router parameters for navigation
- Local component state for UI logic

### API Communication

All HTTP requests go through typed services using RxJS Observables for reactive data flow.

## Styling

The application uses:
- Angular Material for UI components
- SCSS for custom styling
- Global styles in `styles.scss`
- Component-scoped styles in individual `.scss` files

### Material Design

Angular Material provides:
- Pre-built components (buttons, cards, forms, etc.)
- Theming system
- Responsive layout components

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Web Server

1. Build the project: `ng build --configuration production`
2. Copy contents of `dist/book-library-client` to your web server
3. Configure web server to serve `index.html` for all routes (SPA routing)
4. Update `src/environments/environment.prod.ts` with production API URL

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/book-library-client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t book-library-client .
docker run -p 80:80 book-library-client
```

## Troubleshooting

### CORS Errors

- Verify backend is running and accessible at the configured API_BASE_URL
- Check that backend CORS_ORIGIN includes your frontend URL
- Review browser console for detailed error messages

### Authentication Issues

- Ensure JWT token is being saved in localStorage after login
- Check that AuthService is intercepting requests and adding the token
- Verify backend is validating JWT tokens correctly

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Clear Angular cache: `npm run ng cache clean`

### API Connection Refused

- Verify backend server is running
- Check that API_BASE_URL points to correct backend address
- On Windows, ensure port 7086 is not blocked by firewall

## Development Tips

1. Use Angular DevTools browser extension for debugging
2. Enable debug logging by setting `ENABLE_DEBUG_LOGS=true` in .env
3. Use `ng generate component name` to create new components
4. Use `ng generate service name` to create new services
5. Run tests frequently during development

## Code Style

The project follows:
- Angular style guide
- TypeScript strict mode
- ESLint rules (if configured)
- Prettier for code formatting (if configured)

## Contributing

When contributing:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Follow the existing code structure and naming conventions
3. Write components and services with proper typing
4. Test your changes locally
5. Update this README if adding new features
6. Submit a pull request with clear description

## Performance Considerations

- Lazy-loaded modules for faster initial load
- OnPush change detection strategy for components where applicable
- Unsubscribe from observables to prevent memory leaks
- Use trackBy in *ngFor loops for better performance

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

[Specify your license here]

## Contact

For questions or support, contact the project maintainer.

## Version History

- v1.0.0 - Initial release, create in May 2025

# Environment Configuration Guide for Book Library Frontend

## Development with Environment Variables

### Option 1: Using .env file with ng serve (Recommended)

1. Create a `.env` file in the root directory:
```
API_BASE_URL=https://localhost:7086
ENVIRONMENT=development
DEBUG=true
```

2. Install dotenv-cli (optional, for running commands with .env):
```bash
npm install --save-dev dotenv-cli
```

3. Update package.json scripts:
```json
"scripts": {
  "start": "dotenv ng serve --proxy-config proxy.conf.json",
}
```

4. Run:
```bash
npm start
```

### Option 2: Using Environment Variables Directly

```bash
# On Windows PowerShell
$env:API_BASE_URL = "https://localhost:7086"
npm start

# On Linux/macOS
export API_BASE_URL=https://localhost:7086
npm start
```

### Option 3: Using config.json (Current Implementation)

1. Update `public/config.json` with your backend URL:
```json
{
  "apiUrl": "https://localhost:7086",
  "environment": "development",
  "debug": true
}
```

2. The ConfigService will load this at runtime and fall back to environment.ts if not found.

## Production Build with Variables

### Option 1: Replace values at build time

```bash
# Build with environment.prod.ts
ng build --configuration production

# Then replace the API URL in the built files:
sed -i 's|https://your-production-api-url.com|https://actual-api-url.com|g' dist/**/*.js
```

### Option 2: Use config.json for all environments

1. Build the project:
```bash
ng build --configuration production
```

2. Deploy config.json separately (outside version control)
3. Serve config.json from the web server with correct values

### Option 3: Use environment variables in Docker

Create a Dockerfile that passes environment variables:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG API_URL=https://api.example.com
RUN ng build --configuration production --base-href=/

FROM nginx:alpine
COPY --from=build /app/dist/book-library-client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build with:
```bash
docker build --build-arg API_URL=https://your-api.com -t book-library-client .
```

## Using ConfigService in Components

```typescript
import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../core/services/config.service';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.html',
  styleUrls: ['./my-component.scss']
})
export class MyComponent implements OnInit {
  apiUrl: string = '';

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    this.apiUrl = this.configService.getApiUrl();
    
    if (this.configService.isDebugEnabled()) {
      console.log('Debug mode enabled');
    }
  }
}
```

## Using ConfigService in HTTP Services

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../services/config.service';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  getBooks() {
    const apiUrl = this.configService.getApiUrl();
    return this.http.get(`${apiUrl}/api/books`);
  }
}
```

## Recommended Approach for Portfolio

For a professional portfolio project:

1. **Development**: Use proxy.conf.json + environment.ts (no .env needed)
2. **Production**: Use public/config.json that's deployed separately
3. **Configuration Service**: Already set up to handle both approaches

This way:
- No secrets are committed to Git
- Easy to deploy to different environments
- Works with Docker and cloud deployments
- Professional and clean approach


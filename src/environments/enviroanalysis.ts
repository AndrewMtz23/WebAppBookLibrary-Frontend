export const enviroanalysis = {
  production: false,
  
  apis: {
    secure: {
      url: 'https://localhost:7086', // -> Api Segura
      name: 'WebAppBookLibrary (Seguro)',
      description: 'API con autenticación, autorización y validaciones'
    },
    insecure: {
      url: 'https://localhost:7087', // -> Api Insegura
      name: 'BookLibraryInsegura (Vulnerable)',
      description: 'API sin protecciones de seguridad'
    }
  },
  
  apiUrl: 'https://localhost:7086', 
  
  security: {
    enableComparison: true,
    enablePenetrationTests: true,
    enableVulnerabilityScanner: true
  }
};
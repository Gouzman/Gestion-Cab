import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  
  // Timeout pour chaque test
  timeout: 30 * 1000,
  
  // Nombre de tests en parallèle
  fullyParallel: true,
  
  // Ne pas autoriser les tests instables
  forbidOnly: !!process.env.CI,
  
  // Nombre de tentatives en cas d'échec
  retries: process.env.CI ? 2 : 0,
  
  // Workers en parallèle
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: 'html',
  
  // Configuration partagée pour tous les projets
  use: {
    // URL de base pour les tests
    baseURL: 'http://localhost:3000',
    
    // Collecter les traces sur le premier échec
    trace: 'on-first-retry',
    
    // Screenshots sur échec
    screenshot: 'only-on-failure',
    
    // Vidéo sur échec
    video: 'retain-on-failure',
  },

  // Configurer les projets pour différents navigateurs
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Serveur de développement à lancer avant les tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

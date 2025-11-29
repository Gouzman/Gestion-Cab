/**
 * Tests E2E - Flux d'authentification
 * 
 * Note : Ces tests sont des squelettes pour démontrer l'infrastructure.
 * En production, ils nécessiteraient :
 * - Un environnement de test Supabase dédié
 * - Des utilisateurs de test pré-créés
 * - Des données de test isolées
 */

import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test.skip('devrait permettre à un utilisateur de se connecter', async ({ page }) => {
    // IMPORTANT: Test désactivé car nécessite un environnement Supabase de test
    // Pour l'activer en production :
    // 1. Créer une base de données Supabase de test
    // 2. Peupler avec des utilisateurs de test
    // 3. Configurer les variables d'environnement de test
    
    // Naviguer vers la page de connexion
    await page.goto('/');
    
    // Attendre que la page soit chargée
    await expect(page.locator('h1')).toBeVisible();
    
    // Vérifier que le formulaire de connexion est présent
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Remplir le formulaire avec des identifiants de test
    await emailInput.fill('test@example.com');
    await passwordInput.fill('TestPassword123!');
    
    // Soumettre le formulaire
    await submitButton.click();
    
    // Attendre la redirection après connexion réussie
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Vérifier que l'utilisateur est bien connecté
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Vérifier qu'un message de bienvenue est affiché
    const welcomeToast = page.locator('text=Bienvenue');
    await expect(welcomeToast).toBeVisible({ timeout: 3000 });
  });

  test.skip('devrait afficher une erreur avec des identifiants invalides', async ({ page }) => {
    // IMPORTANT: Test désactivé car nécessite un environnement Supabase de test
    
    await page.goto('/');
    
    // Remplir avec des identifiants incorrects
    await page.locator('input[type="email"]').fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('WrongPassword');
    
    // Soumettre
    await page.locator('button[type="submit"]').click();
    
    // Vérifier qu'un message d'erreur est affiché
    const errorMessage = page.locator('text=/Email ou mot de passe incorrect/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
    
    // Vérifier que l'utilisateur reste sur la page de connexion
    await expect(page).toHaveURL('/');
  });

  test.skip('devrait permettre la déconnexion', async ({ page }) => {
    // IMPORTANT: Test désactivé car nécessite un environnement Supabase de test
    
    // Se connecter d'abord (pré-requis)
    await page.goto('/');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('TestPassword123!');
    await page.locator('button[type="submit"]').click();
    
    // Attendre d'être connecté
    await page.waitForURL('/dashboard');
    
    // Ouvrir le menu utilisateur
    await page.locator('[data-testid="user-menu"]').click();
    
    // Cliquer sur déconnexion
    await page.locator('text=Déconnexion').click();
    
    // Vérifier la redirection vers la page de login
    await page.waitForURL('/');
    
    // Vérifier que le formulaire de connexion est de nouveau visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

// Test basique de la structure de la page (sans dépendance auth)
test.describe('Structure de la page publique', () => {
  test('devrait afficher la page d\'accueil', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/Gestion Cabinet/i);
    
    // Vérifier que le contenu principal est présent
    const mainContent = page.locator('main, [role="main"], body');
    await expect(mainContent).toBeVisible();
  });
});

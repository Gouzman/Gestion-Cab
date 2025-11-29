/**
 * Tests E2E - Gestion des tâches
 * 
 * Note : Tests squelettes pour démontrer l'infrastructure.
 * Nécessitent un environnement de test Supabase en production.
 */

import { test, expect } from '@playwright/test';

test.describe('Création de tâches', () => {
  test.skip('devrait permettre de créer une tâche avec fichier joint', async ({ page }) => {
    // IMPORTANT: Test désactivé - nécessite un environnement de test
    // Pré-requis : utilisateur connecté
    
    // Aller sur la page de gestion des tâches
    await page.goto('/dashboard');
    await page.locator('text=Tâches').click();
    
    // Ouvrir le formulaire de création
    const createButton = page.locator('[data-testid="create-task-button"]');
    await createButton.click();
    
    // Remplir le formulaire
    await page.locator('input[name="title"]').fill('Nouvelle tâche de test');
    await page.locator('textarea[name="description"]').fill('Description de la tâche');
    
    // Sélectionner l'assigné
    await page.locator('[data-testid="assigned-to-select"]').click();
    await page.locator('text=Collaborateur Test').click();
    
    // Joindre un fichier
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'document-test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF test content'),
    });
    
    // Vérifier que le fichier est bien ajouté
    const filePreview = page.locator('text=document-test.pdf');
    await expect(filePreview).toBeVisible();
    
    // Soumettre le formulaire
    await page.locator('button[type="submit"]').click();
    
    // Vérifier le message de succès
    const successToast = page.locator('text=/Tâche créée avec succès/i');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    
    // Vérifier que la tâche apparaît dans la liste
    const taskCard = page.locator('text=Nouvelle tâche de test').first();
    await expect(taskCard).toBeVisible();
  });

  test.skip('devrait valider les champs obligatoires', async ({ page }) => {
    // IMPORTANT: Test désactivé - nécessite un environnement de test
    
    await page.goto('/dashboard');
    await page.locator('text=Tâches').click();
    await page.locator('[data-testid="create-task-button"]').click();
    
    // Essayer de soumettre sans remplir les champs obligatoires
    await page.locator('button[type="submit"]').click();
    
    // Vérifier les messages d'erreur
    const titleError = page.locator('text=/Le titre est obligatoire/i');
    const assignedToError = page.locator('text=/Veuillez sélectionner un assigné/i');
    
    await expect(titleError).toBeVisible();
    await expect(assignedToError).toBeVisible();
  });

  test.skip('devrait permettre de modifier une tâche existante', async ({ page }) => {
    // IMPORTANT: Test désactivé - nécessite un environnement de test
    
    await page.goto('/dashboard');
    await page.locator('text=Tâches').click();
    
    // Cliquer sur la première tâche
    const firstTask = page.locator('[data-testid="task-card"]').first();
    await firstTask.click();
    
    // Cliquer sur éditer
    await page.locator('[data-testid="edit-task-button"]').click();
    
    // Modifier le titre
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    await titleInput.fill('Tâche modifiée');
    
    // Sauvegarder
    await page.locator('button[type="submit"]').click();
    
    // Vérifier le message de succès
    const successToast = page.locator('text=/Tâche mise à jour/i');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    
    // Vérifier que le titre a bien changé
    const updatedTask = page.locator('text=Tâche modifiée');
    await expect(updatedTask).toBeVisible();
  });

  test.skip('devrait permettre de changer le statut d\'une tâche', async ({ page }) => {
    // IMPORTANT: Test désactivé - nécessite un environnement de test
    
    await page.goto('/dashboard');
    await page.locator('text=Tâches').click();
    
    // Trouver une tâche "pending"
    const pendingTask = page.locator('[data-testid="task-card"][data-status="pending"]').first();
    await pendingTask.click();
    
    // Changer le statut
    await page.locator('[data-testid="status-select"]').click();
    await page.locator('text=En cours').click();
    
    // Vérifier le changement de statut
    await expect(pendingTask).toHaveAttribute('data-status', 'in_progress');
    
    // Vérifier le badge de statut
    const statusBadge = pendingTask.locator('text=En cours');
    await expect(statusBadge).toBeVisible();
  });
});

test.describe('Téléchargement de fichiers', () => {
  test.skip('devrait permettre de télécharger un fichier joint à une tâche', async ({ page }) => {
    // IMPORTANT: Test désactivé - nécessite un environnement de test
    
    await page.goto('/dashboard');
    await page.locator('text=Tâches').click();
    
    // Trouver une tâche avec fichier
    const taskWithFile = page.locator('[data-testid="task-card"]').filter({ hasText: 'document-test.pdf' }).first();
    await taskWithFile.click();
    
    // Préparer le téléchargement
    const downloadPromise = page.waitForEvent('download');
    
    // Cliquer sur le bouton de téléchargement
    await page.locator('[data-testid="download-file-button"]').first().click();
    
    // Attendre le téléchargement
    const download = await downloadPromise;
    
    // Vérifier le nom du fichier
    expect(download.suggestedFilename()).toBe('document-test.pdf');
    
    // Vérifier que le fichier a été téléchargé
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});

import * as Sentry from "@sentry/browser";

/**
 * Initialise Sentry pour le monitoring des erreurs
 * Compatible avec @sentry/browser v7 et React 18
 * Appelé au démarrage de l'application
 */
export function initializeSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  if (!dsn || environment === 'development') {
    console.log('[Sentry] Désactivé en développement ou DSN manquant');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Intégrations minimales - pas besoin d'intégration React
    integrations: [],

    // Normalisation des données
    normalizeDepth: 5,

    // Filtrer les erreurs connues non critiques
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Ignorer les erreurs réseau temporaires
      if (error?.message?.includes('Failed to fetch')) {
        return null;
      }

      // Ignorer les erreurs réseau
      if (error?.message?.includes('NetworkError')) {
        return null;
      }

      // Ignorer les erreurs d'authentification (gérées par l'UI)
      if (error?.message?.includes('Invalid login credentials')) {
        return null;
      }

      return event;
    },

    // Enrichir le contexte des erreurs
    beforeBreadcrumb(breadcrumb) {
      // Masquer les paramètres sensibles dans les URLs
      if (breadcrumb.category === 'navigation') {
        breadcrumb.message = breadcrumb.message?.replace(/\?.*$/, '');
      }
      return breadcrumb;
    },
  });

  console.log('[Sentry] Initialisé avec succès');
}

/**
 * Capturer une erreur manuelle
 * @param {Error} error - L'erreur à capturer
 * @param {Object} context - Contexte additionnel
 */
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Définir l'utilisateur connecté pour Sentry
 * @param {Object} user - Informations utilisateur (sans données sensibles)
 */
export function setSentryUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
    // Ne pas inclure de données sensibles
  });
}

/**
 * Ajouter du contexte à toutes les erreurs futures
 * @param {string} key - Clé du contexte
 * @param {any} value - Valeur du contexte
 */
export function setSentryContext(key, value) {
  Sentry.setContext(key, value);
}

import * as Sentry from '@sentry/react';

/**
 * Initialise Sentry pour le monitoring des erreurs
 * Appelé au démarrage de l'application
 */
export function initializeSentry() {
  // Activer uniquement en production avec DSN configuré
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  if (!dsn || environment === 'development') {
    console.log('[Sentry] Désactivé en développement ou DSN manquant');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Masquer les données sensibles
        blockAllMedia: true,
      }),
    ],

    // Taux d'échantillonnage des traces de performance (10% en prod)
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session replay: capturer 10% des sessions normales
    replaysSessionSampleRate: 0.1,
    
    // Session replay: capturer 100% des sessions avec erreurs
    replaysOnErrorSampleRate: 1.0,

    // Filtrer les erreurs connues non critiques
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Ignorer les erreurs réseau temporaires
      if (error?.message?.includes('Failed to fetch')) {
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

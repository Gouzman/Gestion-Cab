/**
 * ============================================
 * Hook : useAutoLogout
 * ============================================
 * Gestion de la déconnexion automatique après inactivité
 * 
 * Fonctionnalités :
 * - Détection d'inactivité utilisateur
 * - Timer configurable (5, 10, 15 minutes)
 * - Modal d'avertissement avant déconnexion
 * - Déconnexion automatique après expiration
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_TIMEOUT = 15 * 60 * 1000; // 15 minutes par défaut
const WARNING_TIME = 60 * 1000; // Avertir 1 minute avant

export const useAutoLogout = (onLogout, timeoutMinutes = 15) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const timeout = timeoutMinutes * 60 * 1000;

  // Nettoyer tous les timers
  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Déconnexion forcée
  const forceLogout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    if (onLogout) {
      onLogout();
    }
  }, [onLogout, clearAllTimers]);

  // Réinitialiser le timer d'inactivité
  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setRemainingSeconds(60);
    lastActivityRef.current = Date.now();

    // Timer d'avertissement
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(60);
      
      // Compte à rebours
      countdownRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            forceLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, timeout - WARNING_TIME);

    // Timer de déconnexion finale
    timeoutRef.current = setTimeout(() => {
      forceLogout();
    }, timeout);
  }, [timeout, forceLogout, clearAllTimers]);

  // Prolonger la session
  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Événements d'activité utilisateur
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      const now = Date.now();
      // Throttle : ne réinitialiser que si 5 secondes se sont écoulées
      if (now - lastActivityRef.current > 5000) {
        resetTimer();
      }
    };

    // Ajouter les listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initialiser le timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [resetTimer, clearAllTimers]);

  return {
    showWarning,
    remainingSeconds,
    extendSession,
    forceLogout
  };
};

export default useAutoLogout;

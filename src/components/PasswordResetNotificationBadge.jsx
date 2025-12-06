/**
 * ============================================
 * Composant : PasswordResetNotificationBadge
 * ============================================
 * Badge de notification pour les demandes de réinitialisation en attente
 * Affiche un compteur rouge dans le menu Paramètres
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/InternalAuthContext';

const PasswordResetNotificationBadge = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const { user } = useAuth();

  // Vérifier si l'utilisateur est admin ou gérant
  const isGerantOrAdmin = user && (
    user.function === 'Gerant' || 
    user.function === 'Associe Emerite' || 
    user.role === 'admin' || 
    user.role === 'gerant'
  );

  useEffect(() => {
    if (!isGerantOrAdmin) return;

    fetchPendingCount();

    // Écouter les changements en temps réel
    const subscription = supabase
      .channel('password_reset_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'password_reset_requests'
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      fetchPendingCount();
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [isGerantOrAdmin]);

  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('password_reset_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!error) {
        console.log('🔔 [Badge] Demandes en attente:', count);
        setPendingCount(count || 0);
      } else {
        // Table n'existe pas ou erreur RLS - ne pas afficher d'erreur
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('⚠️ [Badge] Table password_reset_requests non disponible');
        } else {
          console.error('❌ [Badge] Erreur comptage:', error);
        }
        setPendingCount(0);
      }
    } catch (error) {
      // Erreur réseau ou autre - ne pas afficher
      console.warn('⚠️ [Badge] Impossible de charger les demandes:', error.message);
      setPendingCount(0);
    }
  };

  if (!isGerantOrAdmin || pendingCount === 0) {
    return null;
  }

  return (
    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
      {pendingCount}
    </span>
  );
};

export default PasswordResetNotificationBadge;

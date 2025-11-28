import { createClient } from '@supabase/supabase-js';

// Configuration Supabase utilisant les variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérification que les variables d'environnement sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans le fichier .env.local');
}

// Configuration avec headers CORS appropriés pour les requêtes REST
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'gestion-cab-auth',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Gestion des erreurs d'authentification
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token rafraîchi automatiquement');
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 Utilisateur déconnecté');
    // Nettoyer le localStorage si nécessaire
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gestion-cab-auth');
    }
  } else if (event === 'USER_UPDATED') {
    console.log('👤 Informations utilisateur mises à jour');
  }
});
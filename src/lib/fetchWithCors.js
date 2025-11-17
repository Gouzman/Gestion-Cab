// src/lib/fetchWithCors.js
// Utilitaire centralisé pour les appels fetch avec headers CORS appropriés pour Supabase

/**
 * Effectue un fetch avec les headers CORS appropriés pour Supabase
 * @param {string} url - URL à fetcher
 * @param {RequestInit} options - Options fetch standard
 * @returns {Promise<Response>} Response du fetch
 */
export async function fetchWithCors(url, options = {}) {
  const isSupabaseUrl = url.includes('.supabase.co');
  const headers = { ...(options.headers || {}) };
  
  // Ajouter les headers Supabase si nécessaire
  if (isSupabaseUrl) {
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseAnonKey && !headers['apikey']) {
      headers['apikey'] = supabaseAnonKey;
      headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
    }
  }
  
  // Fusionner les options avec mode CORS
  const fetchOptions = {
    ...options,
    headers,
    mode: 'cors',
  };
  
  return fetch(url, fetchOptions);
}

/**
 * Valide qu'une URL est accessible via HEAD request avec CORS
 * @param {string} url - URL à valider
 * @returns {Promise<boolean>} true si accessible
 */
export async function validateUrlWithCors(url) {
  if (!url || !url.startsWith('http')) return false;
  
  try {
    const response = await fetchWithCors(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Télécharge un fichier via fetch avec CORS
 * @param {string} url - URL du fichier
 * @returns {Promise<Blob>} Blob du fichier
 */
export async function downloadFileWithCors(url) {
  const response = await fetchWithCors(url);
  if (!response.ok) {
    throw new Error(`Échec du téléchargement: ${response.status} ${response.statusText}`);
  }
  return response.blob();
}

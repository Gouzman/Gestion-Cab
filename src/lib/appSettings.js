/**
 * ============================================
 * API de gestion des paramètres d'application
 * ============================================
 * 
 * Ce module fournit une interface unifiée pour lire et modifier
 * les paramètres de l'application stockés dans la table app_settings.
 * 
 * IMPORTANT : Ne modifie AUCUNE logique existante.
 * Ce fichier est totalement isolé et peut être utilisé partout dans l'app.
 * 
 * Usage :
 * - getAppSettings() : Récupérer tous les paramètres
 * - updateAppSettings(updates) : Mettre à jour des paramètres
 * - useAppSettings() : Hook React pour utiliser les paramètres
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Structure par défaut des paramètres
 */
const DEFAULT_SETTINGS = {
  company_info: {
    name: "Cabinet d'Avocats",
    logo_url: "",
    address: "",
    phone: "",
    email: "",
    slogan: "",
    description: ""
  },
  menu_config: {
    items: [
      { id: "dashboard", label: "Tableau de bord", enabled: true, order: 1 },
      { id: "clients", label: "Clients", enabled: true, order: 2 },
      { id: "cases", label: "Dossiers", enabled: true, order: 3 },
      { id: "tasks", label: "Tâches", enabled: true, order: 4 },
      { id: "documents", label: "Documents", enabled: true, order: 5 },
      { id: "calendar", label: "Calendrier", enabled: true, order: 6 },
      { id: "team", label: "Collaborateurs", enabled: true, order: 7 },
      { id: "billing", label: "Facturation", enabled: true, order: 8 },
      { id: "settings", label: "Paramètres", enabled: true, order: 9 }
    ]
  },
  categories_config: {
    task_categories: [],
    case_types: [],
    user_roles: [
      { value: "admin", label: "Administrateur" },
      { value: "gerant", label: "Gérant" },
      { value: "avocat", label: "Avocat" },
      { value: "secretaire", label: "Secrétaire" }
    ],
    task_statuses: [
      { value: "todo", label: "À faire", color: "gray" },
      { value: "in_progress", label: "En cours", color: "blue" },
      { value: "done", label: "Terminé", color: "green" }
    ],
    case_statuses: [
      { value: "open", label: "Ouvert", color: "green" },
      { value: "in_progress", label: "En cours", color: "blue" },
      { value: "closed", label: "Fermé", color: "gray" }
    ]
  }
};

/**
 * Récupérer tous les paramètres de l'application
 * @returns {Promise<Object>} Les paramètres ou les valeurs par défaut
 */
export const getAppSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.debug('Table app_settings non disponible, utilisation des valeurs par défaut:', error.code);
      return DEFAULT_SETTINGS;
    }

    return data || DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Mettre à jour les paramètres de l'application
 * @param {Object} updates - Objet contenant les champs à mettre à jour
 * @returns {Promise<Object>} Résultat de l'opération { success, data, error }
 */
export const updateAppSettings = async (updates) => {
  try {
    // Vérifier si l'enregistrement existe
    const { data: existingData, error: checkError } = await supabase
      .from('app_settings')
      .select('id')
      .eq('id', 1)
      .maybeSingle();

    if (checkError) {
      console.error('Erreur lors de la vérification des paramètres:', checkError);
      return { success: false, error: checkError };
    }

    // Si l'enregistrement n'existe pas, le créer avec les valeurs par défaut + updates
    if (!existingData) {
      const { data, error } = await supabase
        .from('app_settings')
        .insert({
          id: 1,
          ...DEFAULT_SETTINGS,
          ...updates
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création des paramètres:', error);
        return { success: false, error };
      }

      return { success: true, data };
    }

    // Sinon, mettre à jour l'enregistrement existant
    const { data, error } = await supabase
      .from('app_settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour:', error);
    return { success: false, error };
  }
};

/**
 * Mettre à jour uniquement les informations de l'entreprise
 * @param {Object} companyInfo - Objet contenant les infos entreprise
 * @returns {Promise<Object>} Résultat de l'opération
 */
export const updateCompanyInfo = async (companyInfo) => {
  return updateAppSettings({ company_info: companyInfo });
};

/**
 * Mettre à jour uniquement la configuration du menu
 * @param {Object} menuConfig - Objet contenant la config menu
 * @returns {Promise<Object>} Résultat de l'opération
 */
export const updateMenuConfig = async (menuConfig) => {
  return updateAppSettings({ menu_config: menuConfig });
};

/**
 * Mettre à jour uniquement les catégories
 * @param {Object} categoriesConfig - Objet contenant les catégories
 * @returns {Promise<Object>} Résultat de l'opération
 */
export const updateCategoriesConfig = async (categoriesConfig) => {
  return updateAppSettings({ categories_config: categoriesConfig });
};

/**
 * Hook React pour utiliser les paramètres d'application
 * @returns {Object} { settings, loading, error, refetch }
 */
export const useAppSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getAppSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err);
      setError(err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings
  };
};

/**
 * Hook pour récupérer uniquement les informations de l'entreprise
 * @returns {Object} { companyInfo, loading, error }
 */
export const useCompanyInfo = () => {
  const { settings, loading, error } = useAppSettings();
  return {
    companyInfo: settings.company_info || DEFAULT_SETTINGS.company_info,
    loading,
    error
  };
};

/**
 * Hook pour récupérer uniquement la configuration du menu
 * @returns {Object} { menuConfig, loading, error }
 */
export const useMenuConfig = () => {
  const { settings, loading, error } = useAppSettings();
  return {
    menuConfig: settings.menu_config || DEFAULT_SETTINGS.menu_config,
    loading,
    error
  };
};

/**
 * Hook pour récupérer uniquement les catégories
 * @returns {Object} { categoriesConfig, loading, error }
 */
export const useCategoriesConfig = () => {
  const { settings, loading, error } = useAppSettings();
  return {
    categoriesConfig: settings.categories_config || DEFAULT_SETTINGS.categories_config,
    loading,
    error
  };
};

export default {
  getAppSettings,
  updateAppSettings,
  updateCompanyInfo,
  updateMenuConfig,
  updateCategoriesConfig,
  useAppSettings,
  useCompanyInfo,
  useMenuConfig,
  useCategoriesConfig
};

/**
 * Configuration des fonctionnalités - Gestion-Cab
 * 
 * Ce fichier permet d'activer/désactiver les nouvelles fonctionnalités
 * selon que la migration SQL a été exécutée ou non.
 * 
 * INSTRUCTIONS:
 * 1. Par défaut, les nouvelles colonnes sont DÉSACTIVÉES
 * 2. Après avoir exécuté sql/migration_conformite_juridique.sql dans Supabase
 * 3. Changez MIGRATION_EXECUTED à true
 */

// ⚠️ IMPORTANT: Mettre à true APRÈS avoir exécuté la migration SQL
export const MIGRATION_EXECUTED = false;

/**
 * Colonnes de la table 'cases' disponibles selon l'état de la migration
 */
export const getCaseColumns = () => {
  const baseColumns = [
    'title',
    'case_type',
    'client_id',
    'opposing_party',
    'assigned_to',
    'next_hearing',
    'description',
    'status',
    'priority',
    'honoraire',
    'notes',
    'attachments',
    'visible_to'
  ];

  const newColumns = [
    'code_dossier',          // Nouveau: référence du dossier
    'objet_du_dossier',      // Nouveau: objet juridique
    'type_de_diligence',     // Nouveau: type de procédure
    'qualite_du_client'      // Nouveau: personne physique/morale
  ];

  return MIGRATION_EXECUTED 
    ? [...baseColumns, ...newColumns] 
    : baseColumns;
};

/**
 * Colonnes pour l'insertion (incluant created_by)
 */
export const getCaseInsertColumns = () => {
  return [...getCaseColumns(), 'created_by'];
};

/**
 * Vérifie si une fonctionnalité est disponible
 */
export const isFeatureEnabled = (featureName) => {
  const features = {
    'client_code': MIGRATION_EXECUTED,          // Numéro client automatique
    'case_reference': MIGRATION_EXECUTED,        // code_dossier + id_dossier
    'document_categories': MIGRATION_EXECUTED,   // 5 catégories de documents
    'case_instances': MIGRATION_EXECUTED,        // Table dossier_instance
    'new_case_fields': MIGRATION_EXECUTED        // objet_du_dossier, etc.
  };

  return features[featureName] || false;
};

export default {
  MIGRATION_EXECUTED,
  getCaseColumns,
  getCaseInsertColumns,
  isFeatureEnabled
};

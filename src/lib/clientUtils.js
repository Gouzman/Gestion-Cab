// src/lib/clientUtils.js
// Utilitaires pour la gestion des clients

/**
 * Retourne le nom d'affichage d'un client en fonction de son type
 * @param {Object} client - Objet client avec les propriétés type, company, first_name, last_name, firstName, lastName
 * @returns {string} - Nom d'affichage formaté
 */
export function getClientDisplayName(client) {
  if (!client) return 'Inconnu';

  // Normaliser les noms de champs (camelCase ou snake_case)
  const type = client.type || client.type_client;
  const companyName = client.company || client.company_name;
  const firstName = client.firstName || client.first_name;
  const lastName = client.lastName || client.last_name;

  // Si c'est une entreprise, afficher le nom de l'entreprise
  if (type === 'company' || type === 'entreprise') {
    if (companyName && companyName.trim() !== '') {
      return companyName.trim();
    }
    // Fallback sur nom/prénom si pas de nom d'entreprise
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim() || 'Entreprise sans nom';
    }
    return 'Entreprise sans nom';
  }

  // Si c'est un particulier, afficher prénom + nom
  if (type === 'individual' || type === 'particulier') {
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim() || 'Inconnu';
    }
    return 'Particulier sans nom';
  }

  // Fallback par défaut (si type non reconnu)
  if (companyName && companyName.trim() !== '') {
    return companyName.trim();
  }
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }

  return 'Inconnu';
}

/**
 * Retourne une description du type de client pour l'affichage
 * @param {string} type - Type du client ('company', 'individual', 'entreprise', 'particulier')
 * @returns {string} - Label du type de client
 */
export function getClientTypeLabel(type) {
  if (type === 'company' || type === 'entreprise') {
    return 'Entreprise';
  }
  if (type === 'individual' || type === 'particulier') {
    return 'Particulier';
  }
  return 'Non défini';
}

/**
 * Vérifie si un client est une entreprise
 * @param {Object} client - Objet client
 * @returns {boolean}
 */
export function isCompanyClient(client) {
  const type = client?.type || client?.type_client;
  return type === 'company' || type === 'entreprise';
}

/**
 * Vérifie si un client est un particulier
 * @param {Object} client - Objet client
 * @returns {boolean}
 */
export function isIndividualClient(client) {
  const type = client?.type || client?.type_client;
  return type === 'individual' || type === 'particulier';
}

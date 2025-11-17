/**
 * ============================================
 * EXEMPLES D'UTILISATION - Module Paramètres
 * ============================================
 * 
 * Ce fichier contient des exemples concrets d'utilisation
 * du module de paramètres dans différents composants.
 */

// ============================================
// EXEMPLE 1 : Afficher le nom de l'entreprise dans le Header
// ============================================

import { useCompanyInfo } from '@/lib/appSettings';

const Header = () => {
  const { companyInfo, loading } = useCompanyInfo();

  if (loading) return <div>Chargement...</div>;

  return (
    <header className="bg-slate-800 p-4">
      {companyInfo.logo_url && (
        <img 
          src={companyInfo.logo_url} 
          alt={companyInfo.name} 
          className="h-12 mb-2"
        />
      )}
      <h1 className="text-2xl font-bold text-white">{companyInfo.name}</h1>
      {companyInfo.slogan && (
        <p className="text-slate-400 text-sm">{companyInfo.slogan}</p>
      )}
    </header>
  );
};

// ============================================
// EXEMPLE 2 : Menu dynamique basé sur la configuration
// ============================================

import { useMenuConfig } from '@/lib/appSettings';
import { Home, Users, FolderOpen, CheckSquare, FileText, Calendar, Settings } from 'lucide-react';

const iconMap = {
  dashboard: Home,
  clients: Users,
  cases: FolderOpen,
  tasks: CheckSquare,
  documents: FileText,
  calendar: Calendar,
  settings: Settings,
};

const DynamicMenu = () => {
  const { menuConfig, loading } = useMenuConfig();

  if (loading) return <div>Chargement du menu...</div>;

  const visibleItems = menuConfig.items
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <nav className="space-y-2">
      {visibleItems.map(item => {
        const Icon = iconMap[item.id] || Home;
        return (
          <a
            key={item.id}
            href={`/${item.id}`}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-700"
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

// ============================================
// EXEMPLE 3 : Sélecteur de catégories de tâches
// ============================================

import { useCategoriesConfig } from '@/lib/appSettings';

const TaskCategorySelector = ({ value, onChange }) => {
  const { categoriesConfig, loading } = useCategoriesConfig();

  if (loading) {
    return (
      <select disabled>
        <option>Chargement...</option>
      </select>
    );
  }

  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
    >
      <option value="">Sélectionner une catégorie</option>
      {categoriesConfig.task_categories.map(cat => (
        <option key={cat.value} value={cat.value}>
          {cat.label}
        </option>
      ))}
    </select>
  );
};

// ============================================
// EXEMPLE 4 : Badge de statut avec couleur dynamique
// ============================================

import { useCategoriesConfig } from '@/lib/appSettings';

const TaskStatusBadge = ({ statusValue }) => {
  const { categoriesConfig, loading } = useCategoriesConfig();

  if (loading) return <span>...</span>;

  const status = categoriesConfig.task_statuses.find(s => s.value === statusValue);
  if (!status) return <span>{statusValue}</span>;

  return (
    <span
      className="px-3 py-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: status.color || '#6366f1',
        color: 'white'
      }}
    >
      {status.label}
    </span>
  );
};

// ============================================
// EXEMPLE 5 : Footer avec toutes les infos entreprise
// ============================================

import { useCompanyInfo } from '@/lib/appSettings';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  const { companyInfo } = useCompanyInfo();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Infos générales */}
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              {companyInfo.name}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {companyInfo.description}
            </p>
          </div>

          {/* Coordonnées */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-sm text-slate-400">
              {companyInfo.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>{companyInfo.address}</span>
                </div>
              )}
              {companyInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{companyInfo.phone}</span>
                </div>
              )}
              {companyInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href={`mailto:${companyInfo.email}`} className="hover:text-white">
                    {companyInfo.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center md:justify-end">
            {companyInfo.logo_url && (
              <img
                src={companyInfo.logo_url}
                alt={companyInfo.name}
                className="h-20 object-contain"
              />
            )}
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} {companyInfo.name}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

// ============================================
// EXEMPLE 6 : Formulaire avec rôles utilisateurs dynamiques
// ============================================

import { useCategoriesConfig } from '@/lib/appSettings';

const UserRoleForm = ({ selectedRole, onRoleChange }) => {
  const { categoriesConfig, loading } = useCategoriesConfig();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Rôle de l'utilisateur
      </label>
      <select
        value={selectedRole}
        onChange={(e) => onRoleChange(e.target.value)}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
      >
        <option value="">Sélectionner un rôle</option>
        {categoriesConfig.user_roles.map(role => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================
// EXEMPLE 7 : Récupération et mise à jour programmatique
// ============================================

import { getAppSettings, updateCompanyInfo } from '@/lib/appSettings';

// Fonction asynchrone pour récupérer les paramètres
const fetchAndDisplaySettings = async () => {
  const settings = await getAppSettings();
  console.log('Paramètres actuels:', settings);
  console.log('Nom entreprise:', settings.company_info.name);
  console.log('Menu items:', settings.menu_config.items);
};

// Fonction asynchrone pour mettre à jour les infos entreprise
const updateCompanyName = async (newName) => {
  const settings = await getAppSettings();
  const updatedInfo = {
    ...settings.company_info,
    name: newName
  };
  
  const result = await updateCompanyInfo(updatedInfo);
  
  if (result.success) {
    console.log('✅ Nom mis à jour avec succès');
  } else {
    console.error('❌ Erreur:', result.error);
  }
};

// ============================================
// EXEMPLE 8 : Hook personnalisé pour filtrer les items du menu
// ============================================

import { useMenuConfig } from '@/lib/appSettings';
import { useMemo } from 'react';

const useEnabledMenuItems = () => {
  const { menuConfig, loading, error } = useMenuConfig();

  const enabledItems = useMemo(() => {
    if (!menuConfig?.items) return [];
    return menuConfig.items
      .filter(item => item.enabled)
      .sort((a, b) => a.order - b.order);
  }, [menuConfig]);

  return { enabledItems, loading, error };
};

// Utilisation :
const MyComponent = () => {
  const { enabledItems, loading } = useEnabledMenuItems();
  
  if (loading) return <div>Chargement...</div>;
  
  return (
    <ul>
      {enabledItems.map(item => (
        <li key={item.id}>{item.label}</li>
      ))}
    </ul>
  );
};

// ============================================
// EXEMPLE 9 : Utilisation dans un formulaire de création de dossier
// ============================================

import { useCategoriesConfig } from '@/lib/appSettings';
import { useState } from 'react';

const CaseForm = () => {
  const { categoriesConfig, loading } = useCategoriesConfig();
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    status: 'open'
  });

  if (loading) return <div>Chargement du formulaire...</div>;

  return (
    <form className="space-y-4">
      <div>
        <label>Titre du dossier</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white"
        />
      </div>

      <div>
        <label>Type de dossier</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white"
        >
          <option value="">Sélectionner un type</option>
          {categoriesConfig.case_types.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Statut</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white"
        >
          {categoriesConfig.case_statuses.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="px-6 py-2 bg-blue-500 rounded-lg text-white">
        Créer le dossier
      </button>
    </form>
  );
};

// ============================================
// EXEMPLE 10 : Afficher un aperçu des paramètres (pour debug)
// ============================================

import { useAppSettings } from '@/lib/appSettings';

const SettingsDebugPanel = () => {
  const { settings, loading, error } = useAppSettings();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <h3 className="text-white font-bold mb-4">Paramètres actuels (Debug)</h3>
      <pre className="text-xs text-slate-300 overflow-auto max-h-96">
        {JSON.stringify(settings, null, 2)}
      </pre>
    </div>
  );
};

export {
  Header,
  DynamicMenu,
  TaskCategorySelector,
  TaskStatusBadge,
  Footer,
  UserRoleForm,
  fetchAndDisplaySettings,
  updateCompanyName,
  useEnabledMenuItems,
  CaseForm,
  SettingsDebugPanel
};

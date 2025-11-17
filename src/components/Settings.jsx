import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Save, Plus, Trash2, Shield, History, Building2, Menu as MenuIcon, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import PermissionManager from '@/components/PermissionManager';
import AdminUserHistory from '@/components/AdminUserHistory';
import CompanyInfoSettings from '@/components/CompanyInfoSettings';
import MenuConfigSettings from '@/components/MenuConfigSettings';
import CategoriesConfigSettings from '@/components/CategoriesConfigSettings';
import MenuPermissionsManager from '@/components/MenuPermissionsManager';




const Settings = () => {
  const { user } = useAuth();
  const [taskCategories, setTaskCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState('permissions');

  // Vérification des droits : Seuls les Gérants et Admins peuvent accéder
  const isGerantOrAdmin = user && (
    user.function === 'Gerant' || 
    user.function === 'Associe Emerite' || 
    user.role === 'admin' || 
    user.role === 'gerant'
  );



  // Vérification spécifique Admin pour l'historique des comptes
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isGerantOrAdmin) {
      fetchCategories();
    }
  }, [isGerantOrAdmin]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('app_settings').select('categories_config').single();
    if (error) {
      // Table app_settings n'existe pas encore - ignorer silencieusement
      console.debug('Table app_settings non disponible:', error.code);
      return;
    }
    if (data?.categories_config?.task_categories) {
      setTaskCategories(data.categories_config.task_categories);
    }
  };



  const handleAddCategory = () => {
    if (newCategory.trim() === '') return;
    const newCat = { value: newCategory.toLowerCase().replaceAll(/\s+/g, '-'), label: newCategory };
    if (taskCategories.some(cat => cat.value === newCat.value)) {
      toast({ variant: "destructive", title: "Catégorie existante" });
      return;
    }
    setTaskCategories([...taskCategories, newCat]);
    setNewCategory('');
  };

  const handleDeleteCategory = (value) => {
    setTaskCategories(taskCategories.filter(cat => cat.value !== value));
  };

  const handleSaveSettings = async () => {
    const { error } = await supabase.from('app_settings').upsert({ 
      id: 1, 
      categories_config: { task_categories: taskCategories } 
    });
    if (error) {
      // Si la table n'existe pas, ignorer silencieusement
      if (error.code === 'PGRST205' || error.code === '42P01') {
        console.debug('Table app_settings non disponible - sauvegarde ignorée');
        toast({ title: "⚠️ Fonctionnalité non disponible", description: "La table app_settings n'existe pas encore." });
        return;
      }
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder les paramètres." });
    } else {
      toast({ title: "✅ Paramètres sauvegardés", description: "Vos modifications ont été enregistrées." });
    }
  };



  if (!isGerantOrAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">Accès non autorisé</h1>
        <p className="text-slate-400 mb-2">Seuls les Gérants peuvent accéder à cette page.</p>
        <p className="text-slate-500 text-sm">
          Votre rôle actuel : {user?.role || 'Non défini'} | 
          Fonction : {user?.function || 'Non définie'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
        <p className="text-slate-400">Gérez les configurations de l'application.</p>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-slate-700">
        <nav className="flex flex-wrap space-x-4 md:space-x-8">
          <button
            onClick={() => setActiveTab('company')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'company'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Entreprise
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'menu'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <MenuIcon className="w-4 h-4 inline mr-2" />
            Menu
          </button>

          <button
            onClick={() => setActiveTab('advanced-categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'advanced-categories'
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Tags className="w-4 h-4 inline mr-2" />
            Catégories avancées
          </button>
          
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Permissions
          </button>

          <button
            onClick={() => setActiveTab('menu-permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'menu-permissions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <MenuIcon className="w-4 h-4 inline mr-2" />
            Permissions Menu
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admin'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              Admin
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Tag className="w-4 h-4 inline mr-2" />
            Catégories (legacy)
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'company' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <CompanyInfoSettings />
        </motion.div>
      )}

      {activeTab === 'menu' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <MenuConfigSettings />
        </motion.div>
      )}

      {activeTab === 'advanced-categories' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <CategoriesConfigSettings />
        </motion.div>
      )}
      
      {activeTab === 'permissions' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <PermissionManager />
        </motion.div>
      )}

      {activeTab === 'menu-permissions' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <MenuPermissionsManager />
        </motion.div>
      )}

      {activeTab === 'admin' && isAdmin && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <AdminUserHistory />
        </motion.div>
      )}

      {activeTab === 'categories' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6"><Tag className="w-6 h-6 text-blue-400" /><h2 className="text-xl font-semibold text-white">Catégories de Tâches</h2></div>
          <div className="space-y-3 mb-4">
            {taskCategories.map(cat => (
              <div key={cat.value} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                <span className="text-slate-300">{cat.label}</span>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (window.confirm(`Voulez-vous vraiment supprimer la catégorie "${cat.label}" ?\n\nCette action est irréversible.`)) {
                    handleDeleteCategory(cat.value);
                  }
                }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nouvelle catégorie..." className="flex-grow px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Button onClick={handleAddCategory} className="bg-blue-500 hover:bg-blue-600"><Plus className="w-4 h-4 mr-2" /> Ajouter</Button>
          </div>
        </motion.div>
      )}

      {activeTab === 'categories' && (
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"><Save className="w-5 h-5 mr-2" /> Sauvegarder les Paramètres Généraux</Button>
        </div>
      )}
    </div>
  );
};

export default Settings;
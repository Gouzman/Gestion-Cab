/**
 * ============================================
 * Composant : CategoriesConfigSettings
 * ============================================
 * Gestion avancée des catégories et types configurables
 * (catégories de tâches, types de dossiers, rôles, statuts)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tags, Save, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useCategoriesConfig, updateCategoriesConfig } from '@/lib/appSettings';

const CategoriesConfigSettings = () => {
  const { categoriesConfig, loading } = useCategoriesConfig();
  const [config, setConfig] = useState({
    task_categories: [],
    case_types: [],
    user_roles: [],
    task_statuses: [],
    case_statuses: []
  });
  const [activeSection, setActiveSection] = useState('task_categories');
  const [newItem, setNewItem] = useState({ value: '', label: '', color: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categoriesConfig) {
      setConfig(categoriesConfig);
    }
  }, [categoriesConfig]);

  const addItem = () => {
    if (!newItem.label.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Le label est requis." });
      return;
    }

    const value = newItem.value || newItem.label.toLowerCase().replace(/\s+/g, '_');
    const item = { 
      value, 
      label: newItem.label,
      ...(newItem.color && { color: newItem.color })
    };

    setConfig(prev => ({
      ...prev,
      [activeSection]: [...prev[activeSection], item]
    }));

    setNewItem({ value: '', label: '', color: '' });
  };

  const deleteItem = (section, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.value !== value)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateCategoriesConfig(config);
    
    if (result.success) {
      toast({ 
        title: "✅ Catégories sauvegardées", 
        description: "Les catégories ont été mises à jour." 
      });
    } else {
      toast({ 
        variant: "destructive",
        title: "❌ Erreur", 
        description: "Impossible de sauvegarder les catégories." 
      });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-8">Chargement...</div>;
  }

  const sections = [
    { key: 'task_categories', label: 'Catégories de tâches', hasColor: false },
    { key: 'case_types', label: 'Types de dossiers', hasColor: false },
    { key: 'user_roles', label: 'Rôles utilisateurs', hasColor: false },
    { key: 'task_statuses', label: 'Statuts de tâches', hasColor: true },
    { key: 'case_statuses', label: 'Statuts de dossiers', hasColor: true }
  ];

  const currentSection = sections.find(s => s.key === activeSection);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Tags className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-semibold text-white">Gestion des catégories</h2>
      </div>

      {/* Navigation des sections */}
      <div className="flex flex-wrap gap-2">
        {sections.map(section => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.key
                ? 'bg-green-500 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Liste des items */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">{currentSection?.label}</h3>
        
        {config[activeSection]?.map(item => (
          <div
            key={item.value}
            className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg border border-slate-600"
          >
            <div className="flex items-center gap-3">
              {item.color && (
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <div>
                <span className="text-white font-medium">{item.label}</span>
                <span className="ml-2 text-xs text-slate-500">({item.value})</span>
              </div>
            </div>
            <Button
              onClick={() => deleteItem(activeSection, item.value)}
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {config[activeSection]?.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Aucun élément. Ajoutez-en un ci-dessous.
          </div>
        )}
      </div>

      {/* Formulaire d'ajout */}
      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
        <h4 className="text-sm font-medium text-slate-300 mb-3">
          Ajouter un nouvel élément
        </h4>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newItem.label}
              onChange={(e) => setNewItem(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Label (ex: Avocat Senior)"
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              value={newItem.value}
              onChange={(e) => setNewItem(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Valeur (ex: avocat_senior) - optionnel"
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          {currentSection?.hasColor && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Couleur :</label>
              <input
                type="color"
                value={newItem.color || '#6366f1'}
                onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                className="h-10 w-20 rounded border border-slate-600 cursor-pointer"
              />
              <span className="text-xs text-slate-500">{newItem.color || '#6366f1'}</span>
            </div>
          )}
          
          <Button onClick={addItem} className="w-full bg-green-500 hover:bg-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder toutes les catégories'}
        </Button>
      </div>
    </motion.div>
  );
};

export default CategoriesConfigSettings;

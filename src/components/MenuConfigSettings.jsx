/**
 * ============================================
 * Composant : MenuConfigSettings
 * ============================================
 * Gestion de la configuration du menu
 * (activation/désactivation des sections, réorganisation)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Save, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useMenuConfig, updateMenuConfig } from '@/lib/appSettings';

const MenuConfigSettings = () => {
  const { menuConfig, loading } = useMenuConfig();
  const [menuItems, setMenuItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (menuConfig?.items) {
      setMenuItems([...menuConfig.items].sort((a, b) => a.order - b.order));
    }
  }, [menuConfig]);

  const toggleItemEnabled = (id) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const moveItem = (index, direction) => {
    const newItems = [...menuItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Mettre à jour les ordres
    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });
    
    setMenuItems(newItems);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateMenuConfig({ items: menuItems });
    
    if (result.success) {
      toast({ 
        title: "✅ Configuration sauvegardée", 
        description: "La configuration du menu a été mise à jour." 
      });
    } else {
      toast({ 
        variant: "destructive",
        title: "❌ Erreur", 
        description: "Impossible de sauvegarder la configuration." 
      });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-8">Chargement...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Menu className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Configuration du menu</h2>
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
        <p className="text-slate-300 text-sm">
          ✨ Activez/désactivez les sections du menu et réorganisez leur ordre d'affichage.
        </p>
      </div>

      <div className="space-y-3">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            className={`flex items-center gap-3 p-4 rounded-lg border ${
              item.enabled
                ? 'bg-slate-700/50 border-slate-600'
                : 'bg-slate-800/30 border-slate-700/50 opacity-60'
            }`}
          >
            {/* Poignée de déplacement */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 5l-7 7h14l-7-7z" />
                </svg>
              </button>
              <GripVertical className="w-4 h-4 text-slate-500" />
              <button
                onClick={() => moveItem(index, 'down')}
                disabled={index === menuItems.length - 1}
                className="text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 15l7-7H3l7 7z" />
                </svg>
              </button>
            </div>

            {/* Ordre */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-600 text-slate-300 text-sm font-semibold">
              {item.order}
            </div>

            {/* Label */}
            <div className="flex-grow">
              <span className={`font-medium ${item.enabled ? 'text-white' : 'text-slate-500'}`}>
                {item.label}
              </span>
              <span className="ml-2 text-xs text-slate-500">({item.id})</span>
            </div>

            {/* Toggle activation */}
            <Button
              onClick={() => toggleItemEnabled(item.id)}
              variant={item.enabled ? 'outline' : 'ghost'}
              size="sm"
              className={item.enabled ? 'border-green-500 text-green-400' : 'text-slate-500'}
            >
              {item.enabled ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Activé
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Désactivé
                </>
              )}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Statistiques */}
      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">
            Total : <span className="text-white font-semibold">{menuItems.length}</span> sections
          </span>
          <span className="text-slate-400">
            Activées : <span className="text-green-400 font-semibold">
              {menuItems.filter(i => i.enabled).length}
            </span>
          </span>
          <span className="text-slate-400">
            Désactivées : <span className="text-red-400 font-semibold">
              {menuItems.filter(i => !i.enabled).length}
            </span>
          </span>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </motion.div>
  );
};

export default MenuConfigSettings;

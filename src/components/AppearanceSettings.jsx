/**
 * ============================================
 * Composant : AppearanceSettings
 * ============================================
 * Gestion de l'apparence de l'application
 * (thème et couleur d'accentuation)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Sun, Moon, Monitor, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const AppearanceSettings = () => {
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('blue');
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState(15);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Charger les préférences depuis localStorage
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    const savedAccent = localStorage.getItem('app_accent_color') || 'blue';
    const savedLogout = localStorage.getItem('app_auto_logout_minutes') || '15';
    setTheme(savedTheme);
    setAccentColor(savedAccent);
    setAutoLogoutMinutes(parseInt(savedLogout));
  }, []);

  const themes = [
    { value: 'light', label: 'Clair', icon: Sun, description: 'Fond clair avec texte sombre' },
    { value: 'dark', label: 'Sombre', icon: Moon, description: 'Fond sombre avec texte clair' },
    { value: 'auto', label: 'Automatique', icon: Monitor, description: 'Suit les préférences système' }
  ];

  const accentColors = [
    { value: 'blue', label: 'Bleu', color: '#3b82f6', bgClass: 'bg-blue-500' },
    { value: 'green', label: 'Vert', color: '#10b981', bgClass: 'bg-green-500' },
    { value: 'purple', label: 'Violet', color: '#8b5cf6', bgClass: 'bg-purple-500' },
    { value: 'red', label: 'Rouge', color: '#ef4444', bgClass: 'bg-red-500' },
    { value: 'yellow', label: 'Jaune', color: '#f59e0b', bgClass: 'bg-yellow-500' }
  ];

  const handleSave = async () => {
    setSaving(true);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('app_theme', theme);
    localStorage.setItem('app_accent_color', accentColor);
    localStorage.setItem('app_auto_logout_minutes', autoLogoutMinutes.toString());
    
    // Simuler un délai de sauvegarde
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ 
      title: "✅ Apparence sauvegardée", 
      description: "Vos préférences ont été enregistrées. Rechargez la page pour appliquer le délai de déconnexion." 
    });
    
    setSaving(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <Palette className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">Apparence</h2>
      </div>

      {/* Section Thème */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Thème</h3>
          <p className="text-sm text-slate-400 mb-4">
            Choisissez le thème d'affichage de l'application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.value;
            
            return (
              <motion.button
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? 'bg-purple-500/20' : 'bg-slate-700/50'
                  }`}>
                    <Icon className={`w-8 h-8 ${
                      isSelected ? 'text-purple-400' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-medium ${
                      isSelected ? 'text-purple-300' : 'text-white'
                    }`}>
                      {themeOption.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {themeOption.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Section Couleur d'accentuation */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Couleur d'accentuation</h3>
          <p className="text-sm text-slate-400 mb-4">
            Personnalisez la couleur principale de l'interface
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {accentColors.map((colorOption) => {
            const isSelected = accentColor === colorOption.value;
            
            return (
              <motion.button
                key={colorOption.value}
                onClick={() => setAccentColor(colorOption.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-slate-400 bg-slate-700/50'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-3 h-3 text-slate-900" />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col items-center space-y-3">
                  <div 
                    className={`w-12 h-12 rounded-full ${colorOption.bgClass} shadow-lg`}
                    style={{ backgroundColor: colorOption.color }}
                  />
                  <p className={`text-sm font-medium ${
                    isSelected ? 'text-white' : 'text-slate-300'
                  }`}>
                    {colorOption.label}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Section Déconnexion automatique */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Déconnexion automatique</h3>
          <p className="text-sm text-slate-400 mb-4">
            Configurez le délai d'inactivité avant déconnexion automatique pour plus de sécurité
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Délai d'inactivité
          </label>
          <select
            value={autoLogoutMinutes}
            onChange={(e) => setAutoLogoutMinutes(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes (recommandé)</option>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
          <p className="text-xs text-slate-500 mt-2">
            ⚠️ Un avertissement apparaîtra 1 minute avant la déconnexion
          </p>
        </div>
      </div>

      {/* Aperçu */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h4 className="text-sm font-medium text-slate-300 mb-4">Aperçu des préférences</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div 
              className={`w-4 h-4 rounded-full ${
                accentColors.find(c => c.value === accentColor)?.bgClass
              }`}
            />
            <span className="text-sm text-slate-400">
              Couleur d'accentuation : <span className="text-white font-medium">
                {accentColors.find(c => c.value === accentColor)?.label}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {theme === 'light' && <Sun className="w-4 h-4 text-slate-400" />}
            {theme === 'dark' && <Moon className="w-4 h-4 text-slate-400" />}
            {theme === 'auto' && <Monitor className="w-4 h-4 text-slate-400" />}
            <span className="text-sm text-slate-400">
              Thème : <span className="text-white font-medium">
                {themes.find(t => t.value === theme)?.label}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">
              Déconnexion auto : <span className="text-white font-medium">
                {autoLogoutMinutes} minutes
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Sauvegarde...' : 'Enregistrer les préférences'}
        </Button>
      </div>
    </motion.div>
  );
};

export default AppearanceSettings;

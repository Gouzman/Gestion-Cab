import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Save, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissionsManager, defaultPermissionsByRole } from '@/lib/permissionsUtils';
import { toast } from '@/components/ui/use-toast';

// Modules du menu (copié de la structure existante)
const menuModules = [
  { id: 'dashboard', label: 'Tableau de Bord' },
  { id: 'tasks', label: 'Tâches' },
  { id: 'clients', label: 'Clients' },
  { id: 'cases', label: 'Dossiers' },
  { id: 'calendar', label: 'Agenda' },
  { id: 'documents', label: 'Documents' },
  { id: 'billing', label: 'Facturation' },
  { id: 'team', label: 'Collaborateurs' },
  { id: 'reports', label: 'Statistiques' },
  { id: 'settings', label: 'Paramètres' },
];

// Rôles disponibles (copié de la structure existante)
const roles = [
  { id: 'admin', label: 'Administrateur', color: 'red' },
  { id: 'gerant', label: 'Gérant', color: 'red' },
  { id: 'avocat', label: 'Avocat', color: 'blue' },
  { id: 'secretaire', label: 'Secrétaire', color: 'green' },
  { id: 'user', label: 'Utilisateur', color: 'gray' },
];

const MenuPermissionsManager = () => {
  const { users, fetchUsers, saveUserPermissions } = usePermissionsManager();
  const [selectedRole, setSelectedRole] = useState('avocat');
  const [rolePermissions, setRolePermissions] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Charger les permissions par défaut du rôle sélectionné
    const defaultPerms = defaultPermissionsByRole[selectedRole] || {};
    setRolePermissions(defaultPerms);
    setHasChanges(false);
  }, [selectedRole]);

  const handleToggleModule = (moduleId) => {
    setRolePermissions(prev => {
      const newPerms = structuredClone(prev);
      if (!newPerms[moduleId]) {
        newPerms[moduleId] = { visible: false, actions: {} };
      }
      newPerms[moduleId].visible = !newPerms[moduleId].visible;
      
      // Si on cache le module, désactiver toutes les actions
      if (!newPerms[moduleId].visible && newPerms[moduleId].actions) {
        Object.keys(newPerms[moduleId].actions).forEach(actionKey => {
          newPerms[moduleId].actions[actionKey] = false;
        });
      }
      
      return newPerms;
    });
    setHasChanges(true);
  };

  const handleSavePermissions = async () => {
    try {
      // Trouver tous les utilisateurs avec le rôle sélectionné
      const usersWithRole = users.filter(u => u.role === selectedRole);
      
      if (usersWithRole.length === 0) {
        toast({
          title: "⚠️ Aucun utilisateur",
          description: `Aucun utilisateur n'a le rôle "${roles.find(r => r.id === selectedRole)?.label}".`
        });
        return;
      }

      // Appliquer les permissions à tous les utilisateurs du rôle
      let successCount = 0;
      for (const user of usersWithRole) {
        const result = await saveUserPermissions(user.id, rolePermissions);
        if (result.success) successCount++;
      }

      if (successCount === usersWithRole.length) {
        toast({
          title: "✅ Permissions appliquées",
          description: `${successCount} utilisateur(s) mis à jour avec succès.`
        });
        setHasChanges(false);
      } else {
        toast({
          variant: "destructive",
          title: "⚠️ Application partielle",
          description: `${successCount}/${usersWithRole.length} utilisateurs mis à jour.`
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions."
      });
    }
  };

  const selectedRoleInfo = roles.find(r => r.id === selectedRole);
  const visibleCount = Object.values(rolePermissions).filter(p => p.visible).length;

  return (
    <div className="space-y-6">
      {/* En-tête avec info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-white mb-1">Gestion des permissions par rôle</p>
            <p>Configurez les modules du menu visibles pour chaque rôle. Les modifications s'appliquent à tous les utilisateurs du rôle sélectionné.</p>
          </div>
        </div>
      </div>

      {/* Sélection du rôle */}
      <div>
        <Label className="text-slate-300 mb-3 block">Sélectionner un rôle</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {roles.map(role => {
            const usersCount = users.filter(u => u.role === role.id).length;
            const isSelected = selectedRole === role.id;
            
            return (
              <motion.button
                key={role.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `border-${role.color}-500 bg-${role.color}-500/20`
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
              >
                <p className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {role.label}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {usersCount} utilisateur{usersCount !== 1 ? 's' : ''}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Configuration des modules */}
      <div className="border-t border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-lg">
              Modules du menu pour "{selectedRoleInfo?.label}"
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {visibleCount}/{menuModules.length} modules visibles
            </p>
          </div>
          
          {hasChanges && (
            <Button 
              onClick={handleSavePermissions}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          )}
        </div>

        <div className="grid gap-3">
          {menuModules.map(module => {
            const isVisible = rolePermissions[module.id]?.visible || false;
            
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border transition-all ${
                  isVisible
                    ? 'bg-slate-700/50 border-slate-600'
                    : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isVisible ? (
                      <Eye className="w-5 h-5 text-green-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-slate-500" />
                    )}
                    <Label className="text-white font-medium cursor-pointer">
                      {module.label}
                    </Label>
                  </div>
                  
                  <Checkbox
                    checked={isVisible}
                    onCheckedChange={() => handleToggleModule(module.id)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Avertissement si modifications non sauvegardées */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-slate-300">
              Vous avez des modifications non sauvegardées. Cliquez sur <strong>Sauvegarder</strong> pour les appliquer.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MenuPermissionsManager;

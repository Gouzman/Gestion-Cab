import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Save, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { usePermissionsManager } from '@/lib/permissionsUtils';

const UserCreator = ({ onClose }) => {
  const { createUser } = usePermissionsManager();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user',
    function: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await createUser(formData);
    
    if (result.success) {
      // Réinitialiser le formulaire
      setFormData({
        email: '',
        name: '',
        role: 'user',
        function: ''
      });
      
      // Fermer le formulaire après succès
      if (onClose) {
        setTimeout(onClose, 1500);
      }
    }
    
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-semibold text-white">Créer un nouvel utilisateur</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="user-email" className="text-slate-300 mb-2 block">
              Adresse email *
            </Label>
            <input
              id="user-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="utilisateur@cabinet.com"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <Label htmlFor="user-name" className="text-slate-300 mb-2 block">
              Nom complet *
            </Label>
            <input
              id="user-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nom Prénom"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="user-role-select" className="text-slate-300 mb-2 block">
              Rôle *
            </Label>
            <select
              id="user-role-select"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="user">Utilisateur</option>
              <option value="secretaire">Secrétaire</option>
              <option value="avocat">Avocat</option>
              <option value="gerant">Gérant</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div>
            <Label htmlFor="user-function-input" className="text-slate-300 mb-2 block">
              Fonction
            </Label>
            <input
              id="user-function-input"
              type="text"
              value={formData.function}
              onChange={(e) => handleInputChange('function', e.target.value)}
              placeholder="Ex: Avocat principal, Assistant juridique..."
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-600/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Informations importantes</span>
          </div>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• L'utilisateur devra définir son mot de passe lors de sa première connexion</li>
            <li>• Les permissions par défaut seront appliquées selon le rôle choisi</li>
            <li>• Vous pourrez modifier les permissions individuellement après création</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          {onClose && (
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-600 hover:bg-slate-700"
            >
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || !formData.email || !formData.name}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Création...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Créer l'utilisateur
              </div>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserCreator;
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Save, Users, Shield, Copy, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { usePermissionsManager } from '@/lib/permissionsUtils';
import { useToast } from '@/components/ui/use-toast';

const UserCreator = ({ onClose }) => {
  const { createUser } = usePermissionsManager();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user',
    function: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createdUserName, setCreatedUserName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast({
      title: "✅ Mot de passe copié",
      description: "Le mot de passe a été copié dans le presse-papier"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setGeneratedPassword('');
    setCreatedUserName('');
    setCopied(false);
    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await createUser(formData);
    
    if (result.success) {
      // Afficher le mot de passe dans une modal
      setGeneratedPassword(result.initialPassword);
      setCreatedUserName(formData.name);
      setShowPasswordModal(true);
      
      // Réinitialiser le formulaire
      setFormData({
        email: '',
        name: '',
        role: 'user',
        function: ''
      });
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
              Titre / Fonction
            </Label>
            <select
              id="user-function-input"
              value={formData.function}
              onChange={(e) => handleInputChange('function', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            >
              <option value="">Sélectionner un titre</option>
              <option value="Avocat associé">Avocat associé</option>
              <option value="Avocate associée">Avocate associée</option>
              <option value="Avocat collaborateur">Avocat collaborateur</option>
              <option value="Juriste manager">Juriste manager</option>
              <option value="Juriste sénior">Juriste sénior</option>
              <option value="Juriste senior">Juriste senior</option>
              <option value="Juriste sénior">Juriste sénior</option>
              <option value="Juriste junior">Juriste junior</option>
              <option value="Assistant juridique">Assistant juridique</option>
              <option value="Gestionnaire comptable">Gestionnaire comptable</option>
              <option value="Secrétaire de direction">Secrétaire de direction</option>
              <option value="Secrétaire de Direction">Secrétaire de Direction</option>
              <option value="Stagiaire">Stagiaire</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">Position hiérarchique et rôle au cabinet</p>
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

      {/* Modal avec le mot de passe généré */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleClosePasswordModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border-2 border-green-500/50 rounded-xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Utilisateur créé !</h3>
                    <p className="text-sm text-slate-400">{createdUserName}</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePasswordModal}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-400 mb-3">
                  Mot de passe initial (à communiquer à l'utilisateur) :
                </p>
                <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-500">
                  <code className="text-lg font-mono text-green-400 flex-1 break-all">
                    {generatedPassword}
                  </code>
                  <Button
                    onClick={handleCopyPassword}
                    className={`flex-shrink-0 ${
                      copied 
                        ? 'bg-green-600 hover:bg-green-600' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copier
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-200">
                  ⚠️ <strong>Important :</strong> L'utilisateur devra changer ce mot de passe lors de sa première connexion.
                </p>
              </div>

              <Button
                onClick={handleClosePasswordModal}
                className="w-full bg-slate-600 hover:bg-slate-700"
              >
                Fermer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserCreator;
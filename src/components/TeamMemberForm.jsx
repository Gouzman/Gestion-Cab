import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { X, User, Mail, ShieldCheck, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TeamMemberForm = ({ member, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    function: '',
    email: '',
    role: 'Assistant(e)',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        function: member.function || '',
        email: member.email || '',
        role: member.role || 'Assistant(e)',
      });
    }
  }, [member]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {member ? 'Modifier le Collaborateur' : 'Nouveau Collaborateur'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nom et Prénoms *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ex: Marie Dupont"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Titre / Fonction
            </label>
            <select
              name="function"
              value={formData.function}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
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

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Courriel *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="marie.dupont@cabinet.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <ShieldCheck className="w-4 h-4 inline mr-2" />
              Rôle *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            >
              <option value="">Sélectionner un rôle</option>
              <option value="Administrateur">Administrateur</option>
              <option value="Gérant">Gérant</option>
              <option value="Collaborateur">Collaborateur</option>
              <option value="Assistant(e)">Assistant(e)</option>
              <option value="Consultant">Consultant</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">Niveau d'accès dans l'application</p>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            >
              {member ? 'Mettre à jour' : 'Ajouter le collaborateur'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Annuler
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

TeamMemberForm.propTypes = {
  member: PropTypes.shape({
    name: PropTypes.string,
    function: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default TeamMemberForm;
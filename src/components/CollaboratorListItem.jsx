import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, ShieldCheck, Briefcase, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CollaboratorListItem = ({ member, index, onEdit, onDelete, isCurrentUser }) => {
  if (!member) {
    return null;
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Déterminer la couleur du badge de rôle
  const getRoleBadgeColor = (role) => {
    const roleColors = {
      'admin': 'bg-red-500/20 text-red-400',
      'manager': 'bg-purple-500/20 text-purple-400',
      'lawyer': 'bg-blue-500/20 text-blue-400',
      'assistant': 'bg-green-500/20 text-green-400',
      'default': 'bg-slate-500/20 text-slate-400'
    };
    return roleColors[role?.toLowerCase()] || roleColors['default'];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all duration-200"
    >
      {/* Mobile layout */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">{member.name || 'N/A'}</h3>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(member.role)}`}>
                <ShieldCheck className="w-3 h-3" />
                <span>{member.role || 'Non spécifié'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(member)}
              className="w-8 h-8 text-slate-400 hover:text-white"
            >
              <Edit className="w-4 h-4" />
            </Button>
            {!isCurrentUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(member.id)}
                className="w-8 h-8 text-slate-400 hover:text-[#6D071A]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2 pl-13">
          {member.function && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">{member.function}</span>
              <span className="text-xs text-slate-500">(Titre/Fonction)</span>
            </div>
          )}
          {member.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 truncate">{member.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">{formatDate(member.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Desktop layout - 4 columns */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4 items-center">
        {/* Column 1: Nom et Prénoms */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-medium">{member.name || 'N/A'}</div>
          </div>
        </div>

        {/* Column 2: Titre / Fonction */}
        <div>
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">{member.function || 'Non spécifié'}</span>
          </div>
        </div>

        {/* Column 3: Courriel */}
        <div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 truncate">{member.email || 'N/A'}</span>
          </div>
        </div>

        {/* Column 4: Rôle & Actions */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
            <ShieldCheck className="w-3 h-3" />
            <span>{member.role || 'Non spécifié'}</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(member)}
              className="w-8 h-8 text-slate-400 hover:text-white"
            >
              <Edit className="w-4 h-4" />
            </Button>
            {!isCurrentUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(member.id)}
                className="w-8 h-8 text-slate-400 hover:text-[#6D071A]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CollaboratorListItem;

import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit, Trash2, Building, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getClientDisplayName } from '../lib/clientUtils';

const ClientListItem = ({ client, index, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    return type === 'company' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getTypeLabel = (type) => {
    return type === 'company' ? 'Entreprise' : 'Particulier';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 hover:border-slate-600/50 transition-all duration-200"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-start">
        
        {/* Colonne Nom & Type */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-blue-400">
              {getTypeIcon(client.type)}
            </div>
            <h4 className="text-lg font-semibold text-white line-clamp-1">
              {getClientDisplayName(client)}
            </h4>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30">
              {getTypeLabel(client.type)}
            </div>
            {client.clientCode && (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                N° {client.clientCode}
              </div>
            )}
            {client.is_conventionne && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-600/20 text-green-300 border border-green-500/30">
                <FileCheck className="w-3 h-3" />
                Conventionné
              </div>
            )}
          </div>
        </div>

        {/* Colonne Email */}
        <div className="lg:col-span-1">
          {client.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm truncate">
                {client.email}
              </span>
            </div>
          )}
        </div>

        {/* Colonne Téléphone */}
        <div className="lg:col-span-1">
          {client.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm">
                {client.phone}
              </span>
            </div>
          )}
        </div>

        {/* Colonne Ville */}
        <div className="lg:col-span-1">
          {client.city && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm truncate">
                {client.postalCode && `${client.postalCode} `}
                {client.city}
              </span>
            </div>
          )}
        </div>

        {/* Colonne Date & Actions */}
        <div className="lg:col-span-1 flex flex-col lg:items-end gap-3">
          {/* Date de création */}
          <div className="text-xs text-slate-400">
            Ajouté le {formatDate(client.createdAt)}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(client)}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(client.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Section détails additionnels si notes présentes */}
      {client.notes && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-sm text-slate-400 italic">
            {client.notes}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ClientListItem;

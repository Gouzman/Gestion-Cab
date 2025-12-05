import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getClientDisplayName } from '@/lib/clientUtils';
import InstanceManager from '@/components/InstanceManager';

const CaseListItem = ({ case: caseData, clients = [], index, onEdit, onDelete }) => {
  const [showInstanceManager, setShowInstanceManager] = useState(false);
  
  // Trouver le client associé
  const client = clients.find(c => c.id === caseData.client_id);
  const clientName = client ? getClientDisplayName(client) : 'Non assigné';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en-cours':
        return { label: 'Actif', color: 'bg-blue-500 text-white' };
      case 'juge-acheve':
        return { label: 'Clôturé', color: 'bg-green-500 text-white' };
      case 'cloture':
        return { label: 'Clôturé', color: 'bg-green-500 text-white' };
      case 'archive':
        return { label: 'En attente', color: 'bg-yellow-500 text-white' };
      default:
        return { label: 'Actif', color: 'bg-blue-500 text-white' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return { label: 'PRIORITÉ HAUTE', color: 'text-red-500' };
      case 'high':
        return { label: 'PRIORITÉ HAUTE', color: 'text-red-500' };
      case 'medium':
        return { label: 'PRIORITÉ MOYENNE', color: 'text-yellow-500' };
      case 'low':
        return { label: 'PRIORITÉ BASSE', color: 'text-green-500' };
      default:
        return { label: 'PRIORITÉ MOYENNE', color: 'text-yellow-500' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const statusBadge = getStatusBadge(caseData.status);
  const priorityBadge = getPriorityBadge(caseData.priority);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 hover:border-slate-600/50 transition-all duration-200"
    >
      {/* Header: Titre + Badge Statut + Badge Priorité */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{caseData.title || 'N/A'}</h3>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${statusBadge.color}`}>
            <FileText className="w-3 h-3" />
            {statusBadge.label}
          </span>
        </div>
        <span className={`text-xs font-bold ${priorityBadge.color}`}>
          {priorityBadge.label}
        </span>
      </div>

      {/* ID du dossier et Réf dossier */}
      <div className="mb-4">
        <p className="text-sm text-slate-300">
          <span className="font-medium text-slate-400">ID du dossier:</span> {caseData.code_dossier || 'Non défini'} 
          <span className="mx-3">•</span>
          <span className="font-medium text-slate-400">Réf dossier:</span> {caseData.ref_dossier || 'Non défini'}
        </p>
      </div>

      {/* Grille d'informations: 4 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Type de dossier */}
        <div>
          <p className="text-xs text-slate-400 mb-1">Type de dossier</p>
          <p className="text-sm text-slate-200 font-medium">{caseData.case_type || 'Non défini'}</p>
        </div>

        {/* Client */}
        <div>
          <p className="text-xs text-slate-400 mb-1">Client</p>
          <p className="text-sm text-slate-200 font-medium">{clientName}</p>
        </div>

        {/* Assigné à */}
        <div>
          <p className="text-xs text-slate-400 mb-1">Assigné à</p>
          <p className="text-sm text-slate-200 font-medium">{caseData.assigned_to || 'Non assigné'}</p>
        </div>

        {/* Date de début */}
        <div>
          <p className="text-xs text-slate-400 mb-1">Date de début</p>
          <p className="text-sm text-slate-200 font-medium">{formatDate(caseData.created_at)}</p>
        </div>
      </div>

      {/* Footer: Documents + Prochaine audience + Bouton */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{caseData.attachments?.length || 0} documents</span>
          </div>
          {caseData.next_hearing && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Prochaine audience: {formatDate(caseData.next_hearing)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowInstanceManager(true)}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            <Scale className="w-4 h-4 mr-2" />
            Instances
          </Button>
          <Button
            onClick={() => onEdit(caseData)}
            className="bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600 px-4 py-2 rounded-md text-sm font-medium"
          >
            Voir détails
          </Button>
        </div>
      </div>

      {/* Modal InstanceManager */}
      {showInstanceManager && (
        <InstanceManager
          caseId={caseData.id}
          onClose={() => setShowInstanceManager(false)}
        />
      )}
    </motion.div>
  );
};

CaseListItem.propTypes = {
  case: PropTypes.shape({
    id: PropTypes.string,
    client_id: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    title: PropTypes.string,
    code_dossier: PropTypes.string,
    ref_dossier: PropTypes.string,
    case_type: PropTypes.string,
    assigned_to: PropTypes.string,
    created_at: PropTypes.string,
    attachments: PropTypes.array,
    next_hearing: PropTypes.string
  }).isRequired,
  clients: PropTypes.array,
  index: PropTypes.number.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default CaseListItem;

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  User, 
  Edit, 
  Trash2,
  Scale,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CaseListItem = ({ case: caseData, index, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-orange-500/20 text-orange-400';
      case 'closed':
        return 'bg-blue-500/20 text-blue-400';
      case 'archive':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Scale className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Actif',
      'pending': 'En attente',
      'closed': 'Clôturé',
      'archive': 'Archivé'
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400';
      case 'high':
        return 'bg-orange-500/20 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'urgent': 'Urgent',
      'high': 'Élevée',
      'medium': 'Moyenne',
      'low': 'Basse'
    };
    return labels[priority] || priority;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">{caseData.title || 'N/A'}</h3>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(caseData)}
              className="w-8 h-8 text-slate-400 hover:text-white"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(caseData.id)}
              className="w-8 h-8 text-slate-400 hover:text-[#6D071A]"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 pl-13">
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseData.status)}`}>
              {getStatusIcon(caseData.status)}
              <span>{getStatusLabel(caseData.status)}</span>
            </div>
            {caseData.priority && (
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(caseData.priority)}`}>
                {getPriorityIcon(caseData.priority)}
                <span>{getPriorityLabel(caseData.priority)}</span>
              </div>
            )}
          </div>
          {caseData.assigned_to && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">{caseData.assigned_to}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">{formatDate(caseData.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Desktop layout - 5 columns */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4 items-center">
        {/* Column 1: Titre & Type */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-medium truncate">{caseData.title || 'N/A'}</div>
          </div>
        </div>

        {/* Column 2: Statut */}
        <div>
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseData.status)}`}>
            {getStatusIcon(caseData.status)}
            <span>{getStatusLabel(caseData.status)}</span>
          </div>
        </div>

        {/* Column 3: Priorité */}
        <div>
          {caseData.priority ? (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseData.priority)}`}>
              {getPriorityIcon(caseData.priority)}
              <span>{getPriorityLabel(caseData.priority)}</span>
            </div>
          ) : (
            <span className="text-slate-500 text-sm">-</span>
          )}
        </div>

        {/* Column 4: Assigné à */}
        <div>
          {caseData.assigned_to ? (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 truncate">{caseData.assigned_to}</span>
            </div>
          ) : (
            <span className="text-slate-500 text-sm">Non assigné</span>
          )}
        </div>

        {/* Column 5: Date & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(caseData.created_at)}</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(caseData)}
              className="w-8 h-8 text-slate-400 hover:text-white"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(caseData.id)}
              className="w-8 h-8 text-slate-400 hover:text-[#6D071A]"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CaseListItem;

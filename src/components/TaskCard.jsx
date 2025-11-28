import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  FileText, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Play,
  Paperclip,
  MessageSquare,
  Download,
  Eye,
  RefreshCw,
  Printer,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { ensureAttachmentsBucket } from '@/lib/uploadManager';

// Fonction utilitaire pour nettoyer les noms de fichiers lors du téléchargement
// Supprime les parenthèses fermantes finales et les extensions parasites
function cleanFileNameForDownload(fileName) {
  if (!fileName) return 'file';
  
  // Retirer la parenthèse fermante finale si présente
  let cleaned = fileName.trim();
  if (cleaned.endsWith(')')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  
  // Extraire la vraie extension (après le dernier point)
  const lastDotIndex = cleaned.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return cleaned;
  }
  
  const trueExtension = cleaned.substring(lastDotIndex + 1).toLowerCase();
  let baseName = cleaned.substring(0, lastDotIndex);
  
  // Supprimer toutes les extensions parasites du nom de base
  const parasiteExtensions = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 
                              'txt', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'zip', 
                              'rar', 'csv', 'json', 'xml', 'html', 'htm'];
  
  let previousBaseName = '';
  while (baseName !== previousBaseName) {
    previousBaseName = baseName;
    for (const ext of parasiteExtensions) {
      const pattern = new RegExp(`\\.${ext}$`, 'i');
      if (pattern.test(baseName)) {
        baseName = baseName.substring(0, baseName.lastIndexOf('.'));
        break;
      }
    }
  }
  
  if (!baseName || baseName.trim() === '') {
    return `file.${trueExtension}`;
  }
  
  return `${baseName}.${trueExtension}`;
}

const TaskCard = ({ task, index, onEdit, onDelete, onStatusChange, currentUser }) => {
  // Marquer automatiquement la tâche comme "Vue" si l'assigné la consulte
  const viewTask = async (taskId) => {
    // Vérifier si l'utilisateur actuel est l'assigné de la tâche
    const isAssignedToCurrentUser = task.assigned_to_id === currentUser.id;
    
    // Seulement marquer comme vue si :
    // 1. L'utilisateur est l'assigné
    // 2. La tâche est en statut "pending"
    // 3. Il n'y a pas encore de seen_at timestamp
    if (isAssignedToCurrentUser && task.status === 'pending' && !task.seen_at) {
      try {
        // Appel API silencieux pour mettre à jour le statut à "seen"
        const { error } = await supabase
          .from('tasks')
          .update({ 
            status: 'seen',
            seen_at: new Date().toISOString()
          })
          .eq('id', taskId);
        
        if (!error && onStatusChange) {
          // Mettre à jour l'état React de manière silencieuse
          onStatusChange(taskId, 'seen', true); // Le 3e paramètre indique que c'est une mise à jour silencieuse
        }
      } catch (error) {
        // Erreur silencieuse - ne pas perturber l'expérience utilisateur
        console.error('Erreur lors de la mise à jour du statut de vue:', error);
      }
    }
  };

  // Appeler viewTask automatiquement quand la carte est montée/affichée
  React.useEffect(() => {
    viewTask(task.id);
  }, [task.id, task.status, task.seen_at]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-green-500 bg-green-500/10';
      default: return 'border-slate-600 bg-slate-800/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'seen': return <Eye className="w-4 h-4 text-purple-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in-progress': return 'bg-blue-500/20 text-blue-400';
      case 'seen': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-orange-500/20 text-orange-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in-progress': return 'En cours';
      case 'seen': return 'Vue';
      default: return 'En attente';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (deadline) => deadline ? new Date(deadline) < new Date() && task.status !== 'completed' : false;

  const nextStatus = { 'pending': 'seen', 'seen': 'in-progress', 'in-progress': 'completed', 'completed': 'pending' };
  const statusLabels = { 'pending': 'Marquer comme vu', 'seen': 'Commencer', 'in-progress': 'Terminer', 'completed': 'Réouvrir' };
  const statusIcons = { 'pending': <Eye className="w-4 h-4" />, 'seen': <Play className="w-4 h-4" />, 'in-progress': <CheckCircle className="w-4 h-4" />, 'completed': <AlertTriangle className="w-4 h-4" /> };

  const handleDownload = async (filePath) => {
    // Vérifier/créer le bucket avant le téléchargement
    const bucketReady = await ensureAttachmentsBucket();
    if (!bucketReady) {
      return;
    }

    console.log('🔽 Téléchargement depuis TaskCard:', filePath);

    const { data, error } = await supabase.storage.from('attachments').download(filePath);
    if (error) {
      console.error('❌ Erreur Supabase:', error);
      toast({ variant: "destructive", title: "Erreur de téléchargement", description: error.message });
      return;
    }

    // Vérifier que le blob n'est pas vide
    if (!data || data.size === 0) {
      console.error('❌ Blob vide reçu de Supabase');
      toast({ variant: "destructive", title: "Erreur", description: "Le fichier téléchargé est vide" });
      return;
    }

    console.log('✅ Blob reçu:', {
      size: data.size,
      type: data.type,
      path: filePath
    });

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    // Nettoyer le nom du fichier lors du téléchargement
    const originalFileName = filePath.split('/').pop();
    const cleanedName = cleanFileNameForDownload(originalFileName);
    a.download = cleanedName;
    
    console.log(`📥 Téléchargement: "${originalFileName}" → "${cleanedName}"`);
    
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = async (filePath) => {
    // Vérifier/créer le bucket avant d'obtenir l'URL publique
    const bucketReady = await ensureAttachmentsBucket();
    if (!bucketReady) {
      return;
    }

    const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
    if (data.publicUrl) {
      const printWindow = window.open(data.publicUrl, '_blank');
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'imprimer le fichier." });
    }
  };

  const isAssignedToCurrentUser = task.assigned_to_id === currentUser.id;
  const isGerantOrAdmin = currentUser.function === 'Gerant' || currentUser.function === 'Associe Emerite' || currentUser.role === 'admin';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`${getPriorityColor(task.priority)} backdrop-blur-sm border rounded-xl p-6 hover:scale-105 transition-all duration-200 flex flex-col`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(task.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{getStatusLabel(task.status)}</span>
        </div>
        <div className="flex items-center gap-1">
          {isAssignedToCurrentUser && task.status !== 'completed' && (
            <Button variant="ghost" size="icon" onClick={() => onStatusChange(task.id, nextStatus[task.status])} className="w-8 h-8 text-slate-400 hover:text-white" title={statusLabels[task.status]}>{statusIcons[task.status]}</Button>
          )}
          {(isAssignedToCurrentUser || isGerantOrAdmin) && <Button variant="ghost" size="icon" onClick={() => onEdit(task)} className="w-8 h-8 text-slate-400 hover:text-white" title="Modifier/Réassigner"><RefreshCw className="w-4 h-4" /></Button>}
          {onDelete && <Button variant="ghost" size="icon" onClick={() => {
            if (window.confirm(`Voulez-vous vraiment supprimer la tâche "${task.title}" ?\n\nCette action est irréversible.`)) {
              onDelete(task.id);
            }
          }} className="w-8 h-8 text-slate-400 hover:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></Button>}
        </div>
      </div>
      <div className="mb-4 flex-grow">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{task.title}</h3>
        {task.description && <p className="text-slate-400 text-sm line-clamp-3">{task.description}</p>}
      </div>
      {task.completion_comment && (
        <div className="mb-4 p-3 bg-green-900/50 rounded-lg border border-green-700/50">
          <div className="flex items-center gap-2 mb-1"><MessageSquare className="w-4 h-4 text-green-400" /><p className="text-sm font-semibold text-green-300">Commentaire de clôture</p></div>
          <p className="text-xs text-slate-300 italic">"{task.completion_comment}"</p>
        </div>
      )}
      <div className="space-y-3 mb-4">
        {task.deadline && <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-slate-400" /><span className={`${isOverdue(task.deadline) ? 'text-red-400' : 'text-slate-300'}`}>{formatDate(task.deadline)}{isOverdue(task.deadline) && ' (En retard)'}</span></div>}
        {/* Pour l'assigné, on affiche qui lui a donné la tâche (created_by_name), pas son propre nom */}
        {isAssignedToCurrentUser && task.created_by_name && (
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">Assignée par: {task.created_by_name}</span>
          </div>
        )}
        {/* Pour les autres (gérants/admins), on affiche à qui la tâche est assignée */}
        {!isAssignedToCurrentUser && task.assigned_to_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">Assignée à: {task.assigned_to_name}</span>
          </div>
        )}
        {task.assigned_at && <div className="flex items-center gap-2 text-xs"><Clock className="w-3 h-3 text-slate-500" /><span className="text-slate-400">Assignée le: {formatDate(task.assigned_at)}</span></div>}
        {task.seen_at && <div className="flex items-center gap-2 text-xs"><Eye className="w-3 h-3 text-purple-400" /><span className="text-purple-300">Vue le: {formatDate(task.seen_at)}</span></div>}
        {task.case_id && <div className="flex items-center gap-2 text-sm"><FileText className="w-4 h-4 text-slate-400" /><span className="text-slate-300">Dossier: {task.case_id}</span></div>}
        {task.attachments && task.attachments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm mb-2"><Paperclip className="w-4 h-4 text-slate-400" /><span className="text-slate-300">Pièces jointes</span></div>
            <div className="flex flex-col gap-1">
              {task.attachments.map((path) => (
                <div key={path} className="flex items-center justify-between text-xs text-slate-400 bg-slate-700/30 p-1.5 rounded-md">
                  <div className="flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    <span>{path.split('/').pop()}</span>
                  </div>
                  <button
                    className="text-blue-400 hover:text-blue-300 p-0.5 rounded hover:bg-slate-600/30 transition-colors"
                    onClick={() => handleDownload(path)}
                    title="Télécharger la pièce jointe"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-400' : task.priority === 'high' ? 'bg-orange-400' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
          <span className="text-xs text-slate-400 capitalize">{task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Élevée' : task.priority === 'medium' ? 'Moyenne' : 'Faible'}</span>
        </div>
      </div>
    </motion.div>
  );
};

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    deadline: PropTypes.string,
    assigned_to_id: PropTypes.string,
    assigned_to_name: PropTypes.string,
    created_by_name: PropTypes.string,
    assigned_at: PropTypes.string,
    seen_at: PropTypes.string,
    case_id: PropTypes.string,
    completion_comment: PropTypes.string,
    attachments: PropTypes.array
  }).isRequired,
  index: PropTypes.number.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onStatusChange: PropTypes.func,
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    function: PropTypes.string,
    role: PropTypes.string
  }).isRequired
};

export default TaskCard;
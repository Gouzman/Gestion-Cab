import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Search, Calendar, CheckCircle, Clock, Eye, ListTodo, FilePlus, User, FileText, Trash2, Play, Paperclip, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import TaskForm from '@/components/TaskForm';
import { supabase } from '@/lib/customSupabaseClient';
import { getTaskFiles } from '@/api/taskFiles';
import { downloadFile, hasLocalBackup } from '@/lib/filePreviewUtils';
import ConfirmationModal from '@/components/ConfirmationModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TaskManager = ({ currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('suivi');
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [teamMembers, setTeamMembers] = useState([]);
  const [cases, setCases] = useState([]);
  const [taskToComment, setTaskToComment] = useState(null);
  const [completionComment, setCompletionComment] = useState('');
  const [taskFiles, setTaskFiles] = useState({});
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  const isGerantOrAssocie = currentUser && (currentUser.function === 'Gerant' || currentUser.function === 'Associe Emerite');
  const isAdmin = isGerantOrAssocie || (currentUser.role && currentUser.role.toLowerCase() === 'admin');

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
    if (isAdmin) {
      fetchCases();
    }

    // Exposer la fonction de rafraîchissement des fichiers globalement
    globalThis.refreshTaskFiles = async (taskId) => {
      try {
        const files = await getTaskFiles(taskId);
        setTaskFiles(prev => ({
          ...prev,
          [taskId]: files
        }));
      } catch (error) {
        console.error("Erreur rafraîchissement fichiers:", error);
      }
    };

    // Nettoyer à la décomposition du composant
    return () => {
      delete globalThis.refreshTaskFiles;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Fonction utilitaire pour vérifier si une tâche a des documents liés
  const hasAttachedDocuments = (task) => {
    const attachmentsArray = Array.isArray(task.attachments)
      ? task.attachments
      : task.attachments ? JSON.parse(task.attachments || "[]") : [];
    
    // Vérifier aussi si on a déjà chargé des fichiers et qu'il y en a
    const hasLoadedFiles = taskFiles[task.id] && taskFiles[task.id].length > 0;
    
    return attachmentsArray.length > 0 || hasLoadedFiles;
  };

  // Fonction utilitaire pour obtenir la liste des documents liés
  const getAttachedDocuments = (task) => {
    const attachmentsArray = Array.isArray(task.attachments)
      ? task.attachments
      : task.attachments ? JSON.parse(task.attachments || "[]") : [];
    return attachmentsArray;
  };

  // Fonction pour récupérer les fichiers avec validation des URLs
  const fetchTaskFiles = async (taskId, taskAttachments = null) => {
    try {
      const files = await getTaskFiles(taskId, taskAttachments);
      return files;
    } catch (error) {
      return [];
    }
  };

  const fetchTasks = async () => {
    // Sélectionner explicitement les colonnes existantes pour éviter les erreurs avec colonnes manquantes
    const selectColumns = 'id,title,description,priority,status,deadline,assigned_to_id,assigned_to_name,case_id,attachments,created_at,updated_at,created_by_id,created_by_name,assigned_at';
    let query = supabase.from('tasks').select(selectColumns);
    if (!isAdmin && currentUser?.id) {
      query = query.eq('assigned_to_id', currentUser.id);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les tâches." });
    } else {
      setTasks(data);
      
      // Charger les fichiers complets pour chaque tâche en une seule requête
      try {
        const taskIds = data.map(t => t.id);
        const { data: allFiles } = await supabase
          .from('tasks_files')
          .select('*')
          .in('task_id', taskIds)
          .order('created_at', { ascending: false });
        
        if (allFiles && allFiles.length > 0) {
          // Grouper les fichiers par task_id avec toutes les données
          const filesByTask = {};
          allFiles.forEach(file => {
            if (!filesByTask[file.task_id]) {
              filesByTask[file.task_id] = [];
            }
            filesByTask[file.task_id].push({
              ...file,
              source: 'tasks_files',
              is_accessible: true,
              valid_url: file.file_url
            });
          });
          
          setTaskFiles(prev => ({ ...prev, ...filesByTask }));
        }
      } catch (error) {
        // Ignorer silencieusement si la table n'existe pas
        console.debug('tasks_files non disponible');
      }
    }
  };



  const fetchTeamMembers = async () => {
    const { data, error } = await supabase.from('profiles').select('id, name, role');
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les collaborateurs." });
    } else {
      // Filtrer pour exclure les comptes admin
      const filteredData = (data || []).filter(member => member.role !== 'admin');
      setTeamMembers(filteredData);
    }
  };

  const fetchCases = async () => {
    const { data, error } = await supabase.from('cases').select('id, title');
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les dossiers." });
    } else {
      setCases(data);
    }
  };



  const handleFileUpload = async (file, taskId) => {
    try {
      // Utiliser la nouvelle fonction d'upload améliorée
      const { uploadTaskFile } = await import('@/lib/uploadManager');
      
      const result = await uploadTaskFile(file, taskId, currentUser?.id);
      
      if (result.success) {
        toast({ 
          title: "✅ Fichier uploadé", 
          description: `"${file.name}" a été téléchargé et est maintenant accessible.` 
        });
        
        // Actualiser la liste des fichiers pour cette tâche
        if (taskFiles[taskId]) {
          setTaskFiles(prev => ({
            ...prev,
            [taskId]: [result.data, ...(prev[taskId] || [])]
          }));
        }
        
        return result.data.file_url;
      } else {
        toast({ 
          title: "⚠️ Erreur d'upload", 
          description: `Impossible d'uploader "${file.name}": ${result.error}` 
        });
        return null;
      }
    } catch (error) {
      console.error("Erreur lors de l'upload :", error);
      toast({ 
        title: "❌ Erreur système", 
        description: `Échec de l'upload de "${file.name}". Vérifiez votre connexion.` 
      });
      return null;
    }
  };

  const handleScanUpload = async (file, taskId) => {
    try {
      // Vérifier d'abord si le bucket existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      const scansBucketExists = buckets?.some(bucket => bucket.name === 'task-scans');
      
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `scan_${timestamp}_${sanitizedFileName}`;
      
      if (!scansBucketExists) {
        // Bucket n'existe pas, enregistrer uniquement les métadonnées
        const virtualPath = `pending_scan/${currentUser.id}/${taskId}/${fileName}`;
        const virtualFileRecord = { 
          file_url: virtualPath, 
          file_name: fileName,
          file_size: file.size,
          file_type: file.type,
          status: 'pending_upload'
        };
        
        // Stockage scans en attente de configuration - message utilisateur via toast uniquement
        
        toast({ 
          title: "📷 Scan enregistré", 
          description: `"${file.name}" sera uploadé une fois le système configuré. Métadonnées sauvegardées.` 
        });
        
        return virtualFileRecord;
      }
      
      // Bucket existe, tenter l'upload
      const filePath = `${currentUser.id}/${taskId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('task-scans')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        toast({ 
          title: "⚠️ Erreur d'upload du scan", 
          description: `Impossible d'uploader le scan "${file.name}": ${uploadError.message}` 
        });
        return null;
      }

      // Générer l'URL publique du fichier scanné uploadé
      const { data: publicUrlData } = supabase.storage
        .from('task-scans')
        .getPublicUrl(filePath);
      
      const validUrl = publicUrlData?.publicUrl || filePath;

      // TEMPORAIRE : Désactiver l'enregistrement dans tasks_files jusqu'à création de la table
      // Pour réactiver : restaurer le code depuis git history
      console.log('Table tasks_files désactivée - fichier uploadé mais non enregistré dans BDD');
      toast({ 
        title: "✅ Scan uploadé", 
        description: `"${file.name}" uploadé (table tasks_files non créée)` 
      });
      return { file_url: validUrl, file_name: fileName };
      
    } catch (error) {
      // En cas d'erreur totale, créer quand même un enregistrement virtuel
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `scan_${timestamp}_${sanitizedFileName}`;
      const virtualPath = `pending_scan/${currentUser.id}/${taskId || 'new'}/${fileName}`;
      
      toast({ 
        title: "📷 Scan en attente", 
        description: `"${file.name}" sera traité une fois le système de scan disponible.` 
      });
      
      return { file_url: virtualPath, file_name: fileName, status: 'pending_upload' };
    }
  };

  const ensureTaskScansBucket = async () => {
    // Ne plus essayer de créer automatiquement les buckets pour éviter les erreurs RLS
    // Les buckets doivent être créés manuellement dans Supabase Dashboard
    return true;
  };

  const processTaskData = (taskData) => {
    const { filesToUpload, scannedFiles, ...data } = taskData;
    if (data.case_id === '') {
      data.case_id = null;
    }
    return { filesToUpload: filesToUpload || [], scannedFiles: scannedFiles || [], data };
  };

  const handleAddTask = async (taskData) => {
    const { filesToUpload, scannedFiles, data: dataToInsert } = processTaskData(taskData);
    const assignedMember = teamMembers.find(m => m.id === dataToInsert.assigned_to_id);
    
    // Supprimer les colonnes associated_tasks et main_category si elles n'existent pas dans le schéma
    const { associated_tasks, main_category, ...cleanDataToInsert } = dataToInsert;
    
    // Nettoyer le payload pour supprimer les champs qui n'existent pas dans le schéma Supabase
    const payload = { 
      ...cleanDataToInsert, 
      assigned_to_name: assignedMember ? assignedMember.name : null,
      assigned_at: cleanDataToInsert.assigned_to_id ? new Date().toISOString() : null,
      created_by_id: currentUser.id,
      created_by_name: currentUser.name
    };
    
    // Nettoyer les champs vides pour éviter les erreurs de validation
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) {
        payload[key] = null;
      }
    }
    
    // Supprimer les champs qui n'existent pas dans le schéma Supabase
    delete payload.attachments;
    
    const { data, error } = await supabase.from('tasks').insert([payload]).select('id,title,description,priority,status,deadline,assigned_to_id,assigned_to_name,case_id,created_at,updated_at,created_by_id,created_by_name,assigned_at').single();
    
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: `Impossible de créer la tâche: ${error.message}` });
      return;
    }

    // Uploader les fichiers normaux (pièces jointes) en arrière-plan pour
    // ne pas ralentir la création de la tâche. Les uploads gèreront eux-mêmes
    // l'insertion dans tasks_files une fois le Storage réussi.
    if (filesToUpload && filesToUpload.length > 0) {
      console.log(`📤 Démarrage en arrière-plan de l'upload de ${filesToUpload.length} fichier(s) pour la tâche ${data.id}...`);
      (async () => {
        try {
          const { uploadMultipleTaskFiles } = await import('@/lib/uploadManager');
          const uploadResult = await uploadMultipleTaskFiles(filesToUpload, data.id, currentUser?.id);
          console.log(`📊 Résultat upload (background): ${uploadResult.successes?.length || 0} succès, ${uploadResult.errors?.length || 0} erreurs`);

          if (uploadResult.success) {
            // Actualiser la liste des fichiers pour la tâche
            setTaskFiles(prev => ({
              ...prev,
              [data.id]: uploadResult.data
            }));
            // Ouvrir automatiquement la tâche si des fichiers viennent d'être ajoutés
            if (uploadResult.data && uploadResult.data.length > 0) {
              setExpandedTaskId(data.id);
            }
            toast({ title: '✅ Fichiers uploadés', description: `${uploadResult.data.length} fichier(s) ajoutés à la tâche.` });
          } else if (uploadResult.errors && uploadResult.errors.length > 0) {
            uploadResult.errors.forEach(err => console.error(`❌ Fichier "${err.fileName}" non enregistré — cause: ${err.error}`));
            const isBucketError = uploadResult.errors.some(e => e.error?.includes("bucket 'attachments'") || e.error?.includes("non configur"));
            if (isBucketError) {
              toast({ title: '⚠️ Stockage non configuré', description: "Le bucket 'attachments' doit être créé dans Supabase.", variant: 'destructive' });
            } else {
              toast({ title: '⚠️ Erreur upload', description: uploadResult.summary });
            }
            if (uploadResult.data && uploadResult.data.length > 0) {
              setTaskFiles(prev => ({ ...prev, [data.id]: uploadResult.data }));
            }
          }
        } catch (error) {
          console.error('❌ Erreur critique lors de l\'upload (background):', error);
          toast({ title: '❌ Erreur d\'upload', description: 'Échec de l\'upload des fichiers en arrière-plan.' , variant: 'destructive' });
        }
      })();
    }

    // Uploader les fichiers scannés dans la table dédiée
    // Lancer l'upload des scans en background aussi
    if (scannedFiles && scannedFiles.length > 0) {
      (async () => {
        try {
          const bucketReady = await ensureTaskScansBucket();
          if (!bucketReady) return;
          for (const file of scannedFiles) {
            const scannedFile = await handleScanUpload(file, data.id);
            if (scannedFile) {
              // Optionnel: stocker ou notifier selon besoin
              console.log('✅ Scan uploadé (background):', scannedFile.file_name || scannedFile.file_url);
            }
          }
        } catch (e) {
          console.error('Erreur lors de l\'upload des scans (background):', e);
        }
      })();
    }

  // Ajouter la tâche à la liste (les uploads se font en background)
  setTasks([data, ...tasks]);

    // Étendre automatiquement la tâche pour afficher les fichiers
    if (filesToUpload && filesToUpload.length > 0) {
      setExpandedTaskId(data.id);
      console.log(`📂 Tâche ${data.id} automatiquement étendue pour afficher ${filesToUpload.length} fichier(s)`);
    }

    // Déclencher un événement pour rafraîchir le calendrier
    if (data.deadline) {
      const taskCreatedEvent = new CustomEvent('taskCreated', { 
        detail: { 
          task: data,
          deadline: data.deadline 
        } 
      });
      window.dispatchEvent(taskCreatedEvent);
      console.log(`✅ Nouvelle tâche ajoutée au calendrier à la date du ${new Date(data.deadline).toLocaleDateString('fr-FR')}`);
    } else {
      console.warn('⚠️ Impossible d\'afficher la tâche dans le calendrier : aucune date d\'échéance définie.');
    }

    setActiveTab('suivi');
    
    const successMessage = filesToUpload && filesToUpload.length > 0 ?
      `La nouvelle tâche a été ajoutée. Upload des ${filesToUpload.length} fichier(s) en cours.` :
      'La nouvelle tâche a été ajoutée.';
    toast({ title: '✅ Tâche créée', description: successMessage });
  };

  const handleEditTask = async (taskData) => {
    const { filesToUpload, scannedFiles, data: dataToUpdate } = processTaskData(taskData);
    const assignedMember = teamMembers.find(m => m.id === dataToUpdate.assigned_to_id);

    // Uploader les nouveaux fichiers en background
    if (filesToUpload && filesToUpload.length > 0) {
      (async () => {
        try {
          const { uploadMultipleTaskFiles } = await import('@/lib/uploadManager');
          const uploadResult = await uploadMultipleTaskFiles(filesToUpload, editingTask.id, currentUser?.id);
          if (uploadResult.success) {
            const existingFiles = taskFiles[editingTask.id] || [];
            setTaskFiles(prev => ({
              ...prev,
              [editingTask.id]: [...uploadResult.data, ...existingFiles]
            }));
            toast({ title: '✅ Fichiers uploadés', description: `${uploadResult.data.length} fichier(s) ajoutés.` });
          } else if (uploadResult.errors && uploadResult.errors.length > 0) {
            uploadResult.errors.forEach(err => console.error(`❌ Fichier "${err.fileName}" non enregistré — cause: ${err.error}`));
            toast({ title: '⚠️ Erreur upload', description: uploadResult.summary });
          }
        } catch (e) {
          console.error('Erreur lors de l\'upload multiple (background):', e);
        }
      })();
    }

    // Uploader les nouveaux fichiers scannés en background
    if (scannedFiles && scannedFiles.length > 0) {
      (async () => {
        try {
          const bucketReady = await ensureTaskScansBucket();
          if (!bucketReady) return;
          for (const file of scannedFiles) {
            const scannedFile = await handleScanUpload(file, editingTask.id);
            if (scannedFile) console.log('✅ Scan uploadé (background):', scannedFile.file_name || scannedFile.file_url);
          }
        } catch (e) {
          console.error('Erreur lors de l\'upload des scans (background):', e);
        }
      })();
    }

    if (editingTask.assigned_to_id !== dataToUpdate.assigned_to_id && dataToUpdate.assigned_to_id) {
      dataToUpdate.assigned_at = new Date().toISOString();
      // Note: seen_at remise à null ignorée car colonne non disponible dans le schéma
    } else if (!dataToUpdate.assigned_to_id) {
      dataToUpdate.assigned_at = null;
    }

    // Supprimer les colonnes qui n'existent pas dans le schéma Supabase
    const { associated_tasks, main_category, ...cleanDataToUpdate } = dataToUpdate;
    
    // Nettoyer le payload pour supprimer les champs qui n'existent pas dans le schéma Supabase
    const updatePayload = { 
      ...cleanDataToUpdate, 
      assigned_to_name: assignedMember ? assignedMember.name : null
    };
    
    // Supprimer les champs qui n'existent pas dans le schéma Supabase
    delete updatePayload.attachments;
    
    // Nettoyer les champs vides pour éviter les erreurs de validation
    for (const key of Object.keys(updatePayload)) {
      if (updatePayload[key] === '' || updatePayload[key] === undefined) {
        updatePayload[key] = null;
      }
    }

    const { data, error } = await supabase.from('tasks').update(updatePayload).eq('id', editingTask.id).select('id,title,description,priority,status,deadline,assigned_to_id,assigned_to_name,case_id,created_at,updated_at,created_by_id,created_by_name,assigned_at').single();
    
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: `Impossible de modifier la tâche: ${error.message}` });
    } else {
      setTasks(tasks.map(t => t.id === editingTask.id ? data : t));
      setEditingTask(null);
      setActiveTab('suivi');
      
      // Déclencher un événement pour rafraîchir le calendrier
      if (data.deadline) {
        const taskUpdatedEvent = new CustomEvent('taskUpdated', { 
          detail: { 
            task: data,
            deadline: data.deadline 
          } 
        });
        window.dispatchEvent(taskUpdatedEvent);
        console.log(`✅ Tâche mise à jour dans le calendrier à la date du ${new Date(data.deadline).toLocaleDateString('fr-FR')}`);
      }
      
      let successMessage = "La tâche a été mise à jour.";
      // Les fichiers sont uploadés en arrière-plan, pas besoin de compter ici
      if (scannedFiles && scannedFiles.length > 0) {
        successMessage += ` ${scannedFiles.length} scan(s) en cours d'upload.`;
      }
      if (filesToUpload && filesToUpload.length > 0) {
        successMessage += ` ${filesToUpload.length} fichier(s) en cours d'upload.`;
      }
      
      toast({ title: "✅ Tâche modifiée", description: successMessage });
    }
  };

  const handleDeleteTask = async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la tâche." });
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      
      // Déclencher un événement pour rafraîchir le calendrier
      const taskDeletedEvent = new CustomEvent('taskDeleted', { 
        detail: { taskId } 
      });
      window.dispatchEvent(taskDeletedEvent);
      console.log(`✅ Tâche ${taskId} supprimée du calendrier`);
      
      toast({ title: "🗑️ Tâche supprimée", description: "La tâche a été supprimée." });
    }
  };

  const handleStatusChange = async (taskId, newStatus, isSilent = false) => {
    if (newStatus === 'completed') {
      setTaskToComment(taskId);
    } else {
      let updatePayload = { status: newStatus };
      // Note: Logique seen_at désactivée car colonne non disponible dans le schéma
      updateTaskStatus(taskId, updatePayload, null, isSilent);
    }
  };

  const updateTaskStatus = async (taskId, updatePayload, comment = null, isSilent = false) => {
    // Note: completion_comment ignoré car colonne non disponible dans le schéma
    // if (comment !== null) {
    //   updatePayload.completion_comment = comment;
    // }
    const { data, error } = await supabase.from('tasks').update(updatePayload).eq('id', taskId).select('id,title,description,priority,status,deadline,assigned_to_id,assigned_to_name,case_id,attachments,created_at,updated_at,created_by_id,created_by_name,assigned_at');
    if (error) {
      if (!isSilent) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de changer le statut." });
      }
    } else {
      setTasks(tasks.map(t => t.id === taskId ? data[0] : t));
      if (!isSilent) {
        toast({ title: "✅ Statut mis à jour" });
      }
    }
  };

  const handleCommentSubmit = () => {
    if (taskToComment) {
      updateTaskStatus(taskToComment, { status: 'completed' }, completionComment, false);
      setTaskToComment(null);
      setCompletionComment('');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statusCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    seen: tasks.filter(t => t.status === 'seen').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  const handleEditRequest = (task) => {
    setEditingTask(task);
    setActiveTab('nouvelle');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Tâches</h1>
          <p className="text-slate-400">Organisez et suivez vos tâches juridiques</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'suivi' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('suivi')}
            className={`flex-1 justify-center gap-2 ${activeTab === 'suivi' ? 'bg-blue-600' : ''}`}
          >
            <ListTodo className="w-4 h-4" /> Suivi de Tâches
          </Button>
          <Button
            variant={activeTab === 'nouvelle' ? 'default' : 'ghost'}
            onClick={() => { setActiveTab('nouvelle'); setEditingTask(null); }}
            className={`flex-1 justify-center gap-2 ${activeTab === 'nouvelle' ? 'bg-blue-600' : ''}`}
          >
            <FilePlus className="w-4 h-4" /> {editingTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
          </Button>
        </div>
      </div>

      {activeTab === 'suivi' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { key: 'all', label: 'Total', color: 'bg-slate-600' },
              { key: 'pending', label: 'En Attente', color: 'bg-orange-500' },
              { key: 'seen', label: 'Vues', color: 'bg-purple-500' },
              { key: 'in-progress', label: 'En Cours', color: 'bg-blue-500' },
              { key: 'completed', label: 'Terminées', color: 'bg-green-500' }
            ].map((stat) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{statusCounts[stat.key]}</p>
                  </div>
                  <div className={`w-3 h-3 ${stat.color} rounded-full`}></div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher une tâche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="seen">Vue</option>
                  <option value="in-progress">En cours</option>
                  <option value="completed">Terminées</option>
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">Toutes les priorités</option>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Affichage en liste simple et lisible */}
          <div className="space-y-4">
            {/* En-têtes de colonnes */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-6 px-6 py-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
              <div className="text-sm font-medium text-slate-300">Titre & Échéance</div>
              <div className="text-sm font-medium text-slate-300">Description</div>
              <div className="text-sm font-medium text-slate-300">Assigné à</div>
              <div className="text-sm font-medium text-slate-300">Date de création</div>
              <div className="text-sm font-medium text-slate-300 text-right">Statut & Actions</div>
            </div>

            {filteredTasks.map((task, index) => {
              const getStatusColor = (status) => {
                switch (status) {
                  case 'pending': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
                  case 'seen': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                  case 'in-progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
                  default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
                }
              };

              const getStatusLabel = (status) => {
                switch (status) {
                  case 'pending': return 'En Attente';
                  case 'seen': return 'Vue';
                  case 'in-progress': return 'En Cours';
                  case 'completed': return 'Terminée';
                  default: return status;
                }
              };

              const formatDate = (dateString) => {
                if (!dateString) return 'N/A';
                return new Date(dateString).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });
              };

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 hover:border-slate-600/50 transition-all duration-200"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-start">
                    
                    {/* Colonne Titre */}
                    <div className="lg:col-span-1">
                      <div className="flex items-start gap-2">
                        <h4 className="text-lg font-semibold text-white mb-2 line-clamp-2 flex-1">
                          {task.title}
                        </h4>
                        {hasAttachedDocuments(task) && (
                          <button
                            onClick={async () => {
                              const newExpandedId = expandedTaskId === task.id ? null : task.id;
                              setExpandedTaskId(newExpandedId);
                              
                              // Charger les fichiers avec fallback sur attachments si on étend la tâche et qu'on ne les a pas encore
                              if (newExpandedId && !taskFiles[task.id]) {
                                const files = await fetchTaskFiles(task.id, task.attachments);
                                setTaskFiles(prev => ({ ...prev, [task.id]: files }));
                              }
                            }}
                            title={`${taskFiles[task.id]?.length || 0} document(s) joint(s) - Cliquer pour voir`}
                            className="ml-2 flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all duration-200 flex-shrink-0"
                          >
                            <Paperclip className="w-4 h-4" />
                            <span className="text-xs font-semibold">{taskFiles[task.id]?.length || 0}</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-4 h-4" />
                        {task.deadline ? (
                          <span className={task.deadline < new Date().toISOString() ? 'text-red-400' : ''}>
                            {formatDate(task.deadline)}
                          </span>
                        ) : (
                          <span>Pas d'échéance</span>
                        )}
                      </div>
                    </div>

                    {/* Colonne Description */}
                    <div className="lg:col-span-1">
                      <div className="text-slate-300 text-sm line-clamp-3">
                        {task.description || 'Aucune description'}
                      </div>
                    </div>

                    {/* Colonne Assigné à */}
                    <div className="lg:col-span-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">
                          {task.assigned_to_name || 'Non assigné'}
                        </span>
                      </div>
                    </div>

                    {/* Colonne Date de création */}
                    <div className="lg:col-span-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">
                          {formatDate(task.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Colonne Statut + Actions */}
                    <div className="lg:col-span-1 flex flex-col lg:items-end gap-3">
                      {/* Badge de statut */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {task.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              let nextStatus;
                              if (task.status === 'pending') nextStatus = 'seen';
                              else if (task.status === 'seen') nextStatus = 'in-progress';
                              else nextStatus = 'completed';
                              handleStatusChange(task.id, nextStatus);
                            }}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                          >
                            {task.status === 'pending' && <Eye className="w-4 h-4" />}
                            {task.status === 'seen' && <Play className="w-4 h-4" />}
                            {task.status === 'in-progress' && <CheckCircle className="w-4 h-4" />}
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRequest(task)}
                          className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>

                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setConfirmDialog({
                                open: true,
                                title: 'Supprimer la tâche',
                                message: `Voulez-vous vraiment supprimer la tâche "${task.title}" ?\n\nCette action est irréversible.`,
                                onConfirm: () => {
                                  handleDeleteTask(task.id);
                                  setConfirmDialog({ ...confirmDialog, open: false });
                                }
                              });
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Documents Liés - S'affiche si la tâche est étendue et a des documents */}
                  {expandedTaskId === task.id && (hasAttachedDocuments(task) || (taskFiles[task.id] && taskFiles[task.id].length > 0)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-700/50"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <h5 className="text-sm font-semibold text-blue-400">
                          Documents liés ({taskFiles[task.id]?.length || 0})
                        </h5>
                      </div>
                      <div className="space-y-2">
                        {/* Tous les fichiers unifiés (tasks_files + fallback attachments) avec URLs validées */}
                        {(taskFiles[task.id] || []).map((file) => {
                          const isFromAttachments = file.source === 'attachments';
                          const isFromTasksFiles = file.source === 'tasks_files';
                          const iconEmoji = isFromTasksFiles ? '📁' : isFromAttachments ? '📎' : '📷';
                          const isAccessible = file.is_accessible && (file.valid_url || file.file_url?.startsWith('http'));
                          const urlToUse = file.valid_url || file.file_url;
                          
                          return (
                            <div
                              key={`file-${file.id}`}
                              className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className={`w-4 h-4 flex-shrink-0 ${isFromTasksFiles ? 'text-green-400' : isFromAttachments ? 'text-slate-400' : 'text-blue-400'}`} />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-slate-200 truncate block" title={file.file_name}>
                                    {iconEmoji} {file.file_name}
                                  </span>
                                  {file.file_size && (
                                    <span className="text-xs text-slate-500">
                                      {Math.round(file.file_size / 1024)} KB
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {isAccessible || hasLocalBackup(file) ? (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      if (urlToUse) {
                                        // Forcer l'aperçu en ajoutant le paramètre download vide
                                        const previewUrl = urlToUse.includes('?') 
                                          ? `${urlToUse}&download=` 
                                          : `${urlToUse}?download=`;
                                        window.open(previewUrl, '_blank', 'noopener,noreferrer');
                                      }
                                    }}
                                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                    title="Prévisualiser le fichier dans un nouvel onglet"
                                  >
                                    Prévisualiser
                                  </button>
                                  <button
                                    onClick={() => downloadFile(file)}
                                    className="p-1.5 text-green-400 hover:text-green-300 transition-colors"
                                    title="Télécharger le fichier"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  className="text-red-500 text-xs flex-shrink-0"
                                  title="Fichier non disponible (ni URL ni backup local)"
                                >
                                  ❌ Indisponible
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {filteredTasks.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucune tâche trouvée</h3>
              <p className="text-slate-500">{searchTerm || filterStatus !== 'all' || filterPriority !== 'all' ? 'Essayez de modifier vos filtres de recherche' : 'Commencez par créer votre première tâche'}</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {activeTab === 'nouvelle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TaskForm
            task={editingTask}
            onSubmit={editingTask ? handleEditTask : handleAddTask}
            onCancel={() => { setActiveTab('suivi'); setEditingTask(null); }}
            teamMembers={teamMembers}
            cases={cases}
            currentUser={currentUser}
          />
        </motion.div>
      )}

      <AlertDialog open={taskToComment !== null} onOpenChange={() => setTaskToComment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter un commentaire de clôture</AlertDialogTitle>
            <AlertDialogDescription>La tâche est terminée. Veuillez ajouter un commentaire pour résumer le travail effectué.</AlertDialogDescription>
          </AlertDialogHeader>
          <textarea value={completionComment} onChange={(e) => setCompletionComment(e.target.value)} placeholder="Ex: Le rapport a été envoyé au client pour validation." className="w-full mt-4 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => updateTaskStatus(taskToComment, { status: 'completed' }, null, false)}>Passer</AlertDialogCancel>
            <AlertDialogAction onClick={handleCommentSubmit}>Enregistrer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de prévisualisation des fichiers */}
      {previewUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div 
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Aperçu du fichier</h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={previewUrl}
                className="w-full h-[70vh] rounded-lg bg-white"
                title="Aperçu du fichier"
              />
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
              >
                Ouvrir dans un nouvel onglet
              </Button>
              <Button
                variant="destructive"
                onClick={() => setPreviewUrl(null)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation globale */}
      <ConfirmationModal
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
};

TaskManager.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    function: PropTypes.string,
    permissions: PropTypes.object,
  })
};

export default TaskManager;
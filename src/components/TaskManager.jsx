import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  CheckCircle,
  Clock,
  ListTodo,
  FilePlus,
  User,
  FileText,
  Trash2,
  Paperclip,
  Download,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import TaskForm from '@/components/TaskForm';
import { supabase } from '@/lib/customSupabaseClient';
import { getTaskFiles } from '@/api/taskFiles';
import { downloadFile, hasLocalBackup } from '@/lib/filePreviewUtils';
import ConfirmationModal from '@/components/ConfirmationModal';
import PdfViewer from '@/components/PdfViewer';
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
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingTaskId, setUploadingTaskId] = useState(null);
  const [deleteFileDialog, setDeleteFileDialog] = useState({ open: false, file: null, taskId: null });

  const isGerantOrAssocie =
    currentUser && (currentUser.function === 'Gerant' || currentUser.function === 'Associe Emerite');
  const isAdmin = isGerantOrAssocie || (currentUser.role && currentUser.role.toLowerCase() === 'admin');

  /**
   * Tronque un nom de fichier si sa longueur dépasse maxLength caractères
   * en conservant l'extension visible
   * @param {string} fileName - Le nom complet du fichier
   * @param {number} maxLength - Longueur maximale avant troncature (défaut: 25)
   * @returns {string} - Le nom tronqué ou original
   */
  const truncateFileName = (fileName, maxLength = 25) => {
    if (!fileName || fileName.length <= maxLength) return fileName;
    
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      // Pas d'extension
      return fileName.substring(0, maxLength - 3) + '...';
    }
    
    const name = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex);
    const availableLength = maxLength - extension.length - 3; // -3 pour "..."
    
    if (availableLength <= 0) {
      // Si l'extension est trop longue, on tronque tout
      return fileName.substring(0, maxLength - 3) + '...';
    }
    
    return name.substring(0, availableLength) + '...' + extension;
  };

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
    if (isAdmin) {
      fetchCases();
    }

    const handleRefreshTaskFiles = async (event) => {
      const { taskId } = event.detail || {};
      if (!taskId) return;

      try {
        const files = await getTaskFiles(taskId);
        setTaskFiles((prev) => ({
          ...prev,
          [taskId]: files,
        }));
      } catch (error) {
        console.error('Erreur rafraîchissement fichiers:', error);
      }
    };

    window.addEventListener('refreshTaskFiles', handleRefreshTaskFiles);

    return () => {
      window.removeEventListener('refreshTaskFiles', handleRefreshTaskFiles);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const hasAttachedDocuments = (task) => {
    const attachmentsArray = Array.isArray(task.attachments)
      ? task.attachments
      : task.attachments && task.attachments !== ''
        ? JSON.parse(task.attachments)
        : [];

    const hasLoadedFiles = taskFiles[task.id] && taskFiles[task.id].length > 0;

    return attachmentsArray.length > 0 || hasLoadedFiles;
  };

  const getAttachedDocuments = (task) => {
    const attachmentsArray = Array.isArray(task.attachments)
      ? task.attachments
      : task.attachments && task.attachments !== ''
        ? JSON.parse(task.attachments)
        : [];
    return attachmentsArray;
  };

  const fetchTaskFilesLocal = async (taskId, taskAttachments = null) => {
    try {
      const files = await getTaskFiles(taskId, taskAttachments);
      return files;
    } catch (error) {
      return [];
    }
  };

  /**
   * Supprime un fichier associé à une tâche
   * @param {object} file - L'objet fichier à supprimer
   * @param {string} taskId - L'ID de la tâche associée
   */
  const handleDeleteFile = async (file, taskId) => {
    try {
      // Supprimer le fichier de tasks_files si c'est la source
      if (file.source === 'tasks_files' && file.id) {
        const { error } = await supabase
          .from('tasks_files')
          .delete()
          .eq('id', file.id);

        if (error) {
          console.error('Erreur suppression tasks_files:', error);
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: `Impossible de supprimer le fichier: ${error.message}`,
          });
          return;
        }
      }

      // Supprimer le fichier du storage Supabase
      if (file.file_url) {
        try {
          let bucket = 'attachments';
          let filePath = '';

          if (file.file_url.startsWith('http')) {
            const urlObj = new URL(file.file_url);
            const pathParts = urlObj.pathname.split('/');
            const publicIndex = pathParts.indexOf('public');
            
            if (publicIndex !== -1 && pathParts.length > publicIndex + 1) {
              bucket = pathParts[publicIndex + 1];
              filePath = pathParts.slice(publicIndex + 2).join('/');
            }
          } else {
            const fullPath = file.file_url.replace(/^public\//, '');
            const pathParts = fullPath.split('/');
            bucket = pathParts[0] || 'attachments';
            filePath = pathParts.slice(1).join('/');
          }

          if (filePath) {
            const { error: storageError } = await supabase.storage
              .from(bucket)
              .remove([filePath]);

            if (storageError) {
              console.warn('Avertissement lors de la suppression du storage:', storageError);
            }
          }
        } catch (storageErr) {
          console.warn('Erreur non bloquante lors de la suppression du storage:', storageErr);
        }
      }

      // Mettre à jour l'UI immédiatement
      setTaskFiles((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter((f) => f.id !== file.id),
      }));

      toast({
        title: '✅ Fichier supprimé',
        description: `"${file.file_name}" a été supprimé avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: `Impossible de supprimer le fichier: ${error.message}`,
      });
    }
  };

  /**
   * Ouvre le dialogue d'upload de fichier pour une tâche spécifique
   * @param {string} taskId - L'ID de la tâche
   */
  const handleAddFileToTask = (taskId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setUploadingTaskId(taskId);

      try {
        const { uploadMultipleTaskFiles } = await import('@/lib/uploadManager');
        const uploadResult = await uploadMultipleTaskFiles(files, taskId, currentUser?.id);

        if (uploadResult.success) {
          const existingFiles = taskFiles[taskId] || [];
          setTaskFiles((prev) => ({
            ...prev,
            [taskId]: [...uploadResult.data, ...existingFiles],
          }));
          
          // Ouvrir automatiquement la section documents si elle était fermée
          if (expandedTaskId !== taskId) {
            setExpandedTaskId(taskId);
          }

          toast({
            title: '✅ Fichiers ajoutés',
            description: `${uploadResult.data.length} fichier(s) ajoutés à la tâche.`,
          });
        } else if (uploadResult.errors && uploadResult.errors.length > 0) {
          toast({
            title: '⚠️ Erreur d\'upload',
            description: uploadResult.summary,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        toast({
          variant: 'destructive',
          title: '❌ Erreur d\'upload',
          description: `Échec de l'upload: ${error.message}`,
        });
      } finally {
        setUploadingTaskId(null);
      }
    };

    input.click();
  };

  /**
   * Génère une URL signée pour la prévisualisation inline via Supabase Storage
   * sans forcer le téléchargement. Utilisée par le composant PdfViewer interne.
   */
  const createPreviewUrl = async (file) => {
    try {
      if (!file || !file.file_url) return null;

      // Si l'URL est déjà complète (commence par http), extraire le chemin
      let bucket = 'attachments';
      let filePath = '';

      if (file.file_url.startsWith('http')) {
        // Extraire le chemin depuis l'URL complète
        // Format: https://.../storage/v1/object/public/bucket/path
        const urlObj = new URL(file.file_url);
        const pathParts = urlObj.pathname.split('/');
        const publicIndex = pathParts.indexOf('public');
        
        if (publicIndex !== -1 && pathParts.length > publicIndex + 1) {
          bucket = pathParts[publicIndex + 1];
          filePath = pathParts.slice(publicIndex + 2).join('/');
        } else {
          console.error('Format d\'URL non reconnu:', file.file_url);
          return null;
        }
      } else {
        // Chemin relatif
        const fullPath = file.file_url.replace(/^public\//, '');
        const pathParts = fullPath.split('/');
        bucket = pathParts[0] || 'attachments';
        filePath = pathParts.slice(1).join('/');
      }

      if (!filePath) {
        console.error('Impossible d\'extraire le chemin du fichier');
        return null;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600, { download: false });

      if (error || !data?.signedUrl) {
        console.error('Erreur lors de la création de l\'URL signée:', error);
        return null;
      }

      const url = new URL(data.signedUrl);
      url.searchParams.delete('download');
      const cleanUrl = url.toString();

      return cleanUrl;

    } catch (e) {
      console.error("Error preview:", e);
      return null;
    }
  };

  const fetchTasks = async () => {
    const selectColumns =
      'id,title,description,priority,status,deadline,assigned_to_id,assigned_to_ids,assigned_to_name,visible_by_ids,case_id,attachments,created_at,updated_at,created_by_id,created_by_name,assigned_at,main_category,seen_at,completion_comment';
    let query = supabase.from('tasks').select(selectColumns);
    if (!isAdmin && currentUser?.id) {
      // Filtrer : assigned_to_id OU dans assigned_to_ids OU dans visible_by_ids
      query = query.or(`assigned_to_id.eq.${currentUser.id},assigned_to_ids.cs.{${currentUser.id}},visible_by_ids.cs.{${currentUser.id}}`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les tâches." });
    } else {
      // Récupérer les titres des dossiers associés
      const caseIds = [...new Set((data || []).filter(t => t.case_id).map(t => t.case_id))];
      let caseTitlesMap = {};
      
      if (caseIds.length > 0) {
        const { data: casesData } = await supabase
          .from('cases')
          .select('id, title')
          .in('id', caseIds);
        
        if (casesData) {
          caseTitlesMap = casesData.reduce((acc, c) => {
            acc[c.id] = c.title;
            return acc;
          }, {});
        }
      }
      
      // Transformer les données pour ajouter le case_title
      const transformedData = (data || []).map(task => ({
        ...task,
        case_title: task.case_id ? (caseTitlesMap[task.case_id] || null) : null
      }));
      setTasks(transformedData);

      try {
        const taskIds = data.map((t) => t.id);
        const { data: allFiles } = await supabase
          .from('tasks_files')
          .select('*')
          .in('task_id', taskIds)
          .order('created_at', { ascending: false });

        if (allFiles && allFiles.length > 0) {
          const filesByTask = {};
          allFiles.forEach((file) => {
            if (!filesByTask[file.task_id]) {
              filesByTask[file.task_id] = [];
            }
            filesByTask[file.task_id].push({
              ...file,
              source: 'tasks_files',
              is_accessible: true,
              valid_url: file.file_url,
            });
          });

          setTaskFiles((prev) => ({ ...prev, ...filesByTask }));
        }
      } catch (error) {
        console.debug('tasks_files non disponible');
      }
    }
  };

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase.from('profiles').select('id, name, role');
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les collaborateurs.' });
    } else {
      const filteredData = (data || []).filter((member) => member.role !== 'admin');
      setTeamMembers(filteredData);
    }
  };

  const fetchCases = async () => {
    const { data, error } = await supabase.from('cases').select('id, title');
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les dossiers.' });
    } else {
      setCases(data);
    }
  };

  const handleFileUpload = async (file, taskId) => {
    try {
      const { uploadTaskFile } = await import('@/lib/uploadManager');

      const result = await uploadTaskFile(file, taskId, currentUser?.id);

      if (result.success) {
        toast({
          title: '✅ Fichier uploadé',
          description: `"${file.name}" a été téléchargé et est maintenant accessible.`,
        });

        if (taskFiles[taskId]) {
          setTaskFiles((prev) => ({
            ...prev,
            [taskId]: [result.data, ...(prev[taskId] || [])],
          }));
        }

        return result.data.file_url;
      } else {
        toast({
          title: '⚠️ Erreur d\'upload',
          description: `Impossible d'uploader "${file.name}": ${result.error}`,
        });
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload :', error);
      toast({
        title: '❌ Erreur système',
        description: `Échec de l'upload de "${file.name}". Vérifiez votre connexion.`,
      });
      return null;
    }
  };

  const handleScanUpload = async (file, taskId) => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const scansBucketExists = buckets?.some((bucket) => bucket.name === 'task-scans');

      const timestamp = Date.now();
      const sanitizedFileName = file.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `scan_${timestamp}_${sanitizedFileName}`;

      if (!scansBucketExists) {
        const virtualPath = `pending_scan/${currentUser.id}/${taskId}/${fileName}`;
        const virtualFileRecord = {
          file_url: virtualPath,
          file_name: fileName,
          file_size: file.size,
          file_type: file.type,
          status: 'pending_upload',
        };

        toast({
          title: '📷 Scan enregistré',
          description: `"${file.name}" sera uploadé une fois le système configuré. Métadonnées sauvegardées.`,
        });

        return virtualFileRecord;
      }

      const filePath = `${currentUser.id}/${taskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('task-scans').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        toast({
          title: "⚠️ Erreur d'upload du scan",
          description: `Impossible d'uploader le scan "${file.name}": ${uploadError.message}`,
        });
        return null;
      }

      const { data: publicUrlData } = supabase.storage.from('task-scans').getPublicUrl(filePath);

      const validUrl = publicUrlData?.publicUrl || filePath;

      console.log('Table tasks_files désactivée - fichier uploadé mais non enregistré dans BDD');
      toast({
        title: '✅ Scan uploadé',
        description: `"${file.name}" uploadé (table tasks_files non créée)`,
      });
      return { file_url: validUrl, file_name: fileName };
    } catch (error) {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `scan_${timestamp}_${sanitizedFileName}`;
      const virtualPath = `pending_scan/${currentUser.id}/${taskId || 'new'}/${fileName}`;

      toast({
        title: '📷 Scan en attente',
        description: `"${file.name}" sera traité une fois le système de scan disponible.`,
      });

      return { file_url: virtualPath, file_name: fileName, status: 'pending_upload' };
    }
  };

  const ensureTaskScansBucket = async () => {
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
    const assignedMember = teamMembers.find((m) => m.id === dataToInsert.assigned_to_id);

    const payload = {
      ...dataToInsert,
      assigned_to_name: assignedMember ? assignedMember.name : null,
      assigned_at: dataToInsert.assigned_to_id ? new Date().toISOString() : null,
      // Synchroniser assigned_to_ids avec assigned_to_id
      assigned_to_ids: dataToInsert.assigned_to_id ? [dataToInsert.assigned_to_id] : [],
      created_by_id: currentUser.id,
      created_by_name: currentUser.name,
    };

    const { attachments, associated_tasks, ...cleanPayload } = payload;

    for (const key of Object.keys(cleanPayload)) {
      if (cleanPayload[key] === '' || cleanPayload[key] === undefined) {
        cleanPayload[key] = null;
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([cleanPayload])
      .select(
        'id,title,description,priority,status,deadline,assigned_to_id,assigned_to_ids,assigned_to_name,visible_by_ids,case_id,created_at,updated_at,created_by_id,created_by_name,assigned_at,main_category,seen_at,completion_comment'
      )
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Impossible de créer la tâche: ${error.message}`,
      });
      return;
    }

    // Récupérer le titre du dossier si case_id existe
    let caseTitle = null;
    if (data.case_id) {
      const { data: caseData } = await supabase
        .from('cases')
        .select('title')
        .eq('id', data.case_id)
        .single();
      caseTitle = caseData?.title || null;
    }

    const taskWithTitle = {
      ...data,
      case_title: caseTitle
    };

    if (filesToUpload && filesToUpload.length > 0) {
      (async () => {
        try {
          // Vérifier si les fichiers sont des objets {file, category} ou des File simples
          const hasCategories = filesToUpload.length > 0 && 
                                filesToUpload[0] &&
                                typeof filesToUpload[0] === 'object' &&
                                'file' in filesToUpload[0] && 
                                'category' in filesToUpload[0];
          
          let uploadResult;
          
          if (hasCategories) {
            // Grouper par catégorie et uploader
            const { uploadMultipleTaskFilesWithCategory } = await import('@/lib/uploadManager');
            
            // Pour simplifier, on prend la catégorie du premier fichier
            // (dans TaskForm, tous les fichiers uploadés ensemble ont la même catégorie)
            const firstCategory = filesToUpload[0].category;
            const files = filesToUpload.map(obj => obj.file);
            
            uploadResult = await uploadMultipleTaskFilesWithCategory(files, data.id, currentUser?.id, firstCategory);
          } else {
            // Ancienne méthode sans catégorie (fichiers directs)
            const { uploadMultipleTaskFiles } = await import('@/lib/uploadManager');
            uploadResult = await uploadMultipleTaskFiles(filesToUpload, data.id, currentUser?.id);
          }

          if (uploadResult.success) {
            console.log('📊 Mise à jour taskFiles pour tâche', data.id, 'avec', uploadResult.data.length, 'fichier(s):', uploadResult.data);
            setTaskFiles((prev) => ({
              ...prev,
              [data.id]: uploadResult.data,
            }));
            if (uploadResult.data && uploadResult.data.length > 0) {
              setExpandedTaskId(data.id);
            }
            toast({
              title: '✅ Fichiers uploadés',
              description: `${uploadResult.data.length} fichier(s) ajoutés à la tâche.`,
            });
          } else if (uploadResult.errors && uploadResult.errors.length > 0) {
            uploadResult.errors.forEach((err) =>
              console.error(`❌ Fichier "${err.fileName}" non enregistré — cause: ${err.error}`)
            );
            const isBucketError = uploadResult.errors.some(
              (e) => e.error?.includes("bucket 'attachments'") || e.error?.includes('non configur')
            );
            if (isBucketError) {
              toast({
                title: '⚠️ Stockage non configuré',
                description: "Le bucket 'attachments' doit être créé dans Supabase.",
                variant: 'destructive',
              });
            } else {
              toast({ title: '⚠️ Erreur upload', description: uploadResult.summary });
            }
            if (uploadResult.data && uploadResult.data.length > 0) {
              setTaskFiles((prev) => ({ ...prev, [data.id]: uploadResult.data }));
            }
          }
        } catch (error) {
          console.error('❌ Erreur critique lors de l\'upload (background):', error);
          toast({
            title: '❌ Erreur d\'upload',
            description: `Échec de l'upload des fichiers : ${error.message || 'Erreur inconnue'}`,
            variant: 'destructive',
          });
        }
      })().catch((err) => {
        console.error('❌ Erreur non gérée dans l\'upload background:', err);
        toast({
          title: '❌ Erreur critique',
          description: 'Une erreur inattendue s\'est produite lors de l\'upload.',
          variant: 'destructive',
        });
      });
    }

    if (scannedFiles && scannedFiles.length > 0) {
      (async () => {
        try {
          // Vérifier si les fichiers scannés ont des catégories
          const hasCategories = scannedFiles.length > 0 && 
                                scannedFiles[0].file && 
                                scannedFiles[0].category;
          
          if (hasCategories) {
            // Nouveaux fichiers avec catégorie - utiliser uploadMultipleTaskFilesWithCategory
            const { uploadMultipleTaskFilesWithCategory } = await import('@/lib/uploadManager');
            
            // Grouper par catégorie
            const filesByCategory = scannedFiles.reduce((acc, obj) => {
              if (!acc[obj.category]) acc[obj.category] = [];
              acc[obj.category].push(obj.file);
              return acc;
            }, {});
            
            // Uploader chaque groupe
            for (const [category, files] of Object.entries(filesByCategory)) {
              const uploadResult = await uploadMultipleTaskFilesWithCategory(files, data.id, currentUser?.id, category);
              if (uploadResult.success) {
                console.log(`✅ ${files.length} scan(s) uploadé(s) avec catégorie "${category}"`);
              }
            }
          } else {
            // Ancienne méthode sans catégorie
            const bucketReady = await ensureTaskScansBucket();
            if (!bucketReady) return;
            for (const file of scannedFiles) {
              const scannedFile = await handleScanUpload(file, data.id);
              if (scannedFile) {
                console.log('✅ Scan uploadé (background):', scannedFile.file_name || scannedFile.file_url);
              }
            }
          }
        } catch (e) {
          console.error('Erreur lors de l\'upload des scans (background):', e);
          toast({
            title: '⚠️ Erreur upload scan',
            description: `Impossible d'uploader les scans : ${e.message || 'Erreur inconnue'}`,
            variant: 'destructive',
          });
        }
      })().catch((err) => {
        console.error('❌ Erreur non gérée dans l\'upload des scans:', err);
      });
    }

    setTasks([taskWithTitle, ...tasks]);

    if (filesToUpload && filesToUpload.length > 0) {
      setExpandedTaskId(taskWithTitle.id);
    }

    if (taskWithTitle.deadline) {
      const taskCreatedEvent = new CustomEvent('taskCreated', {
        detail: {
          task: taskWithTitle,
          deadline: taskWithTitle.deadline,
        },
      });
      window.dispatchEvent(taskCreatedEvent);
    }

    setActiveTab('suivi');

    const successMessage =
      filesToUpload && filesToUpload.length > 0
        ? `La nouvelle tâche a été ajoutée. Upload des ${filesToUpload.length} fichier(s) en cours.`
        : 'La nouvelle tâche a été ajoutée.';
    toast({ title: '✅ Tâche créée', description: successMessage });
  };

  const handleEditTask = async (taskData) => {
    const { filesToUpload, scannedFiles, data: dataToUpdate } = processTaskData(taskData);
    const assignedMember = teamMembers.find((m) => m.id === dataToUpdate.assigned_to_id);

    if (filesToUpload && filesToUpload.length > 0) {
      (async () => {
        try {
          // Vérifier si les fichiers ont des catégories
          const hasCategories = filesToUpload.length > 0 && 
                                filesToUpload[0] && 
                                typeof filesToUpload[0] === 'object' &&
                                'file' in filesToUpload[0] &&
                                'category' in filesToUpload[0];
          
          let uploadResult;
          
          if (hasCategories) {
            const { uploadMultipleTaskFilesWithCategory } = await import('@/lib/uploadManager');
            const firstCategory = filesToUpload[0].category;
            const files = filesToUpload.map(obj => obj.file);
            uploadResult = await uploadMultipleTaskFilesWithCategory(files, editingTask.id, currentUser?.id, firstCategory);
          } else {
            const { uploadMultipleTaskFiles } = await import('@/lib/uploadManager');
            uploadResult = await uploadMultipleTaskFiles(filesToUpload, editingTask.id, currentUser?.id);
          }
          
          if (uploadResult.success) {
            const existingFiles = taskFiles[editingTask.id] || [];
            setTaskFiles((prev) => ({
              ...prev,
              [editingTask.id]: [...uploadResult.data, ...existingFiles],
            }));
            toast({
              title: '✅ Fichiers uploadés',
              description: `${uploadResult.data.length} fichier(s) ajoutés.`,
            });
          } else if (uploadResult.errors && uploadResult.errors.length > 0) {
            uploadResult.errors.forEach((err) =>
              console.error(`❌ Fichier "${err.fileName}" non enregistré — cause: ${err.error}`)
            );
            toast({
              title: '⚠️ Erreur upload',
              description: uploadResult.summary,
              variant: 'destructive',
            });
          }
        } catch (e) {
          console.error('Erreur lors de l\'upload multiple (background):', e);
          toast({
            title: '❌ Erreur d\'upload',
            description: `Échec de l'upload : ${e.message || 'Erreur inconnue'}`,
            variant: 'destructive',
          });
        }
      })().catch((err) => {
        console.error('❌ Erreur non gérée dans l\'upload:', err);
      });
    }

    if (scannedFiles && scannedFiles.length > 0) {
      (async () => {
        try {
          // Vérifier si les fichiers scannés ont des catégories
          const hasCategories = scannedFiles.length > 0 && 
                                scannedFiles[0].file && 
                                scannedFiles[0].category;
          
          if (hasCategories) {
            // Nouveaux fichiers avec catégorie
            const { uploadMultipleTaskFilesWithCategory } = await import('@/lib/uploadManager');
            
            const filesByCategory = scannedFiles.reduce((acc, obj) => {
              if (!acc[obj.category]) acc[obj.category] = [];
              acc[obj.category].push(obj.file);
              return acc;
            }, {});
            
            for (const [category, files] of Object.entries(filesByCategory)) {
              const uploadResult = await uploadMultipleTaskFilesWithCategory(files, editingTask.id, currentUser?.id, category);
              if (uploadResult.success) {
                console.log(`✅ ${files.length} scan(s) uploadé(s) avec catégorie "${category}"`);
              }
            }
          } else {
            // Ancienne méthode
            const bucketReady = await ensureTaskScansBucket();
            if (!bucketReady) return;
            for (const file of scannedFiles) {
              const scannedFile = await handleScanUpload(file, editingTask.id);
              if (scannedFile) console.log('✅ Scan uploadé (background):', scannedFile.file_name || scannedFile.file_url);
            }
          }
        } catch (e) {
          console.error('Erreur lors de l\'upload des scans (background):', e);
          toast({
            title: '⚠️ Erreur upload scan',
            description: `Impossible d'uploader les scans : ${e.message || 'Erreur inconnue'}`,
            variant: 'destructive',
          });
        }
      })().catch((err) => {
        console.error('❌ Erreur non gérée dans l\'upload des scans:', err);
      });
    }

    if (editingTask.assigned_to_id !== dataToUpdate.assigned_to_id && dataToUpdate.assigned_to_id) {
      dataToUpdate.assigned_at = new Date().toISOString();
      dataToUpdate.seen_at = null;
    } else if (!dataToUpdate.assigned_to_id) {
      dataToUpdate.assigned_at = null;
    }

    const { associated_tasks, attachments, ...cleanDataToUpdate } = dataToUpdate;

    const updatePayload = {
      ...cleanDataToUpdate,
      assigned_to_name: assignedMember ? assignedMember.name : null,
      // Synchroniser assigned_to_ids avec assigned_to_id
      assigned_to_ids: dataToUpdate.assigned_to_id ? [dataToUpdate.assigned_to_id] : [],
    };

    for (const key of Object.keys(updatePayload)) {
      if (updatePayload[key] === '' || updatePayload[key] === undefined) {
        updatePayload[key] = null;
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', editingTask.id)
      .select(
        'id,title,description,priority,status,deadline,assigned_to_id,assigned_to_ids,assigned_to_name,visible_by_ids,case_id,created_at,updated_at,created_by_id,created_by_name,assigned_at,main_category,seen_at,completion_comment'
      )
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Impossible de modifier la tâche: ${error.message}`,
      });
    } else {
      // Récupérer le titre du dossier si case_id existe
      let caseTitle = null;
      if (data.case_id) {
        const { data: caseData } = await supabase
          .from('cases')
          .select('title')
          .eq('id', data.case_id)
          .single();
        caseTitle = caseData?.title || null;
      }

      const taskWithTitle = {
        ...data,
        case_title: caseTitle
      };
      
      setTasks(tasks.map((t) => (t.id === editingTask.id ? taskWithTitle : t)));
      setEditingTask(null);
      setActiveTab('suivi');

      if (taskWithTitle?.deadline) {
        const taskUpdatedEvent = new CustomEvent('taskUpdated', {
          detail: {
            task: taskWithTitle,
            deadline: taskWithTitle.deadline,
          },
        });
        window.dispatchEvent(taskUpdatedEvent);
      }

      let successMessage = 'La tâche a été mise à jour.';
      if (scannedFiles && scannedFiles.length > 0) {
        successMessage += ` ${scannedFiles.length} scan(s) en cours d'upload.`;
      }
      if (filesToUpload && filesToUpload.length > 0) {
        successMessage += ` ${filesToUpload.length} fichier(s) en cours d'upload.`;
      }

      toast({ title: '✅ Tâche modifiée', description: successMessage });
    }
  };

  const handleDeleteTask = async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la tâche.',
      });
    } else {
      setTasks(tasks.filter((t) => t.id !== taskId));

      const taskDeletedEvent = new CustomEvent('taskDeleted', {
        detail: { taskId },
      });
      window.dispatchEvent(taskDeletedEvent);

      toast({ title: '🗑️ Tâche supprimée', description: 'La tâche a été supprimée.' });
    }
  };

  const handleStatusChange = async (taskId, newStatus, isSilent = false) => {
    if (newStatus === 'completed') {
      setTaskToComment(taskId);
    } else {
      const updatePayload = { status: newStatus };
      if (newStatus === 'seen' || newStatus === 'in-progress') {
        updatePayload.seen_at = new Date().toISOString();
      }
      updateTaskStatus(taskId, updatePayload, null, isSilent);
    }
  };

  const updateTaskStatus = async (taskId, updatePayload, comment = null, isSilent = false) => {
    if (comment !== null) {
      updatePayload.completion_comment = comment;
    }
    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select(
        'id,title,description,priority,status,deadline,assigned_to_id,assigned_to_ids,assigned_to_name,visible_by_ids,case_id,attachments,created_at,updated_at,created_by_id,created_by_name,assigned_at,main_category,seen_at,completion_comment'
      );
    if (error) {
      if (!isSilent) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de changer le statut.',
        });
      }
    } else {
      // Récupérer le titre du dossier si case_id existe
      let caseTitle = null;
      if (data[0].case_id) {
        const { data: caseData } = await supabase
          .from('cases')
          .select('title')
          .eq('id', data[0].case_id)
          .single();
        caseTitle = caseData?.title || null;
      }

      const taskWithTitle = {
        ...data[0],
        case_title: caseTitle
      };
      
      setTasks(tasks.map((t) => (t.id === taskId ? taskWithTitle : t)));
      if (!isSilent) {
        toast({ title: '✅ Statut mis à jour' });
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

  const filteredTasks = tasks.filter((task) => {
    if (!task || !task.title) return false;

    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statusCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    seen: tasks.filter((t) => t.status === 'seen').length,
    'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const handleEditRequest = (task) => {
    setEditingTask(task);
    setActiveTab('nouvelle');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getCaseNumber = (caseId) => {
    if (!caseId) return null;
    const relatedCase = cases.find((c) => c.id === caseId);
    return relatedCase
      ? `CASE-${new Date(relatedCase.created_at || Date.now()).getFullYear()}-${String(caseId)
          .slice(-3)
          .padStart(3, '0')}`
      : `CASE-${caseId}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'seen':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'in-progress':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'seen':
        return 'Vue';
      case 'in-progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return { label: 'HAUTE', class: 'bg-red-500/20 text-red-300 border-red-500/40' };
      case 'medium':
        return { label: 'MOYENNE', class: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' };
      case 'low':
        return { label: 'FAIBLE', class: 'bg-slate-500/20 text-slate-400 border-slate-500/40' };
      default:
        return { label: 'MOYENNE', class: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' };
    }
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
            onClick={() => {
              setActiveTab('nouvelle');
              setEditingTask(null);
            }}
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
              { key: 'completed', label: 'Terminées', color: 'bg-green-500' },
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
                  <div className={`w-3 h-3 ${stat.color} rounded-full`} />
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
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="seen">Vue</option>
                  <option value="in-progress">En cours</option>
                  <option value="completed">Terminées</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les priorités</option>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 bg-slate-900/50 border-b border-slate-700/30">
              <div className="col-span-1 text-xs font-medium text-slate-400" />
              <div className="col-span-4 text-xs font-medium text-slate-300">Tâche</div>
              <div className="col-span-2 text-xs font-medium text-slate-300">Dossier</div>
              <div className="col-span-2 text-xs font-medium text-slate-300">Échéance & Assigné</div>
              <div className="col-span-2 text-xs font-medium text-slate-300">Statut</div>
              <div className="col-span-1 text-xs font-medium text-slate-300 text-right">Priorité</div>
            </div>

            {filteredTasks.map((task, index) => {
              const priorityBadge = getPriorityBadge(task.priority);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center">
                    <div className="lg:col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => {
                          if (task.status === 'completed') {
                            handleStatusChange(task.id, 'in-progress', true);
                          } else {
                            handleStatusChange(task.id, 'completed', false);
                          }
                        }}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </div>

                    <div className="lg:col-span-4">
                      <div className="flex items-start gap-2">
                        <h4
                          className={`text-sm font-semibold text-white line-clamp-2 flex-1 ${
                            task.status === 'completed' ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        {hasAttachedDocuments(task) && (
                          <button
                            onClick={async () => {
                              const newExpandedId = expandedTaskId === task.id ? null : task.id;
                              setExpandedTaskId(newExpandedId);
                              if (newExpandedId && !taskFiles[task.id]) {
                                const files = await fetchTaskFilesLocal(task.id, task.attachments);
                                setTaskFiles((prev) => ({ ...prev, [task.id]: files }));
                              }
                            }}
                            title={`${taskFiles[task.id]?.length || 0} document(s) joint(s)`}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors text-xs"
                          >
                            <Paperclip className="w-3 h-3" />
                            {taskFiles[task.id]?.length || 0}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      {task.case_title ? (
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[200px]" title={task.case_title}>
                            {task.case_title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Aucun dossier</span>
                      )}
                    </div>

                    <div className="lg:col-span-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Échéance: {task.deadline ? formatDate(task.deadline) : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Assigné à: {task.assigned_to_name || 'Non assigné'}</span>
                      </div>
                    </div>

                    <div className="lg:col-span-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {task.status === 'pending' && <Clock className="w-3 h-3 mr-1 text-blue-300" />}
                        {task.status === 'in-progress' && (
                          <AlertTriangle className="w-3 h-3 mr-1 text-yellow-300" />
                        )}
                        {getStatusLabel(task.status)}
                      </span>
                    </div>

                    <div className="lg:col-span-1 flex items-center justify-end gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${priorityBadge.class}`}
                      >
                        {priorityBadge.label}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRequest(task)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                          title="Modifier"
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
                                  setConfirmDialog((prev) => ({ ...prev, open: false }));
                                },
                              });
                            }}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedTaskId === task.id &&
                    (hasAttachedDocuments(task) ||
                      (taskFiles[task.id] && taskFiles[task.id].length > 0)) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-700/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <h5 className="text-sm font-semibold text-blue-400">
                              Documents liés ({taskFiles[task.id]?.length || 0})
                            </h5>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddFileToTask(task.id)}
                            disabled={uploadingTaskId === task.id}
                            className="h-7 px-3 gap-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            title="Ajouter un document"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-xs font-medium">Ajouter un fichier</span>
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(taskFiles[task.id] || []).map((file) => {
                            const isFromAttachments = file.source === 'attachments';
                            const isFromTasksFiles = file.source === 'tasks_files';
                            const iconEmoji = isFromTasksFiles
                              ? '📁'
                              : isFromAttachments
                                ? '📎'
                                : '📷';
                            const isAccessible =
                              file.is_accessible &&
                              (file.valid_url || file.file_url?.startsWith('http'));

                            return (
                              <div
                                key={`file-${file.id}`}
                                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <FileText
                                    className={`w-4 h-4 flex-shrink-0 ${
                                      isFromTasksFiles
                                        ? 'text-green-400'
                                        : isFromAttachments
                                          ? 'text-slate-400'
                                          : 'text-blue-400'
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span
                                      className="text-sm text-slate-200 block"
                                      title={file.file_name}
                                    >
                                      {iconEmoji} {truncateFileName(file.file_name)}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      {file.file_size && (
                                        <span className="text-xs text-slate-500">
                                          {Math.round(file.file_size / 1024)} KB
                                        </span>
                                      )}
                                      <span className={`text-xs flex items-center gap-1 ${file.document_category ? 'text-blue-400' : 'text-slate-500'}`}>
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${file.document_category ? 'bg-blue-400' : 'bg-slate-500'}`}></span>
                                        {file.document_category || 'Non classé'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {isAccessible || hasLocalBackup(file) ? (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={async () => {
                                        try {
                                          // Déterminer le type de fichier (extraction robuste de l'extension)
                                          const rawName = (file.file_name || '').trim();
                                          
                                          // Nettoyer uniquement les caractères fermants en fin de nom
                                          const cleanedName = rawName.replace(/[\)\]\}]+\s*$/g, '');
                                          
                                          // Extraire l'extension après le dernier point
                                          const lastDotIndex = cleanedName.lastIndexOf('.');
                                          let fileExtension = '';
                                          
                                          if (lastDotIndex > 0) {
                                            // Récupérer ce qui se trouve après le dernier point
                                            const rawExtension = cleanedName.substring(lastDotIndex + 1);
                                            // Supprimer tout caractère résiduel non alphanumérique et convertir en minuscules
                                            fileExtension = rawExtension.replace(/[^a-z0-9]/gi, '').toLowerCase();
                                          }
                                          
                                          const isWordDoc = ['doc', 'docx'].includes(fileExtension);
                                          const isPdf = fileExtension === 'pdf';

                                          let previewPdfUrl = null;

                                          if (isPdf) {
                                            // Fichier PDF : prévisualisation normale
                                            previewPdfUrl = await createPreviewUrl(file);
                                          } else if (isWordDoc) {
                                            // Fichier Word : conversion automatique en PDF
                                            toast({
                                              title: 'Conversion en cours...',
                                              description: 'Conversion du document Word en PDF pour prévisualisation',
                                            });

                                            try {
                                              // Importer dynamiquement la fonction de conversion
                                              const { getConvertedPdfUrl } = await import('@/lib/uploadManager');
                                              previewPdfUrl = await getConvertedPdfUrl(file);
                                            } catch (conversionError) {
                                              console.error('Erreur de conversion:', conversionError);
                                              toast({
                                                variant: 'destructive',
                                                title: 'Conversion impossible',
                                                description: 'Le service de conversion Word → PDF n\'est pas disponible. Utilisez le bouton Télécharger.',
                                              });
                                              return;
                                            }
                                          } else {
                                            // Autres formats non supportés
                                            toast({
                                              variant: 'destructive',
                                              title: 'Format non supporté',
                                              description: 'Seuls les fichiers PDF et Word (.doc, .docx) peuvent être prévisualisés.',
                                            });
                                            return;
                                          }

                                          if (previewPdfUrl) {
                                            // Ouvrir le visualisateur PDF interne
                                            setPreviewFile(file);
                                            setPreviewUrl(previewPdfUrl);
                                          } else {
                                            toast({
                                              variant: 'destructive',
                                              title: 'Erreur',
                                              description:
                                                "Impossible de générer l'URL de prévisualisation",
                                            });
                                          }
                                        } catch (error) {
                                          console.error('Erreur prévisualisation:', error);
                                          toast({
                                            variant: 'destructive',
                                            title: 'Erreur',
                                            description:
                                              'Impossible d\'ouvrir le fichier en prévisualisation',
                                          });
                                        }
                                      }}
                                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                      title="Prévisualiser le fichier (PDF et Word supportés)"
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
                                    <button
                                      onClick={() => {
                                        setDeleteFileDialog({
                                          open: true,
                                          file: file,
                                          taskId: task.id,
                                        });
                                      }}
                                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                                      title="Supprimer le fichier"
                                    >
                                      <Trash2 className="w-4 h-4" />
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

            {filteredTasks.length === 0 && (
              <div className="text-center py-16">
                <ListTodo className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-400 mb-2">Aucune tâche trouvée</h3>
                <p className="text-sm text-slate-500">
                  {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                    ? 'Essayez de modifier vos filtres de recherche'
                    : 'Cliquez sur "Nouvelle Tâche" pour commencer'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'nouvelle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TaskForm
            task={editingTask}
            onSubmit={editingTask ? handleEditTask : handleAddTask}
            onCancel={() => {
              setActiveTab('suivi');
              setEditingTask(null);
            }}
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
            <AlertDialogDescription>
              La tâche est terminée. Veuillez ajouter un commentaire pour résumer le travail effectué.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={completionComment}
            onChange={(e) => setCompletionComment(e.target.value)}
            placeholder="Ex: Le rapport a été envoyé au client pour validation."
            className="w-full mt-4 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                updateTaskStatus(taskToComment, { status: 'completed' }, null, false)
              }
            >
              Passer
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCommentSubmit}>Enregistrer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewUrl && previewFile && (
        <PdfViewer
          fileUrl={previewUrl}
          fileName={previewFile.file_name}
          onClose={() => {
            setPreviewUrl(null);
            setPreviewFile(null);
          }}
          onDownload={() => downloadFile(previewFile)}
        />
      )}

      <AlertDialog 
        open={deleteFileDialog.open} 
        onOpenChange={(open) => setDeleteFileDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le fichier</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le fichier "{deleteFileDialog.file?.file_name}" ?
              <br /><br />
              Cette action est irréversible et le fichier sera supprimé définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteFileDialog({ open: false, file: null, taskId: null })}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteFileDialog.file && deleteFileDialog.taskId) {
                  handleDeleteFile(deleteFileDialog.file, deleteFileDialog.taskId);
                }
                setDeleteFileDialog({ open: false, file: null, taskId: null });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmationModal
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
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
  }),
};

export default TaskManager;

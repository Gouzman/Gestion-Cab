import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, FileText, User, Paperclip, RefreshCw, Download, ScanLine, CheckSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { taskCategoriesData } from '@/lib/taskCategories';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { detectScanners, startHardwareScan, openScanFileSelector, getScannerInstructions } from '@/lib/scannerUtils';

const TaskForm = ({ task, onSubmit, onCancel, teamMembers, cases, currentUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    deadline: '',
    assigned_to_id: '',
    case_id: '',
    main_category: '',
    associated_tasks: [],
    attachments: [],
    filesToUpload: [],
    scannedFiles: []
  });
  const [showReassign, setShowReassign] = useState(false);
  const [availableSubTasks, setAvailableSubTasks] = useState([]);
  const [scannerAvailable, setScannerAvailable] = useState(false);

  // Vérifier la disponibilité des scanners au chargement
  useEffect(() => {
    const checkScannerAvailability = async () => {
      try {
        if ('ImageCapture' in globalThis && navigator.mediaDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasScanner = devices.some(device => 
            device.kind === 'videoinput' && (
              device.label.toLowerCase().includes('scanner') ||
              device.label.toLowerCase().includes('document') ||
              device.label.toLowerCase().includes('scan')
            )
          );
          setScannerAvailable(hasScanner);
        }
      } catch (err) {
        console.log('Impossible de détecter les scanners:', err);
      }
    };
    
    checkScannerAvailability();
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        deadline: task.deadline ? new Date(task.deadline).toISOString().substring(0, 16) : '',
        assigned_to_id: task.assigned_to_id || '',
        case_id: task.case_id || '',
        main_category: task.main_category || '',
        associated_tasks: task.associated_tasks || [],
        attachments: task.attachments || [],
        filesToUpload: [],
        scannedFiles: []
      });
      if (task.main_category) {
        const category = taskCategoriesData.find(c => c.name === task.main_category);
        setAvailableSubTasks(category ? category.tasks : []);
      }
    }
  }, [task]);

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

    if (name === 'main_category') {
      const category = taskCategoriesData.find(c => c.name === value);
      setAvailableSubTasks(category ? category.tasks : []);
      setFormData(prev => ({ ...prev, associated_tasks: [] }));
    }
  };

  const handleSubTaskChange = (subTask) => {
    setFormData(prev => {
      const newAssociatedTasks = prev.associated_tasks.includes(subTask)
        ? prev.associated_tasks.filter(st => st !== subTask)
        : [...prev.associated_tasks, subTask];
      return { ...prev, associated_tasks: newAssociatedTasks };
    });
  };

  const handleFileChange = async (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Si on édite une tâche existante, uploader immédiatement
      if (task?.id) {
        await handleImmediateUpload(newFiles);
      } else {
        // Sinon, ajouter aux fichiers en attente
        setFormData(prev => ({
          ...prev,
          filesToUpload: [...prev.filesToUpload, ...newFiles]
        }));
        toast({
          title: `📎 ${newFiles.length} fichier(s) ajouté(s)`,
          description: `Prêt(s) à être téléversé(s) lors de la sauvegarde.`,
        });
      }
      e.target.value = '';
    }
  };

  const handleImmediateUpload = async (files) => {
    if (!task?.id) {
      toast({
        variant: "destructive",
        title: "⚠️ Tâche non enregistrée",
        description: "Veuillez d'abord enregistrer la tâche avant d'ajouter des fichiers."
      });
      return;
    }

    try {
      const { uploadMultipleTaskFiles } = await import('@/lib/uploadManager');
      
      toast({
        title: "📤 Upload en cours...",
        description: `Téléversement de ${files.length} fichier(s)...`,
      });

      const uploadResult = await uploadMultipleTaskFiles(files, task.id, currentUser?.id);
      
      if (uploadResult.success) {
        toast({
          title: "✅ Fichiers uploadés",
          description: `${uploadResult.data.length} fichier(s) téléversé(s) avec succès.`,
        });
        
        // Rafraîchir la liste des fichiers via le parent
        if (window.refreshTaskFiles) {
          window.refreshTaskFiles(task.id);
        }
      } else if (uploadResult.errors.length > 0) {
        const isBucketError = uploadResult.errors.some(e => 
          e.error?.includes("bucket 'attachments'") || 
          e.error?.includes("n'est pas encore configuré")
        );
        
        if (isBucketError) {
          toast({ 
            title: "⚠️ Stockage non configuré", 
            description: "Le bucket 'attachments' doit être créé dans Supabase Dashboard > Storage",
            variant: "destructive"
          });
        } else {
          toast({ 
            title: "⚠️ Erreur d'upload", 
            description: uploadResult.summary,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Erreur upload immédiat:", error);
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: "Impossible d'uploader les fichiers."
      });
    }
  };

  const handleDownload = async (filePath) => {
    // TEMPORAIRE : Désactiver le téléchargement jusqu'à ce que le bucket 'attachments' soit créé
    // Pour réactiver : supprimer ce toast et décommenter le code dans le fichier git history
    toast({ 
      variant: "destructive", 
      title: "Bucket non configuré", 
      description: "Le bucket Storage 'attachments' doit être créé dans Supabase Dashboard" 
    });
  };

  const handleScan = async () => {
    try {
      // Vérifier si le navigateur supporte l'API Image Capture pour les scanners
      if ('ImageCapture' in globalThis && navigator.mediaDevices) {
        try {
          // Essayer d'accéder aux périphériques de capture (incluant scanners)
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          // Chercher des scanners ou caméras de document
          const scannerDevice = videoDevices.find(device => 
            device.label.toLowerCase().includes('scanner') ||
            device.label.toLowerCase().includes('document') ||
            device.label.toLowerCase().includes('scan')
          );
          
          if (scannerDevice) {
            // Utiliser le scanner si trouvé
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: scannerDevice.deviceId }
            });
            
            // Créer une interface de capture pour le scanner
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            // Interface simple de capture
            const modal = document.createElement('div');
            modal.style.cssText = `
              position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
              align-items: center; justify-content: center; z-index: 9999;
            `;
            
            video.style.cssText = `max-width: 90%; max-height: 70%; border: 2px solid #fff;`;
            
            const captureBtn = document.createElement('button');
            captureBtn.textContent = '📸 Capturer le Scan';
            captureBtn.style.cssText = `
              margin: 20px; padding: 15px 30px; font-size: 18px;
              background: #3b82f6; color: white; border: none; border-radius: 8px;
              cursor: pointer;
            `;
            
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = '❌ Annuler';
            cancelBtn.style.cssText = `
              margin: 10px; padding: 10px 20px; font-size: 16px;
              background: #6b7280; color: white; border: none; border-radius: 8px;
              cursor: pointer;
            `;
            
            modal.appendChild(video);
            modal.appendChild(captureBtn);
            modal.appendChild(cancelBtn);
            document.body.appendChild(modal);
            
            captureBtn.onclick = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0);
              
              canvas.toBlob(async (blob) => {
                const file = new File([blob], `scan_${Date.now()}.png`, { type: 'image/png' });
                
                // Si on édite une tâche existante, uploader immédiatement
                if (task?.id) {
                  await handleImmediateUpload([file]);
                } else {
                  setFormData(prev => ({
                    ...prev,
                    scannedFiles: [...prev.scannedFiles, file]
                  }));
                  
                  toast({
                    title: "📄 Document scanné",
                    description: `${file.name} capturé avec succès depuis le scanner.`,
                  });
                }
                
                for (const track of stream.getTracks()) {
                  track.stop();
                }
                modal.remove();
              }, 'image/png', 0.95);
            };
            
            cancelBtn.onclick = () => {
              for (const track of stream.getTracks()) {
                track.stop();
              }
              modal.remove();
            };
            
            return;
          }
        } catch (err) {
          console.log('Scanner hardware non détecté, utilisation de l\'interface de sélection:', err.message);
          // Fallback vers l'interface de sélection de fichiers
        }
      }
      
      // Fallback : Interface de sélection de fichier pour scanners réseau/USB
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.multiple = false;
      
      // Attribut pour indiquer la préférence de scanner
      input.setAttribute('webkitdirectory', false);
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          // Vérifier les formats supportés
          if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            toast({
              variant: "destructive",
              title: "❌ Format non supporté",
              description: "Veuillez sélectionner une image ou un PDF."
            });
            return;
          }
          
          // Si on édite une tâche existante, uploader immédiatement
          if (task?.id) {
            handleImmediateUpload([file]);
          } else {
            // Ajouter le fichier scanné
            setFormData(prev => ({
              ...prev,
              scannedFiles: [...prev.scannedFiles, file]
            }));
            
            toast({
              title: "�️ Document scanné",
              description: `${file.name} ajouté depuis le scanner. Il sera uploadé lors de la sauvegarde.`,
            });
          }
        }
      };
      
      // Message pour guider l'utilisateur
      toast({
        title: "🖨️ Scanner",
        description: "Sélectionnez un document depuis votre scanner ou un fichier déjà scanné.",
      });
      
      input.click();
      
    } catch (error) {
      console.error('Erreur scanner:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur Scanner",
        description: "Impossible d'accéder au scanner. Vérifiez les permissions du navigateur."
      });
    }
  };

  const isGerantOrAssocie = currentUser && (currentUser.function === 'Gerant' || currentUser.function === 'Associe Emerite');
  const isAdmin = isGerantOrAssocie || (currentUser.role && currentUser.role.toLowerCase() === 'admin');
  const canReassign = task && (task.assigned_to_id === currentUser.id || isAdmin);

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
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {task ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Titre de la tâche *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Préparer les conclusions pour l'affaire Martin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Détails de la tâche..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Catégorie Principale
              </label>
              <select
                name="main_category"
                value={formData.main_category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sélectionner une catégorie --</option>
                {taskCategoriesData.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tâches Associées
              </label>
              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg max-h-40 overflow-y-auto">
                {availableSubTasks.length > 0 ? (
                  availableSubTasks.map(subTask => (
                    <div key={subTask} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={subTask}
                        checked={formData.associated_tasks.includes(subTask)}
                        onCheckedChange={() => handleSubTaskChange(subTask)}
                      />
                      <Label htmlFor={subTask} className="text-slate-300 font-normal">{subTask}</Label>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">Sélectionnez d'abord une catégorie principale.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Priorité
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">🟢 Faible</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="high">🟠 Élevée</option>
                <option value="urgent">🔴 Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">En attente</option>
                <option value="seen">Vue</option>
                <option value="in-progress">En cours</option>
                <option value="completed">Terminée</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Échéance
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Dossier
              </label>
              <select
                name="case_id"
                value={formData.case_id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucun dossier</option>
                {cases && cases.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Assigné à
            </label>
            <select
              name="assigned_to_id"
              value={formData.assigned_to_id}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isAdmin && !showReassign && task && task.assigned_to_id !== currentUser.id}
            >
              <option value="">Non assigné</option>
              {teamMembers && teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          
          {canReassign && !isAdmin && !showReassign && (
            <Button type="button" variant="outline" onClick={() => setShowReassign(true)}>
              <RefreshCw className="w-4 h-4 mr-2" /> Réassigner la tâche
            </Button>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Paperclip className="w-4 h-4 inline mr-2" />
              Pièces jointes
            </label>
            <div className="flex items-center gap-4">
              <label htmlFor="file-upload" className="cursor-pointer bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                Choisir des fichiers
              </label>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} multiple />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleScan} 
                className={`flex items-center gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 ${scannerAvailable ? 'border-green-500 text-green-300' : ''}`}
                title={scannerAvailable ? 'Scanner détecté' : 'Sélectionner un document scanné'}
              >
                <ScanLine className="w-4 h-4" />
                {scannerAvailable ? '🖨️ Scanner' : 'Numériser'}
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {formData.attachments.map((path, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-slate-400 bg-slate-700/30 p-2 rounded-md">
                  <span>{path.split('/').pop()}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(path)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.filesToUpload.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-green-400 bg-green-900/30 p-2 rounded-md">
                  <span>📎 {file.name} (nouveau fichier)</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      filesToUpload: prev.filesToUpload.filter((_, i) => i !== index)
                    }));
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.scannedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-blue-400 bg-blue-900/30 p-2 rounded-md">
                  <span>📷 {file.name} (document numérisé)</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      scannedFiles: prev.scannedFiles.filter((_, i) => i !== index)
                    }));
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {task ? 'Mettre à jour' : 'Créer la tâche'}
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

export default TaskForm;
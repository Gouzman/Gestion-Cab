import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, FileText, User, Paperclip, RefreshCw, Download, ScanLine, CheckSquare, Trash2, Eye } from 'lucide-react';
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
    assigned_to_ids: [], // Multi-assignation
    visible_by_ids: [], // Visibilité
    case_id: '',
    main_category: '',
    associated_tasks: [],
    attachments: [],
    filesToUpload: [],
    scannedFiles: []
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Catégories de documents (conformité juridique)
  const documentCategories = [
    { value: 'Documents de suivi et facturation', label: 'Documents de suivi et facturation' },
    { value: 'Pièces', label: 'Pièces' },
    { value: 'Écritures', label: 'Écritures' },
    { value: 'Courriers', label: 'Courriers' },
    { value: 'Observations et notes', label: 'Observations et notes' }
  ];
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
        assigned_to_ids: task.assigned_to_ids || (task.assigned_to_id ? [task.assigned_to_id] : []),
        visible_by_ids: task.visible_by_ids || [],
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
      
      // Vérifier qu'une catégorie est sélectionnée
      if (!selectedCategory) {
        toast({
          variant: "destructive",
          title: "⚠️ Catégorie requise",
          description: "Veuillez sélectionner une catégorie de document avant d'ajouter des fichiers."
        });
        e.target.value = '';
        return;
      }
      
      // Si on édite une tâche existante, uploader immédiatement
      if (task?.id) {
        await handleImmediateUpload(newFiles, selectedCategory);
      } else {
        // Sinon, ajouter aux fichiers en attente avec leur catégorie
        const filesWithCategory = newFiles.map(file => ({
          file,
          category: selectedCategory
        }));
        setFormData(prev => ({
          ...prev,
          filesToUpload: [...prev.filesToUpload, ...filesWithCategory]
        }));
        toast({
          title: `📎 ${newFiles.length} fichier(s) ajouté(s)`,
          description: `Catégorie: ${selectedCategory} - Prêt(s) à être téléversé(s) lors de la sauvegarde.`,
        });
      }
      e.target.value = '';
    }
  };

  const handleImmediateUpload = async (files, category) => {
    if (!task?.id) {
      toast({
        variant: "destructive",
        title: "⚠️ Tâche non enregistrée",
        description: "Veuillez d'abord enregistrer la tâche avant d'ajouter des fichiers."
      });
      return;
    }

    try {
      const { uploadMultipleTaskFilesWithCategory } = await import('@/lib/uploadManager');
      
      toast({
        title: "📤 Upload en cours...",
        description: `Téléversement de ${files.length} fichier(s) avec catégorie "${category}"...`,
      });

      const uploadResult = await uploadMultipleTaskFilesWithCategory(files, task.id, currentUser?.id, category);
      
      if (uploadResult.success) {
        toast({
          title: "✅ Fichiers uploadés",
          description: `${uploadResult.data.length} fichier(s) téléversé(s) avec catégorie "${category}".`,
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
            toast({
              title: "✅ Scanner détecté",
              description: `Connexion à ${scannerDevice.label}...`,
            });

            // Utiliser le scanner si trouvé
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { 
                deviceId: { exact: scannerDevice.deviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
              }
            });
            
            // Créer une interface de capture pour le scanner
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.playsInline = true;
            
            // Interface de capture modale améliorée
            const modal = document.createElement('div');
            modal.style.cssText = `
              position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
              align-items: center; justify-content: center; z-index: 9999;
            `;
            
            const header = document.createElement('div');
            header.style.cssText = `
              color: white; font-size: 24px; font-weight: bold; margin-bottom: 20px;
            `;
            header.textContent = `🖨️ ${scannerDevice.label}`;
            
            video.style.cssText = `
              max-width: 85%; max-height: 60vh; border: 3px solid #3b82f6;
              border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            `;
            
            const instructions = document.createElement('p');
            instructions.style.cssText = `
              color: #94a3b8; font-size: 14px; margin: 15px 0; max-width: 600px; text-align: center;
            `;
            instructions.textContent = 'Placez votre document dans le scanner, puis cliquez sur "Capturer" pour numériser';
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `display: flex; gap: 15px; margin-top: 20px;`;
            
            const captureBtn = document.createElement('button');
            captureBtn.innerHTML = '📸 Capturer le document';
            captureBtn.style.cssText = `
              padding: 15px 40px; font-size: 16px; font-weight: 600;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white; border: none; border-radius: 8px;
              cursor: pointer; transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            `;
            captureBtn.onmouseover = () => {
              captureBtn.style.transform = 'scale(1.05)';
              captureBtn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
            };
            captureBtn.onmouseout = () => {
              captureBtn.style.transform = 'scale(1)';
              captureBtn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            };
            
            const cancelBtn = document.createElement('button');
            cancelBtn.innerHTML = '❌ Annuler';
            cancelBtn.style.cssText = `
              padding: 15px 30px; font-size: 16px; font-weight: 600;
              background: #475569; color: white; border: none; border-radius: 8px;
              cursor: pointer; transition: all 0.3s ease;
            `;
            cancelBtn.onmouseover = () => { cancelBtn.style.background = '#64748b'; };
            cancelBtn.onmouseout = () => { cancelBtn.style.background = '#475569'; };
            
            buttonContainer.appendChild(captureBtn);
            buttonContainer.appendChild(cancelBtn);
            
            modal.appendChild(header);
            modal.appendChild(instructions);
            modal.appendChild(video);
            modal.appendChild(buttonContainer);
            document.body.appendChild(modal);
            
            // Attendre que la vidéo soit prête
            await video.play();
            
            captureBtn.onclick = async () => {
              try {
                captureBtn.disabled = true;
                captureBtn.innerHTML = '⏳ Numérisation en cours...';
                
                // Capturer l'image depuis le flux vidéo
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Convertir en blob haute qualité
                canvas.toBlob(async (blob) => {
                  if (!blob) {
                    toast({
                      variant: "destructive",
                      title: "❌ Erreur de capture",
                      description: "Impossible de capturer l'image. Réessayez.",
                    });
                    captureBtn.disabled = false;
                    captureBtn.innerHTML = '📸 Capturer le document';
                    return;
                  }

                  const timestamp = Date.now();
                  const file = new File([blob], `scan_${timestamp}.png`, { type: 'image/png' });
                  
                  // Arrêter le flux vidéo
                  for (const track of stream.getTracks()) {
                    track.stop();
                  }
                  modal.remove();
                  
                  // Vérifier qu'une catégorie est sélectionnée
                  if (!selectedCategory) {
                    toast({
                      variant: "destructive",
                      title: "⚠️ Catégorie requise",
                      description: "Veuillez sélectionner une catégorie de document avant de numériser."
                    });
                    return;
                  }
                  
                  // Si on édite une tâche existante, uploader immédiatement
                  if (task?.id) {
                    await handleImmediateUpload([file], selectedCategory);
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      scannedFiles: [...prev.scannedFiles, { file, category: selectedCategory }]
                    }));
                    
                    toast({
                      title: "✅ Document numérisé",
                      description: `${file.name} capturé avec succès (${(blob.size / 1024).toFixed(0)} Ko) - Catégorie: ${selectedCategory}`,
                    });
                  }
                }, 'image/png', 0.95);
              } catch (captureError) {
                console.error('Erreur lors de la capture:', captureError);
                toast({
                  variant: "destructive",
                  title: "❌ Erreur",
                  description: "Échec de la numérisation. Vérifiez le scanner.",
                });
                captureBtn.disabled = false;
                captureBtn.innerHTML = '📸 Capturer le document';
              }
            };
            
            cancelBtn.onclick = () => {
              for (const track of stream.getTracks()) {
                track.stop();
              }
              modal.remove();
              toast({
                title: "Numérisation annulée",
                description: "Opération interrompue par l'utilisateur",
              });
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
                Catégorie tâche
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
                Statut tâche
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
              Assigné à (multi-sélection)
            </label>
            <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg max-h-48 overflow-y-auto space-y-2">
              {teamMembers && teamMembers.length > 0 ? (
                teamMembers.map(member => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assign-${member.id}`}
                      checked={formData.assigned_to_ids.includes(member.id)}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          assigned_to_ids: checked
                            ? [...prev.assigned_to_ids, member.id]
                            : prev.assigned_to_ids.filter(id => id !== member.id),
                          // Garder la compatibilité avec assigned_to_id (premier sélectionné)
                          assigned_to_id: checked && prev.assigned_to_ids.length === 0
                            ? member.id
                            : (prev.assigned_to_ids.filter(id => id !== member.id)[0] || '')
                        }));
                      }}
                      disabled={!isAdmin && !showReassign && task && task.assigned_to_id !== currentUser.id}
                    />
                    <Label 
                      htmlFor={`assign-${member.id}`} 
                      className="text-slate-300 font-normal cursor-pointer flex-1"
                    >
                      {member.name}
                      {member.role && (
                        <span className="ml-2 text-xs text-slate-500">({member.role})</span>
                      )}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">Aucun membre d'équipe disponible</p>
              )}
            </div>
            {formData.assigned_to_ids.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.assigned_to_ids.map(id => {
                  const member = teamMembers.find(m => m.id === id);
                  return member ? (
                    <span key={id} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {member.name}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            assigned_to_ids: prev.assigned_to_ids.filter(aid => aid !== id),
                            assigned_to_id: prev.assigned_to_ids.filter(aid => aid !== id)[0] || ''
                          }));
                        }}
                        className="ml-2 text-blue-300 hover:text-blue-100"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
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
            
            {/* Sélection de catégorie OBLIGATOIRE */}
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <label className="block text-sm font-medium text-blue-300 mb-2">
                📁 Catégorie du document *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sélectionner une catégorie --</option>
                {documentCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-400">
                ⚠️ La catégorie est obligatoire pour tous les documents ajoutés à cette tâche.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Bouton 1: Choisir des fichiers (sélecteur interne) */}
              <label 
                htmlFor="file-internal" 
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg px-4 py-3 text-white font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Choisir des fichiers
              </label>
              <input 
                id="file-internal" 
                type="file" 
                className="sr-only" 
                onChange={handleFileChange} 
                multiple 
              />
              
              {/* Bouton 2: Numériser (scanner) */}
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleScan} 
                className={`flex items-center justify-center gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 ${
                  scannerAvailable ? 'border-green-500 text-green-300 bg-green-500/10' : ''
                }`}
                title={scannerAvailable ? 'Scanner détecté - Cliquez pour numériser' : 'Numériser un document'}
              >
                <ScanLine className="w-4 h-4" />
                {scannerAvailable ? '🖨️ Numériser (Scanner actif)' : '🖨️ Numériser'}
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
              {formData.filesToUpload.map((fileObj, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-green-400 bg-green-900/30 p-2 rounded-md">
                  <div className="flex-1">
                    <div>📎 {fileObj.file.name}</div>
                    <div className="text-xs text-blue-300 mt-1">🏷️ {fileObj.category}</div>
                  </div>
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
              {formData.scannedFiles.map((fileObj, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-blue-400 bg-blue-900/30 p-2 rounded-md">
                  <div className="flex-1">
                    <div>📷 {fileObj.file.name}</div>
                    <div className="text-xs text-blue-300 mt-1">🏷️ {fileObj.category}</div>
                  </div>
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

          {/* Champ Visible par */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Eye className="w-4 h-4 inline mr-2" />
              Visible par (permissions de consultation)
            </label>
            <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg max-h-48 overflow-y-auto space-y-2">
              {teamMembers && teamMembers.length > 0 ? (
                <>
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-600">
                    <Checkbox
                      id="visible-all"
                      checked={formData.visible_by_ids.length === teamMembers.length}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          visible_by_ids: checked ? teamMembers.map(m => m.id) : []
                        }));
                      }}
                    />
                    <Label 
                      htmlFor="visible-all" 
                      className="text-slate-300 font-semibold cursor-pointer flex-1"
                    >
                      Tous les membres
                    </Label>
                  </div>
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`visible-${member.id}`}
                        checked={formData.visible_by_ids.includes(member.id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            visible_by_ids: checked
                              ? [...prev.visible_by_ids, member.id]
                              : prev.visible_by_ids.filter(id => id !== member.id)
                          }));
                        }}
                      />
                      <Label 
                        htmlFor={`visible-${member.id}`} 
                        className="text-slate-300 font-normal cursor-pointer flex-1"
                      >
                        {member.name}
                        {member.role && (
                          <span className="ml-2 text-xs text-slate-500">({member.role})</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-slate-400 text-sm">Aucun membre d'équipe disponible</p>
              )}
            </div>
            {formData.visible_by_ids.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.visible_by_ids.map(id => {
                  const member = teamMembers.find(m => m.id === id);
                  return member ? (
                    <span key={id} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                      <Eye className="w-3 h-3 mr-1" />
                      {member.name}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            visible_by_ids: prev.visible_by_ids.filter(vid => vid !== id)
                          }));
                        }}
                        className="ml-2 text-green-300 hover:text-green-100"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">
              🔒 Sélectionnez les personnes autorisées à consulter cette tâche. Les administrateurs ont toujours accès.
            </p>
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
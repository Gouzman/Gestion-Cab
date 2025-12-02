import React, { useState, useEffect, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { FileArchive, Search, Eye, Trash2, Download, Upload, FolderOpen, FileText, Folder, Share2 } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { downloadFileWithCors } from '@/lib/fetchWithCors';
    import DocumentUploadModal from '@/components/DocumentUploadModal';
    import TransferToTaskModal from '@/components/TransferToTaskModal';
    import { cleanFileNameForDownload } from '@/lib/filePreviewUtils';

    const DocumentManager = ({ currentUser }) => {
      const [documents, setDocuments] = useState([]);
      const [searchTerm, setSearchTerm] = useState('');
      const [profile, setProfile] = useState(null);
      const [showUploadModal, setShowUploadModal] = useState(false);
      const [showTransferModal, setShowTransferModal] = useState(false);
      const [selectedDocumentForTransfer, setSelectedDocumentForTransfer] = useState(null);
      const [selectedCategory, setSelectedCategory] = useState('all');

      const isAdmin = currentUser && (currentUser.function === 'Gerant' || currentUser.function === 'Associe Emerite' || (currentUser.role && currentUser.role.toLowerCase() === 'admin'));

      // Catégories de documents
      const categories = [
        { id: 'all', label: 'Tous les documents', icon: FileText },
        { id: 'Documents de suivi et facturation', label: 'Documents de suivi et facturation', icon: Folder },
        { id: 'Pièces', label: 'Pièces', icon: Folder },
        { id: 'Écritures', label: 'Écritures', icon: Folder },
        { id: 'Courriers', label: 'Courriers', icon: Folder },
        { id: 'Observations et notes', label: 'Observations et notes', icon: Folder },
        { id: 'Autres', label: 'Autres', icon: Folder }
      ];

      useEffect(() => {
        const fetchProfile = async () => {
          const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
          setProfile(data);
        };
        fetchProfile();
      }, [currentUser]);

      useEffect(() => {
        const fetchDocuments = async () => {
          try {
            // Récupérer TOUS les fichiers (incluant task_id ET case_id)
            const { data: filesData, error } = await supabase
              .from('tasks_files')
              .select(`
                id,
                file_name,
                file_url,
                file_type,
                file_size,
                document_category,
                created_at,
                task_id,
                case_id,
                created_by
              `)
              .order('created_at', { ascending: false });

            console.log('📂 Documents chargés:', filesData);

            if (error) {
              console.error('Erreur lors de la récupération des documents:', error);
              if (error.code === 'PGRST204' || error.code === 'PGRST116') {
                console.warn('⚠️ La table tasks_files n\'existe pas encore');
              }
              setDocuments([]);
              return;
            }

            // Récupérer les infos des dossiers (cases) pour enrichir l'affichage
            const caseIds = [...new Set(filesData.filter(f => f.case_id).map(f => f.case_id))];
            let casesMap = {};
            
            if (caseIds.length > 0) {
              const { data: casesData } = await supabase
                .from('cases')
                .select('id, title')
                .in('id', caseIds);
              
              if (casesData) {
                casesMap = casesData.reduce((acc, c) => {
                  acc[c.id] = c.title;
                  return acc;
                }, {});
              }
            }

            // Récupérer les infos des tâches pour ceux qui ont un task_id
            const taskIds = [...new Set(filesData.filter(f => f.task_id).map(f => f.task_id))];
            let tasksMap = {};
            
            if (taskIds.length > 0) {
              const { data: tasksData } = await supabase
                .from('tasks')
                .select('id, title')
                .in('id', taskIds);
              
              if (tasksData) {
                tasksMap = tasksData.reduce((acc, t) => {
                  acc[t.id] = t.title;
                  return acc;
                }, {});
              }
            }

            // Récupérer les infos des utilisateurs pour l'auteur
            const userIds = [...new Set(filesData.filter(f => f.created_by).map(f => f.created_by))];
            let usersMap = {};
            
            if (userIds.length > 0) {
              const { data: usersData } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', userIds);
              
              if (usersData) {
                usersMap = usersData.reduce((acc, u) => {
                  acc[u.id] = u.name;
                  return acc;
                }, {});
              }
            }

            // Transformer les données pour l'affichage avec enrichissement case/task
            const allDocs = (filesData || []).map(file => {
              let linkedTo = 'Documents sans tâche';
              let source = 'standalone';
              let caseTitle = null;
              
              if (file.task_id && file.case_id) {
                // Document lié à une tâche ET un dossier - afficher la tâche
                linkedTo = tasksMap[file.task_id] || 'Tâche supprimée';
                caseTitle = casesMap[file.case_id] || null;
                source = 'task-and-case';
              } else if (file.task_id) {
                // Document lié uniquement à une tâche
                linkedTo = tasksMap[file.task_id] || 'Tâche supprimée';
                source = 'task';
              } else if (file.case_id) {
                // Document lié uniquement à un dossier
                linkedTo = casesMap[file.case_id] || 'Dossier supprimé';
                caseTitle = casesMap[file.case_id] || null;
                source = 'case';
              }
              
              return {
                id: file.id,
                name: file.file_name,
                path: file.file_url,
                url: file.file_url,
                taskTitle: linkedTo,
                taskId: file.task_id,
                caseId: file.case_id,
                caseTitle: caseTitle,
                source: source,
                date: file.created_at,
                fileType: file.file_type,
                fileSize: file.file_size,
                category: file.document_category,
                createdBy: file.created_by,
                createdByName: usersMap[file.created_by] || null,
                timeSpent: 0,
              };
            });
            
            // Dédupliquer par file_url (garder la version la plus récente)
            const uniqueDocs = Array.from(
              new Map(allDocs.map(doc => [doc.url, doc])).values()
            );
            
            console.log(`✅ ${uniqueDocs.length} document(s) unique(s) chargé(s)`);
            setDocuments(uniqueDocs);
            
          } catch (fetchError) {
            console.error('Erreur lors de la récupération des documents:', fetchError);
            setDocuments([]);
          }
        };
        
        if (profile) {
          fetchDocuments();
        }
      }, [currentUser, profile, isAdmin]);

      const handleDownload = async (url, name) => {
        if (!url || !url.startsWith('http')) {
          toast({ 
            variant: "destructive", 
            title: "Erreur", 
            description: "URL du fichier invalide." 
          });
          return;
        }
        
        try {
          // Valider que l'URL est bien formée
          new URL(url);
          
          console.log('🔽 Téléchargement depuis DocumentManager:', name);
          
          // Télécharger via l'URL publique avec headers CORS
          const blob = await downloadFileWithCors(url);
          
          // Vérifier que le blob n'est pas vide
          if (!blob || blob.size === 0) {
            console.error('❌ Blob vide reçu');
            toast({ 
              variant: "destructive", 
              title: "Erreur", 
              description: "Le fichier téléchargé est vide ou corrompu." 
            });
            return;
          }
          
          console.log('✅ Blob reçu:', {
            size: blob.size,
            type: blob.type,
            name: name
          });
          
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          // Nettoyer le nom du fichier lors du téléchargement
          const cleanedName = cleanFileNameForDownload(name);
          a.download = cleanedName;
          
          console.log(`📥 Téléchargement: "${name}" → "${cleanedName}"`);
          
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
        } catch (error) {
          console.error('❌ Erreur lors du téléchargement:', error);
          toast({ 
            variant: "destructive", 
            title: "Erreur", 
            description: "Impossible de télécharger le fichier." 
          });
        }
      };

      const handlePreview = (url) => {
        if (url && url.startsWith('http')) {
          // Forcer l'aperçu en ajoutant le paramètre download vide
          const previewUrl = url.includes('?') 
            ? `${url}&download=` 
            : `${url}?download=`;
          window.open(previewUrl, '_blank', 'noopener,noreferrer');
        } else {
          toast({ 
            variant: "destructive", 
            title: "Erreur", 
            description: "URL du fichier invalide." 
          });
        }
      };

      const handleDelete = async (doc) => {
        try {
          // Supprimer de la table tasks_files
          const { error: dbError } = await supabase
            .from('tasks_files')
            .delete()
            .eq('id', doc.id);

          if (dbError) {
            toast({ 
              variant: "destructive", 
              title: "Erreur", 
              description: "Impossible de supprimer le fichier." 
            });
            return;
          }

          // Mettre à jour l'état local
          setDocuments(documents.filter(d => d.id !== doc.id));
          toast({ 
            title: "🗑️ Document supprimé", 
            description: `${doc.name} a été supprimé.` 
          });
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          toast({ 
            variant: "destructive", 
            title: "Erreur", 
            description: "Impossible de supprimer le fichier." 
          });
        }
      };

      const handleDocumentUploaded = async (newDoc) => {
        console.log('🔄 Rafraîchissement après upload:', newDoc);
        
        // Récupérer le titre du dossier si associé
        let taskTitle = 'Document indépendant';
        if (newDoc.task_id) {
          const { data: caseData } = await supabase
            .from('cases')
            .select('title')
            .eq('id', newDoc.task_id)
            .single();
          
          if (caseData) {
            taskTitle = caseData.title;
          }
        }

        // Ajouter le nouveau document en haut de la liste
        const newDocument = {
          id: newDoc.id,
          name: newDoc.file_name,
          path: newDoc.file_url,
          url: newDoc.file_url,
          taskTitle: taskTitle,
          taskId: newDoc.task_id,
          date: newDoc.created_at,
          fileType: newDoc.file_type,
          fileSize: newDoc.file_size,
          category: newDoc.document_category,
          timeSpent: 0,
        };

        setDocuments(prev => [newDocument, ...prev]);
      };

      // Calcul des compteurs de documents par catégorie
      const categoryCounts = useMemo(() => {
        const counts = { all: documents.length };
        
        // Initialiser tous les compteurs à 0
        categories.forEach(cat => {
          if (cat.id !== 'all') {
            counts[cat.id] = 0;
          }
        });
        
        // Compter les documents par catégorie
        documents.forEach(doc => {
          if (doc.category) {
            counts[doc.category] = (counts[doc.category] || 0) + 1;
          } else {
            // Documents sans catégorie vont dans "Autres"
            counts['Autres'] = (counts['Autres'] || 0) + 1;
          }
        });
        
        return counts;
      }, [documents, categories]);

      const filteredDocuments = documents.filter(doc => {
        const matchesSearch = (doc.name && doc.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (doc.taskTitle && doc.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (selectedCategory === 'all') return matchesSearch;
        
        // Filtre spécial pour "Autres" : documents sans catégorie ou avec catégorie "Autres"
        if (selectedCategory === 'Autres') {
          return matchesSearch && (!doc.category || doc.category === 'Autres');
        }
        
        return matchesSearch && doc.category === selectedCategory;
      });

      // Regrouper les documents par tâche
      const documentsByTask = filteredDocuments.reduce((acc, doc) => {
        const taskKey = doc.taskId || 'no-task';
        if (!acc[taskKey]) {
          acc[taskKey] = {
            taskTitle: doc.taskTitle || `Tâche #${doc.taskId}`,
            taskId: doc.taskId,
            files: []
          };
        }
        acc[taskKey].files.push(doc);
        return acc;
      }, {});

      const taskGroups = Object.values(documentsByTask);

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Gestion des Documents</h1>
              <p className="text-slate-400">Retrouvez tous les fichiers liés à vos tâches</p>
            </div>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Transférer Document
            </Button>
          </div>

          {/* Layout avec catégories à gauche et documents à droite */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Colonne de gauche : Catégories */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Type de Document
                </h3>
                <div className="space-y-2">
                  {categories.map(cat => {
                    const count = categoryCounts[cat.id] || 0;
                    const isActive = selectedCategory === cat.id;
                    
                    // Ne pas afficher les catégories vides (sauf "Tous les documents")
                    if (cat.id !== 'all' && count === 0) return null;
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-semibold'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <cat.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-sm">{cat.label}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isActive 
                            ? 'bg-white/20 text-white font-semibold' 
                            : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Colonne de droite : Liste des documents */}
            <div className="lg:col-span-3 space-y-4">
              {/* Barre de recherche */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher un document par nom ou par tâche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Liste des documents en grille de cartes */}
              {filteredDocuments.length === 0 ? (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
                  <FileArchive className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucun document trouvé</h3>
                  <p className="text-slate-500">Les fichiers que vous joignez aux tâches apparaîtront ici.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredDocuments.map((doc, index) => {
                    // Tronquer le nom si trop long
                    const truncateName = (name) => {
                      if (!name) return 'Document';
                      if (name.length <= 40) return name;
                      const lastDot = name.lastIndexOf('.');
                      if (lastDot === -1) return name.substring(0, 37) + '...';
                      const ext = name.substring(lastDot);
                      const baseName = name.substring(0, lastDot);
                      return baseName.substring(0, 37 - ext.length) + '...' + ext;
                    };

                    // Formater la taille du fichier
                    const formatFileSize = (bytes) => {
                      if (!bytes) return '';
                      const mo = bytes / (1024 * 1024);
                      const ko = bytes / 1024;
                      return mo >= 1 ? `${mo.toFixed(1)} Mo` : `${Math.round(ko)} Ko`;
                    };

                    // Récupérer la référence du dossier
                    const getCaseReference = () => {
                      if (doc.caseTitle) {
                        return doc.caseTitle;
                      }
                      if (doc.taskId) {
                        return doc.taskTitle; // Afficher le nom de la tâche
                      }
                      return 'Sans dossier';
                    };

                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all"
                      >
                        {/* En-tête de la carte avec icône */}
                        <div className="p-6 pb-4">
                          <div className="flex items-start gap-4">
                            {/* Icône de document */}
                            <div className="flex-shrink-0">
                              <div className="w-14 h-14 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-7 h-7 text-blue-400" />
                              </div>
                            </div>
                            
                            {/* Informations du document */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-white mb-2 break-words" title={doc.name}>
                                {truncateName(doc.name)}
                              </h3>
                              
                              {/* Référence du dossier/tâche */}
                              <div className="text-sm text-slate-400 mb-1 font-medium">
                                {getCaseReference()}
                              </div>
                              
                              {/* Métadonnées */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2">
                                {doc.fileSize && (
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                )}
                                <span>•</span>
                                <span>{new Date(doc.date).toLocaleDateString('fr-FR')}</span>
                              </div>
                              
                              {/* Auteur */}
                              {doc.createdByName && (
                                <div className="text-xs text-slate-500 mb-2">
                                  Par {doc.createdByName}
                                </div>
                              )}
                              
                              {/* Badges : Type de Document et Statut */}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {doc.category && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                    {doc.category}
                                  </span>
                                )}
                                {doc.taskId && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                    Lié à une tâche
                                  </span>
                                )}
                                {doc.caseId && !doc.taskId && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-600/30 text-slate-400 text-xs rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    Document de dossier
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pied de carte : Actions */}
                        <div className="px-6 py-4 bg-slate-700/30 border-t border-slate-700/50 flex items-center justify-center gap-2 flex-wrap">
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(doc.url)} 
                            className="text-slate-300 hover:text-white hover:bg-slate-600/50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc.url, doc.name)} 
                            className="text-slate-300 hover:text-white hover:bg-slate-600/50"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                          </Button>
                          {doc.caseId && (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDocumentForTransfer(doc);
                                setShowTransferModal(true);
                              }} 
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Transférer vers tâche
                            </Button>
                          )}
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Voulez-vous vraiment supprimer le document "${doc.name}" ?\n\nCette action est irréversible.`)) {
                                handleDelete(doc);
                              }
                            }} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal d'upload de document */}
          {showUploadModal && (
            <DocumentUploadModal
              currentUser={currentUser}
              onCancel={() => setShowUploadModal(false)}
              onDocumentUploaded={handleDocumentUploaded}
            />
          )}

          {/* Modal de transfert vers tâche */}
          {showTransferModal && selectedDocumentForTransfer && (
            <TransferToTaskModal
              document={selectedDocumentForTransfer}
              onCancel={() => {
                setShowTransferModal(false);
                setSelectedDocumentForTransfer(null);
              }}
              onTransferred={() => {
                // Recharger les documents pour afficher les changements
                window.location.reload();
              }}
            />
          )}
        </div>
      );
    };

    export default DocumentManager;
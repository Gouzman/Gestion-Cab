import React, { useState, useEffect, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { FileArchive, Search, Eye, Trash2, Download, Upload, FolderOpen, FileText, Folder } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { downloadFileWithCors } from '@/lib/fetchWithCors';
    import DocumentUploadModal from '@/components/DocumentUploadModal';

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

    const DocumentManager = ({ currentUser }) => {
      const [documents, setDocuments] = useState([]);
      const [searchTerm, setSearchTerm] = useState('');
      const [profile, setProfile] = useState(null);
      const [showUploadModal, setShowUploadModal] = useState(false);
      const [selectedCategory, setSelectedCategory] = useState('all');

      const isAdmin = currentUser && (currentUser.function === 'Gerant' || currentUser.function === 'Associe Emerite' || (currentUser.role && currentUser.role.toLowerCase() === 'admin'));

      // Catégories de documents
      const categories = [
        { id: 'all', label: 'Tous les documents', icon: FileText },
        { id: 'contrat', label: 'Contrats', icon: Folder },
        { id: 'facture', label: 'Factures', icon: Folder },
        { id: 'correspondance', label: 'Correspondance', icon: Folder },
        { id: 'procedure', label: 'Procédures', icon: Folder },
        { id: 'piece_identite', label: 'Pièces d\'identité', icon: Folder },
        { id: 'attestation', label: 'Attestations', icon: Folder },
        { id: 'autre', label: 'Autres', icon: Folder }
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

            // Transformer les données pour l'affichage avec enrichissement case/task
            const allDocs = (filesData || []).map(file => {
              let linkedTo = 'Document indépendant';
              let source = 'standalone';
              
              if (file.task_id && file.case_id) {
                // Document lié à une tâche ET un dossier
                linkedTo = `Tâche: ${tasksMap[file.task_id] || 'Supprimée'} | Dossier: ${casesMap[file.case_id] || 'Supprimé'}`;
                source = 'task-and-case';
              } else if (file.task_id) {
                // Document lié uniquement à une tâche
                linkedTo = `Tâche: ${tasksMap[file.task_id] || 'Tâche supprimée'}`;
                source = 'task';
              } else if (file.case_id) {
                // Document lié uniquement à un dossier
                linkedTo = `Dossier: ${casesMap[file.case_id] || 'Dossier supprimé'}`;
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
                source: source,
                date: file.created_at,
                fileType: file.file_type,
                fileSize: file.file_size,
                category: file.document_category,
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
        
        documents.forEach(doc => {
          const category = doc.category || 'autre';
          counts[category] = (counts[category] || 0) + 1;
        });
        
        return counts;
      }, [documents]);

      const filteredDocuments = documents.filter(doc => {
        const matchesSearch = (doc.name && doc.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (doc.taskTitle && doc.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (selectedCategory === 'all') return matchesSearch;
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
                  Catégories
                </h3>
                <div className="space-y-2">
                  {categories.map(cat => {
                    const count = categoryCounts[cat.id] || 0;
                    const isActive = selectedCategory === cat.id;
                    
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

              {/* Liste des documents */}
              {taskGroups.length === 0 ? (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
                  <FileArchive className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucun document trouvé</h3>
                  <p className="text-slate-500">Les fichiers que vous joignez aux tâches apparaîtront ici.</p>
                </div>
              ) : (
                <div className="space-y-4">
              {taskGroups.map((group, groupIndex) => (
                <motion.div
                  key={group.taskId || groupIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden"
                >
                  {/* En-tête de la tâche */}
                  <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FileArchive className="w-5 h-5 text-blue-400" />
                      {group.taskTitle}
                      <span className="text-sm font-normal text-slate-400 ml-2">
                        ({group.files.length} document{group.files.length > 1 ? 's' : ''})
                      </span>
                    </h3>
                  </div>

                  {/* Liste des fichiers */}
                  <table className="w-full text-left">
                    <thead className="bg-slate-700/30">
                      <tr>
                        <th className="p-4 text-slate-300 font-medium">Nom du Fichier</th>
                        <th className="p-4 text-slate-300 font-medium">Date d'ajout</th>
                        <th className="p-4 text-slate-300 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.files.map((doc, fileIndex) => (
                        <motion.tr
                          key={doc.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: fileIndex * 0.05 }}
                          className="border-b border-slate-800 hover:bg-slate-700/20"
                        >
                          <td className=\"p-4\">
                            <div className=\"text-white font-medium\">{doc.name}</div>
                            <div className={`text-xs mt-1 flex items-center gap-1 ${doc.category ? 'text-blue-400' : 'text-slate-500'}`}>
                              <span className={`inline-block w-2 h-2 rounded-full ${doc.category ? 'bg-blue-400' : 'bg-slate-500'}`}></span>
                              {doc.category || 'Non classé'}
                            </div>
                          </td>
                          <td className="p-4 text-slate-400">{new Date(doc.date).toLocaleDateString('fr-FR')}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handlePreview(doc.url)} 
                                title="Aperçu"
                              >
                                <Eye className="w-4 h-4 text-slate-400" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDownload(doc.url, doc.name)} 
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4 text-slate-400" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  if (window.confirm(`Voulez-vous vraiment supprimer le document "${doc.name}" ?\n\nCette action est irréversible.`)) {
                                    handleDelete(doc);
                                  }
                                }} 
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal de transfert de document */}
          {showUploadModal && (
            <DocumentUploadModal
              currentUser={currentUser}
              onCancel={() => setShowUploadModal(false)}
              onDocumentUploaded={handleDocumentUploaded}
            />
          )}
        </div>
      );
    };

    export default DocumentManager;
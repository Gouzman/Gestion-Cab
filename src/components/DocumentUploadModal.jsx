import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const DocumentUploadModal = ({ currentUser, onCancel, onDocumentUploaded }) => {
  const [formData, setFormData] = useState({
    document_reference: '',
    linked_case_id: '',
    category: '',
    description: '',
    file: null
  });
  const [cases, setCases] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Catégories de documents (cohérence avec DocumentManager et TaskForm)
  const categories = [
    { value: 'Documents de suivi et facturation', label: 'Documents de suivi et facturation' },
    { value: 'Pièces', label: 'Pièces' },
    { value: 'Écritures', label: 'Écritures' },
    { value: 'Courriers', label: 'Courriers' },
    { value: 'Observations et notes', label: 'Observations et notes' },
    { value: 'Autres', label: 'Autres' }
  ];

  useEffect(() => {
    const fetchCases = async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, title')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erreur chargement dossiers:', error);
      } else {
        setCases(data || []);
      }
    };
    fetchCases();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (file) => {
    // Validation du fichier
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
    const maxSize = 10 * 1024 * 1024; // 10 Mo

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Format non autorisé',
        description: 'Seuls les formats PDF, DOCX, PNG et JPG sont acceptés.'
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Fichier trop volumineux',
        description: 'La taille maximale autorisée est de 10 Mo.'
      });
      return;
    }

    setFormData(prev => ({ ...prev, file }));
    toast({
      title: '📎 Fichier sélectionné',
      description: file.name
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.document_reference.trim()) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'La référence du document est obligatoire.'
      });
      return;
    }

    if (!formData.category) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'Veuillez sélectionner une catégorie.'
      });
      return;
    }

    if (!formData.file) {
      toast({
        variant: 'destructive',
        title: 'Fichier manquant',
        description: 'Veuillez sélectionner un fichier à transférer.'
      });
      return;
    }

    try {
      // 1. Upload du fichier vers Supabase Storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Lire le fichier comme ArrayBuffer pour un upload propre
      const fileBuffer = await formData.file.arrayBuffer();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: formData.file.type
        });

      if (uploadError) {
        console.error('Erreur upload storage:', uploadError);
        
        // Message d'erreur plus détaillé selon le type d'erreur
        let errorMessage = 'Impossible de téléverser le fichier vers le stockage.';
        if (uploadError.message?.includes('Bucket not found')) {
          errorMessage = 'Le bucket de stockage "task-files" n\'existe pas. Veuillez le créer dans Supabase Storage.';
        } else if (uploadError.message?.includes('new row violates')) {
          errorMessage = 'Erreur de permissions. Vérifiez les politiques RLS du bucket.';
        }
        
        toast({
          variant: 'destructive',
          title: 'Erreur d\'upload',
          description: errorMessage
        });
        return;
      }

      // 2. Obtenir l'URL publique du fichier
      const { data: { publicUrl } } = supabase.storage
        .from('task-files')
        .getPublicUrl(filePath);

      // 3. Enregistrer les métadonnées dans tasks_files
      // ✅ Utilisation correcte : case_id pour dossier, task_id reste null (documents généraux)
      const payload = {
        task_id: null, // Pas de tâche spécifique pour les documents généraux du module Documents
        case_id: formData.linked_case_id || null, // Lié à un dossier (case) si sélectionné
        file_name: formData.file.name,
        file_url: publicUrl,
        file_type: formData.file.type,
        file_size: formData.file.size,
        document_category: formData.category, // Nouvelle colonne des catégories
        created_by: currentUser.id
      };

      const { data: dbData, error: dbError } = await supabase
        .from('tasks_files')
        .insert([payload])
        .select()
        .single();

      if (dbError) {
        console.error('Erreur sauvegarde DB:', dbError);
        
        // Nettoyer le fichier uploadé si la sauvegarde échoue
        await supabase.storage.from('task-files').remove([filePath]);
        
        toast({
          variant: 'destructive',
          title: 'Erreur de sauvegarde',
          description: 'Impossible d\'enregistrer les métadonnées du document.'
        });
        return;
      }

      console.log('✅ Document uploadé avec succès:', dbData);

      toast({
        title: '✅ Document transféré',
        description: `"${formData.file.name}" a été ajouté avec succès.`
      });

      // Rafraîchir la liste des documents
      if (onDocumentUploaded) {
        onDocumentUploaded(dbData);
      }
      
      onCancel();
    } catch (error) {
      console.error('Erreur transfert document:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de transférer le document.'
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Transférer un document</h2>
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
          {/* Zone de drag & drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-slate-600 bg-slate-700/30'
            }`}
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 mb-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium"
              >
                Cliquez pour transférer
              </button>
              {' '}ou glissez-déposez
            </p>
            <p className="text-sm text-slate-400">
              PDF, DOCX, PNG, JPG (MAX. 10MB)
            </p>
            {formData.file && (
              <p className="mt-3 text-sm text-green-400 font-medium">
                ✓ {formData.file.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Réf. Document (manuel) */}
            <div>
              <label htmlFor="document-reference" className="block text-sm font-medium text-slate-300 mb-2">
                Réf. Document *
              </label>
              <input
                type="text"
                id="document-reference"
                name="document_reference"
                value={formData.document_reference}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Référence interne"
              />
            </div>

            {/* Dossier associé */}
            <div>
              <label htmlFor="linked-case" className="block text-sm font-medium text-slate-300 mb-2">
                Dossier associé
              </label>
              <select
                id="linked-case"
                name="linked_case_id"
                value={formData.linked_case_id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choisir un dossier...</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
              Catégorie *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sélectionner une catégorie...</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ajouter une brève description du document..."
            />
          </div>

          {/* Input caché pour le fichier */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.png,.jpg,.jpeg"
            onChange={handleFileInputChange}
          />

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              Transférer
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default DocumentUploadModal;

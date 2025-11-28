import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Search, FileText, FolderOpen } from 'lucide-react';
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
  const [filteredCases, setFilteredCases] = useState([]);
  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const fileInputLocalRef = useRef(null);

  // Catégories de documents
  const categories = [
    { value: 'contrat', label: 'Contrat' },
    { value: 'facture', label: 'Facture' },
    { value: 'correspondance', label: 'Correspondance' },
    { value: 'procedure', label: 'Procédure' },
    { value: 'piece_identite', label: 'Pièce d\'identité' },
    { value: 'attestation', label: 'Attestation' },
    { value: 'autre', label: 'Autre' }
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
        setFilteredCases(data || []);
      }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    if (caseSearchTerm.trim() === '') {
      setFilteredCases(cases);
    } else {
      const filtered = cases.filter(c => 
        (c.title && c.title.toLowerCase().includes(caseSearchTerm.toLowerCase())) ||
        (c.id && c.id.toLowerCase().includes(caseSearchTerm.toLowerCase()))
      );
      setFilteredCases(filtered);
    }
  }, [caseSearchTerm, cases]);

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
      // Ici, vous pouvez implémenter la logique d'upload vers Supabase Storage
      // Pour l'instant, on simule juste la sauvegarde des métadonnées
      
      const payload = {
        document_reference: formData.document_reference,
        linked_case_id: formData.linked_case_id || null,
        category: formData.category,
        description: formData.description,
        file_name: formData.file.name,
        file_size: formData.file.size,
        file_type: formData.file.type,
        uploaded_by: currentUser.id,
        created_at: new Date().toISOString()
      };

      console.log('Document payload:', payload);

      toast({
        title: '✅ Document transféré',
        description: `"${formData.file.name}" a été ajouté avec succès.`
      });

      if (onDocumentUploaded) {
        onDocumentUploaded(payload);
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
        className="bg-white rounded-xl p-6 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Transférer un document</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-800"
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
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 bg-slate-50'
            }`}
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-1">
              <button
                type="button"
                onClick={() => fileInputLocalRef.current?.click()}
                className="text-blue-600 hover:underline font-medium"
              >
                Cliquez pour transférer
              </button>
              {' '}ou glissez-déposez
            </p>
            <p className="text-sm text-slate-500">
              PDF, DOCX, PNG, JPG (MAX. 10MB)
            </p>
            {formData.file && (
              <p className="mt-3 text-sm text-green-600 font-medium">
                ✓ {formData.file.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Réf. Document (manuel) */}
            <div>
              <label htmlFor="document-reference" className="block text-sm font-medium text-slate-700 mb-2">
                Réf. Document *
              </label>
              <input
                type="text"
                id="document-reference"
                name="document_reference"
                value={formData.document_reference}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Référence interne"
              />
            </div>

            {/* Dossier associé */}
            <div>
              <label htmlFor="linked-case" className="block text-sm font-medium text-slate-700 mb-2">
                Dossier associé
              </label>
              <div className="relative">
                <select
                  id="linked-case"
                  name="linked_case_id"
                  value={formData.linked_case_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">Choisir un dossier...</option>
                  {filteredCases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.title}
                    </option>
                  ))}
                </select>
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recherche dossier */}
            <div>
              <input
                type="text"
                placeholder="Rechercher un dossier..."
                value={caseSearchTerm}
                onChange={(e) => setCaseSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                Catégorie *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une catégorie...</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ajouter une brève description du document..."
            />
          </div>

          {/* Boutons double mode d'import */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Choisir des fichiers
            </button>
            <button
              type="button"
              onClick={() => fileInputLocalRef.current?.click()}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Importer fichier
            </button>
          </div>

          {/* Inputs cachés pour les fichiers */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.png,.jpg,.jpeg"
            onChange={handleFileInputChange}
          />
          <input
            ref={fileInputLocalRef}
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
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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

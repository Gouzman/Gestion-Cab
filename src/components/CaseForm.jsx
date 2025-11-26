import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { X, FileText, User, Calendar, Paperclip, Timer, Eye, ScanLine, Users } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';

    const formatCurrency = (value) => {
      if (!value) return '';
      const numberValue = Number(String(value).replace(/[^0-9]/g, ''));
      return new Intl.NumberFormat('fr-FR').format(numberValue);
    };

    const parseCurrency = (value) => {
      if (!value) return 0;
      return Number(String(value).replace(/[^0-9]/g, ''));
    };

    const CaseForm = ({ case: caseData, onSubmit, onCancel, currentUser }) => {
  const [formData, setFormData] = useState({
    case_reference: '',
    title: '',
    client_id: '',
    client_type: 'particulier',
    client: '',
    opposing_party: '',
    description: '',
    case_type: 'civil',
    type: 'civil',
    status: 'en-cours',
    priority: 'medium',
    startDate: '',
    expectedEndDate: '',
    honoraire: '',
    timeSpent: 0,
    notes: '',
    attachments: [],
    authorized_users: []
  });
  const [teamMembers, setTeamMembers] = useState([]);
  
  useEffect(() => {
        const fetchCollaborators = async () => {
          const { data, error } = await supabase.from('profiles').select('id, name, role');
          // Filtrer pour exclure les comptes admin
          const filteredData = (data || []).filter(member => member.role !== 'admin');
          if (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les membres de l'équipe." });
          } else {
            setTeamMembers(filteredData.filter(m => m.id !== currentUser.id));
          }
        };
        fetchCollaborators();
      }, [currentUser.id]);

      useEffect(() => {
        if (caseData) {
          setFormData({
            case_reference: caseData.case_reference || '',
            title: caseData.title || '',
            client_id: caseData.client_id || '',
            client_type: caseData.client_type || 'particulier',
            client: caseData.client || '',
            opposing_party: caseData.opposing_party || '',
            description: caseData.description || '',
            case_type: caseData.case_type || caseData.type || 'civil',
            type: caseData.type || 'civil',
            status: caseData.status || 'en-cours',
            priority: caseData.priority || 'medium',
            startDate: caseData.startDate || '',
            expectedEndDate: caseData.expectedEndDate || '',
            honoraire: caseData.honoraire ? formatCurrency(caseData.honoraire) : '',
            timeSpent: caseData.timeSpent || 0,
            notes: caseData.notes || '',
            attachments: caseData.attachments || [],
            authorized_users: caseData.authorized_users || caseData.visible_to || []
          });
        }
      }, [caseData]);

      const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
          ...formData,
          honoraire: parseCurrency(formData.honoraire)
        });
      };

      const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (name === 'honoraire') {
          setFormData(prev => ({ ...prev, honoraire: formatCurrency(value) }));
        } else {
          setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (parseFloat(value) || 0) : value
          }));
        }
      };

      const handleVisibilityToggle = (collaboratorId) => {
        setFormData(prev => {
          const authorized_users = prev.authorized_users.includes(collaboratorId)
            ? prev.authorized_users.filter(id => id !== collaboratorId)
            : [...prev.authorized_users, collaboratorId];
          return { ...prev, authorized_users };
        });
      };

      const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, file.name]
          }));
          toast({
            title: "📎 Fichier ajouté (simulation)",
            description: `${file.name} a été ajouté. La sauvegarde réelle nécessite une intégration backend.`,
          });
          e.target.value = '';
        }
      };
      
      const handleScan = () => {
        toast({
          title: "🚧 Fonctionnalité non implémentée",
          description: "La numérisation directe n'est pas encore disponible. Vous pouvez demander cette fonctionnalité dans votre prochain prompt ! 🚀",
        });
      };

      const caseTypes = [
        { value: 'civil', label: 'Droit Civil' },
        { value: 'commercial', label: 'Droit Commercial' },
        { value: 'penal', label: 'Droit Pénal' },
        { value: 'family', label: 'Droit de la Famille' },
        { value: 'labor', label: 'Droit du Travail' },
        { value: 'real-estate', label: 'Droit Immobilier' },
        { value: 'intellectual', label: 'Propriété Intellectuelle' },
        { value: 'administrative', label: 'Droit Administratif' }
      ];

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
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {caseData ? 'Modifier le Dossier' : 'Nouveau Dossier'}
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
                <label htmlFor="case-reference" className="block text-sm font-medium text-slate-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Réf dossier *
                </label>
                <input
                  type="text"
                  id="case-reference"
                  name="case_reference"
                  value={formData.case_reference}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: CLI-2024-001, CAB-23/FIN, etc."
                />
                <p className="text-xs text-slate-500 mt-1">Saisissez votre propre nomenclature de référence</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Titre du dossier *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Affaire Martin vs. Société ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type de dossier *
                </label>
                <select
                  name="case_type"
                  value={formData.case_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="civil">Droit Civil</option>
                  <option value="commercial">Droit Commercial</option>
                  <option value="penal">Droit Pénal</option>
                  <option value="family">Droit de la Famille</option>
                  <option value="labor">Droit du Travail</option>
                  <option value="real-estate">Droit Immobilier</option>
                  <option value="intellectual">Propriété Intellectuelle</option>
                  <option value="administrative">Droit Administratif</option>
                </select>
              </div>

              <div>
                <label htmlFor="client-id" className="block text-sm font-medium text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Id Client *
                </label>
                <input
                  type="text"
                  id="client-id"
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: CLI-001, ENT-2024-15, etc."
                />
                <p className="text-xs text-slate-500 mt-1">Identifiant unique du client (nomenclature personnalisée)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type de client *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="client_type"
                      value="particulier"
                      checked={formData.client_type === 'particulier'}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-300">Particulier</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="client_type"
                      value="entreprise"
                      checked={formData.client_type === 'entreprise'}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-300">Entreprise</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    {formData.client_type === 'particulier' ? 'Nom complet du client' : 'Raison sociale'}
                  </label>
                  <input
                    type="text"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={formData.client_type === 'particulier' ? 'Ex: Jean Martin' : 'Ex: Société ABC SARL'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Partie adverse
                  </label>
                  <input
                    type="text"
                    name="opposing_party"
                    value={formData.opposing_party}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nom de la partie adverse"
                  />
                </div>
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
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Description détaillée de l'affaire..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="en-cours">En cours</option>
                    <option value="juge-acheve">Jugé/achevé</option>
                    <option value="cloture">Clôturé</option>
                    <option value="archive">Archivé - En attente</option>
                  </select>
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
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">🟢 Faible</option>
                    <option value="medium">🟡 Moyenne</option>
                    <option value="high">🟠 Élevée</option>
                    <option value="urgent">🔴 Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Honoraire
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="honoraire"
                      value={formData.honoraire}
                      onChange={handleChange}
                      className="w-full pl-4 pr-16 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ex: 5 000 000"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                      FCFA
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de début
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de fin prévue
                  </label>
                  <input
                    type="date"
                    name="expectedEndDate"
                    value={formData.expectedEndDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Timer className="w-4 h-4 inline mr-2" />
                    Temps passé (heures)
                  </label>
                  <input
                    type="number"
                    name="timeSpent"
                    value={isNaN(formData.timeSpent) ? "" : formData.timeSpent}
                    onChange={handleChange}
                    step="0.5"
                    min="0"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: 10.5"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Eye className="w-4 h-4 inline mr-2" />
                  Autorisé à
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                  {teamMembers.map(collab => (
                    <div key={collab.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`authorized-${collab.id}`}
                        checked={formData.authorized_users.includes(collab.id)}
                        onChange={() => handleVisibilityToggle(collab.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`authorized-${collab.id}`} className="ml-3 block text-sm text-slate-300">
                        {collab.name}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">🔒 Tout le monde peut voir la liste des dossiers. Seuls les utilisateurs sélectionnés et les administrateurs peuvent consulter le contenu complet.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Paperclip className="w-4 h-4 inline mr-2" />
                  Pièces jointes
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Bouton 1: Choisir des fichiers (sélection depuis l'app) */}
                  <label 
                    htmlFor="file-internal-case" 
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg px-4 py-3 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Choisir des fichiers
                  </label>
                  <input 
                    id="file-internal-case" 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileChange} 
                    multiple 
                  />
                  
                  {/* Bouton 2: Importer un fichier (explorateur système) */}
                  <label 
                    htmlFor="file-external-case" 
                    className="cursor-pointer bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg px-4 py-3 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    Importer fichier
                  </label>
                  <input 
                    id="file-external-case" 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileChange} 
                    multiple 
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  📁 <strong>Choisir</strong> : sélection depuis l'application | 📎 <strong>Importer</strong> : depuis l'ordinateur
                </p>
                <div className="mt-3 space-y-2">
                  {formData.attachments.map((name, index) => (
                    <div key={index} className="text-sm text-slate-300 bg-slate-700/30 p-2 rounded-md flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      {name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  {caseData ? 'Mettre à jour' : 'Créer le dossier'}
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

    export default CaseForm;
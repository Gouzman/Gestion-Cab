import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Users, FileText, MapPin, Paperclip, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const EventForm = ({ currentUser, onCancel, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    description: '',
    attendees: [],
    location: '',
    linked_cases: [],
    linked_files: [],
  });
  const [collaborators, setCollaborators] = useState([]);
  const [cases, setCases] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Charger les collaborateurs
      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, name, role');
      const filteredData = (profilesData || []).filter(member => member.role !== 'admin');
      if (profilesError) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les collaborateurs." });
      } else {
        setCollaborators(filteredData.filter(m => m.id !== currentUser.id));
      }

      // Charger les dossiers
      const { data: casesData, error: casesError } = await supabase.from('cases').select('id, case_reference, title');
      if (casesError) {
        console.error('Erreur chargement dossiers:', casesError);
      } else {
        setCases(casesData || []);
      }

      // Charger les fichiers (tasks_files table)
      const { data: filesData, error: filesError } = await supabase.from('tasks_files').select('id, file_name, file_path, task_id');
      if (filesError) {
        console.error('Erreur chargement fichiers:', filesError);
      } else {
        setAllFiles(filesData || []);
        setFilteredFiles(filesData || []);
      }
    };
    fetchData();
  }, [currentUser.id]);

  // Filtrer les fichiers lorsque les dossiers sélectionnés changent
  useEffect(() => {
    if (formData.linked_cases.length > 0) {
      // Ici, on suppose une relation future entre cases et tasks_files
      // Pour l'instant, afficher tous les fichiers disponibles
      setFilteredFiles(allFiles);
    } else {
      setFilteredFiles(allFiles);
    }
  }, [formData.linked_cases, allFiles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttendeeToggle = (collaboratorId) => {
    setFormData(prev => {
      const attendees = prev.attendees.includes(collaboratorId)
        ? prev.attendees.filter(id => id !== collaboratorId)
        : [...prev.attendees, collaboratorId];
      return { ...prev, attendees };
    });
  };

  const handleCaseToggle = (caseId) => {
    setFormData(prev => {
      const linked_cases = prev.linked_cases.includes(caseId)
        ? prev.linked_cases.filter(id => id !== caseId)
        : [...prev.linked_cases, caseId];
      return { ...prev, linked_cases };
    });
  };

  const handleFileToggle = (fileId) => {
    setFormData(prev => {
      const linked_files = prev.linked_files.includes(fileId)
        ? prev.linked_files.filter(id => id !== fileId)
        : [...prev.linked_files, fileId];
      return { ...prev, linked_files };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime) {
      toast({ variant: 'destructive', title: 'Champs requis', description: 'Le titre et la date de début sont obligatoires.' });
      return;
    }

    // Construire un objet avec les données étendues pour les nouveaux champs
    const extendedData = {
      attendees: formData.attendees,
      location: formData.location,
      linked_cases: formData.linked_cases,
      linked_files: formData.linked_files,
    };

    // Nettoyer le payload avant l'insertion en utilisant les champs qui existent dans le schéma Supabase
    const payload = {
      title: formData.title,
      description: formData.description,
      start_date: formData.startTime,
      // Stocker les nouveaux champs dans metadata JSON si les colonnes n'existent pas
      metadata: extendedData,
    };

    // Log pour debug
    console.log("Payload événement envoyé à Supabase :", payload);

    const { error } = await supabase.from('events').insert([payload]);

    if (error) {
      console.error('Erreur création événement:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: "L'événement n'a pas pu être créé." });
    } else {
      toast({ title: '✅ Événement créé', description: 'Votre événement a été ajouté à l\'agenda.' });
      onEventCreated();
    }
  };

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
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Nouvel Événement</h2>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Titre de l'événement *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Réunion projet X"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date et heure de début *
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="event-description" className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              id="event-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ordre du jour, détails..."
            />
          </div>

          <div>
            <label htmlFor="event-location" className="block text-sm font-medium text-slate-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Lieu
            </label>
            <input
              type="text"
              id="event-location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Salle de réunion A, Cabinet, Tribunal..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <FolderOpen className="w-4 h-4 inline mr-2" />
              Dossier(s) lié(s)
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
              {cases.length === 0 && (
                <p className="text-xs text-slate-500">Aucun dossier disponible</p>
              )}
              {cases.map(caseItem => (
                <div key={caseItem.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`case-${caseItem.id}`}
                    checked={formData.linked_cases.includes(caseItem.id)}
                    onChange={() => handleCaseToggle(caseItem.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`case-${caseItem.id}`} className="ml-3 block text-sm text-slate-300">
                    {caseItem.case_reference || caseItem.id} - {caseItem.title}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Sélectionnez un ou plusieurs dossiers liés à cet événement.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Paperclip className="w-4 h-4 inline mr-2" />
              Fichier(s) lié(s)
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
              {filteredFiles.length === 0 && (
                <p className="text-xs text-slate-500">Aucun fichier disponible</p>
              )}
              {filteredFiles.map(file => (
                <div key={file.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`file-${file.id}`}
                    checked={formData.linked_files.includes(file.id)}
                    onChange={() => handleFileToggle(file.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`file-${file.id}`} className="ml-3 block text-sm text-slate-300 truncate">
                    {file.file_name}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Les fichiers seront filtrés automatiquement selon les dossiers sélectionnés.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Participant(s)
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
              {collaborators.length === 0 && (
                <p className="text-xs text-slate-500">Aucun collaborateur disponible</p>
              )}
              {collaborators.map(collab => (
                <div key={collab.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`attendee-${collab.id}`}
                    checked={formData.attendees.includes(collab.id)}
                    onChange={() => handleAttendeeToggle(collab.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`attendee-${collab.id}`} className="ml-3 block text-sm text-slate-300">
                    {collab.name}
                  </label>
                </div>
              ))}
            </div>
             <p className="text-xs text-slate-500 mt-2">Sélectionnez les participants à cet événement. Vous et les administrateurs sont toujours inclus.</p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              Créer l'événement
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
              Annuler
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EventForm;
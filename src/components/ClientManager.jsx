import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Building, User, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ClientForm from '@/components/ClientForm';
import ClientListItem from '@/components/ClientListItem';
import ClientsPrintPage from '@/components/ClientsPrintPage';
import ConfirmationModal from '@/components/ConfirmationModal';
import { supabase } from '@/lib/customSupabaseClient';
import { getClientDisplayName } from '../lib/clientUtils';

const ClientManager = () => {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintPage, setShowPrintPage] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Erreur lors du chargement des clients :", error.message);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les clients." });
    } else {
      // Transformation des données de snake_case vers camelCase pour l'affichage
      const transformedClients = data.map(client => ({
        ...client,
        name: getClientDisplayName(client), // Utilisation de la fonction dynamique
        clientCode: client.client_code, // Numéro client (AA.NNN)
        firstName: client.first_name,
        lastName: client.last_name,
        postalCode: client.postal_code,
        createdAt: client.created_at
      }));
      setClients(transformedClients);
    }
  };

  const handleAddClient = async (clientData) => {
    try {
      // Validation des champs obligatoires selon le type
      if (clientData.type === 'company') {
        if (!clientData.company || !clientData.email) {
          toast({ variant: "destructive", title: "Erreur", description: "Le nom de l'entreprise et l'email sont obligatoires." });
          return;
        }
      } else {
        if (!clientData.firstName || !clientData.lastName || !clientData.email) {
          toast({ variant: "destructive", title: "Erreur", description: "Les champs prénom, nom et email sont obligatoires." });
          return;
        }
      }

      // Log pour debug
      console.log("Payload envoyé :", clientData);

      // Construction du nom d'affichage selon le type
      let displayName;
      if (clientData.type === 'company') {
        displayName = clientData.company?.trim() || 'Entreprise sans nom';
      } else {
        displayName = `${clientData.firstName?.trim() || ''} ${clientData.lastName?.trim() || ''}`.trim() || 'Inconnu';
      }

      // Transformation des noms de champs de camelCase vers snake_case pour la BDD
      const dbClientData = {
        type: clientData.type,
        name: displayName,
        first_name: clientData.firstName || null,
        last_name: clientData.lastName || null,
        company: clientData.company || null,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        city: clientData.city,
        postal_code: clientData.postalCode,
        country: clientData.country,
        notes: clientData.notes,
        // Champs convention
        is_conventionne: clientData.is_conventionne || false,
        numero_convention: clientData.numero_convention || null,
        type_convention: clientData.type_convention || null,
        organisme_convention: clientData.organisme_convention || null,
        date_debut_convention: clientData.date_debut_convention || null,
        date_fin_convention: clientData.date_fin_convention || null,
        taux_prise_en_charge: clientData.taux_prise_en_charge ? Number.parseFloat(clientData.taux_prise_en_charge) : null,
        notes_convention: clientData.notes_convention || null
      };

      const { data, error } = await supabase.from('clients').insert([dbClientData]).select();
      
      if (error) {
        console.error("Erreur Supabase :", error.message);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le client. Vérifiez les champs et réessayez." });
        return;
      }

      // Transformation des données reçues de snake_case vers camelCase pour l'affichage
      const transformedClient = {
        ...data[0],
        name: getClientDisplayName(data[0]),
        firstName: data[0].first_name,
        lastName: data[0].last_name,
        postalCode: data[0].postal_code,
        createdAt: data[0].created_at
      };

      setClients([transformedClient, ...clients]);
      setShowForm(false);
      toast({ title: "✅ Client ajouté", description: "Le nouveau client a été ajouté avec succès." });
    } catch (err) {
      console.error("Erreur lors de l'ajout du client :", err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le client." });
    }
  };

  const handleEditClient = async (clientData) => {
    try {
      // Validation des champs obligatoires selon le type
      if (clientData.type === 'company') {
        if (!clientData.company || !clientData.email) {
          toast({ variant: "destructive", title: "Erreur", description: "Le nom de l'entreprise et l'email sont obligatoires." });
          return;
        }
      } else {
        if (!clientData.firstName || !clientData.lastName || !clientData.email) {
          toast({ variant: "destructive", title: "Erreur", description: "Les champs prénom, nom et email sont obligatoires." });
          return;
        }
      }

      // Construction du nom d'affichage selon le type
      let displayName;
      if (clientData.type === 'company') {
        displayName = clientData.company?.trim() || 'Entreprise sans nom';
      } else {
        displayName = `${clientData.firstName?.trim() || ''} ${clientData.lastName?.trim() || ''}`.trim() || 'Inconnu';
      }

      // Transformation des noms de champs de camelCase vers snake_case pour la BDD
      const dbClientData = {
        type: clientData.type,
        name: displayName,
        first_name: clientData.firstName || null,
        last_name: clientData.lastName || null,
        company: clientData.company || null,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        city: clientData.city,
        postal_code: clientData.postalCode,
        country: clientData.country,
        notes: clientData.notes,
        // Champs convention
        is_conventionne: clientData.is_conventionne || false,
        numero_convention: clientData.numero_convention || null,
        type_convention: clientData.type_convention || null,
        organisme_convention: clientData.organisme_convention || null,
        date_debut_convention: clientData.date_debut_convention || null,
        date_fin_convention: clientData.date_fin_convention || null,
        taux_prise_en_charge: clientData.taux_prise_en_charge ? Number.parseFloat(clientData.taux_prise_en_charge) : null,
        notes_convention: clientData.notes_convention || null
      };

      const { data, error } = await supabase.from('clients').update(dbClientData).eq('id', editingClient.id).select();
      
      if (error) {
        console.error("Erreur Supabase lors de la modification :", error.message);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le client. Vérifiez les champs et réessayez." });
        return;
      }

      // Transformation des données reçues de snake_case vers camelCase pour l'affichage
      const transformedClient = {
        ...data[0],
        name: getClientDisplayName(data[0]),
        firstName: data[0].first_name,
        lastName: data[0].last_name,
        postalCode: data[0].postal_code,
        createdAt: data[0].created_at
      };

      setClients(clients.map(c => c.id === editingClient.id ? transformedClient : c));
      setEditingClient(null);
      setShowForm(false);
      toast({ title: "✅ Client modifié", description: "Les informations du client ont été mises à jour." });
    } catch (err) {
      console.error("Erreur lors de la modification du client :", err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le client." });
    }
  };

  const handleDeleteClient = async (clientId) => {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le client." });
    } else {
      setClients(clients.filter(client => client.id !== clientId));
      toast({ title: "🗑️ Client supprimé", description: "Le client a été supprimé avec succès." });
    }
  };

  const handlePrint = () => {
    setShowPrintPage(true);
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.first_name?.toLowerCase().includes(searchLower) ||
      client.last_name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.company?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6" id="client-manager-section">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Clients</h1>
          <p className="text-slate-400">Gérez votre portefeuille client</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimer
          </Button>
          <Button
            onClick={() => {
              setEditingClient(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Client
          </Button>
        </div>
      </div>

      <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Clients</p>
              <p className="text-3xl font-bold text-white">{clients.length}</p>
            </div>
            <User className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Entreprises</p>
              <p className="text-3xl font-bold text-white">
                {clients.filter(c => c.type === 'company').length}
              </p>
            </div>
            <Building className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Particuliers</p>
              <p className="text-3xl font-bold text-white">
                {clients.filter(c => c.type === 'individual').length}
              </p>
            </div>
            <User className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 print:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un client par nom, email, téléphone ou entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Column Headers */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4 px-6 py-3 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-700/50 text-sm text-slate-400 font-medium">
        <div>Nom & Type</div>
        <div>Email</div>
        <div>Téléphone</div>
        <div>Ville</div>
        <div>Date & Actions</div>
      </div>

      {/* Client List */}
      <div className="space-y-4">
        {filteredClients.map((client, index) => (
          <ClientListItem
            key={client.id}
            client={client}
            index={index}
            onEdit={(client) => {
              setEditingClient(client);
              setShowForm(true);
            }}
            onDelete={(clientId) => {
              const clientToDelete = clients.find(c => c.id === clientId);
              setConfirmDialog({
                open: true,
                title: 'Supprimer le client',
                message: `Voulez-vous vraiment supprimer le client "${clientToDelete?.name}" ?\n\nCette action est irréversible.`,
                onConfirm: () => {
                  handleDeleteClient(clientId);
                  setConfirmDialog({ ...confirmDialog, open: false });
                }
              });
            }}
          />
        ))}
      </div>

      {filteredClients.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 print:hidden"
        >
          <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucun client trouvé</h3>
          <p className="text-slate-500">
            {searchTerm
              ? 'Essayez de modifier votre recherche'
              : 'Commencez par ajouter votre premier client'
            }
          </p>
        </motion.div>
      )}

      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={editingClient ? handleEditClient : handleAddClient}
          onCancel={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
        />
      )}

      {showPrintPage && (
        <ClientsPrintPage
          clients={clients}
          onClose={() => setShowPrintPage(false)}
        />
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

export default ClientManager;
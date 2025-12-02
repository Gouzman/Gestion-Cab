import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Search, Briefcase, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import TeamMemberForm from '@/components/TeamMemberForm';
import CollaboratorListItem from '@/components/CollaboratorListItem';
import ConfirmationModal from '@/components/ConfirmationModal';
import DeleteUserModal from '@/components/DeleteUserModal';
import { supabase } from '@/lib/customSupabaseClient';

const TeamManager = ({ currentUser }) => {
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase.from('profiles')
      .select('id, name, email, "function", role, created_at');
    if (error) {
      console.error('Erreur chargement collaborateurs:', error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les collaborateurs." });
    } else {
      // Filtrer pour exclure les comptes admin
      const filteredData = (data || []).filter(member => member.role !== 'admin');
      setMembers(filteredData);
    }
  };



  const handleEditMember = async (memberData) => {
    if (!editingMember) return;
    const { data, error } = await supabase.from('profiles').update({
      name: memberData.name,
      'function': memberData.function,
      role: memberData.role,
    }).eq('id', editingMember.id)
    .select('id, name, email, "function", role, created_at');

    if (error) {
      console.error('Erreur modification collaborateur:', error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: `Impossible de modifier le collaborateur: ${error.message || 'Erreur inconnue'}` 
      });
    } else {
      setMembers(members.map(m => m.id === editingMember.id ? data[0] : m));
      setEditingMember(null);
      toast({ title: "✅ Collaborateur modifié", description: "Les informations ont été mises à jour." });
    }
  };

  const handleDeleteMember = async (memberId) => {
    // Trouver l'utilisateur à supprimer
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    // Ouvrir le modal de suppression
    setUserToDelete(member);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async (userId) => {
    try {
      // Utiliser la fonction RPC pour supprimer complètement l'utilisateur
      const { data: result, error: rpcError } = await supabase
        .rpc('delete_user_account', {
          user_id: userId
        });

      if (rpcError) {
        console.error('Erreur RPC delete_user_account:', rpcError);
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: "Impossible de supprimer l'utilisateur." 
        });
        return;
      }

      if (!result?.success) {
        console.error('Erreur suppression:', result?.error);
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: result?.error || "Erreur lors de la suppression." 
        });
        return;
      }

      // Mise à jour de la liste
      setMembers(members.filter(m => m.id !== userId));
      
      toast({ 
        title: "✅ Utilisateur supprimé", 
        description: "Le compte utilisateur a été supprimé complètement." 
      });
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Une erreur est survenue lors de la suppression." 
      });
    }
  };

  const filteredMembers = members.filter(member => {
    if (!member) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      member?.name?.toLowerCase().includes(searchLower) ||
      member?.email?.toLowerCase().includes(searchLower) ||
      member?.role?.toLowerCase().includes(searchLower)
    );
  });

  const roleCounts = members.reduce((acc, member) => {
    if (member?.role) {
      const role = member.role.toLowerCase();
      acc[role] = (acc[role] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6" id="team-manager-section">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Collaborateurs</h1>
          <p className="text-slate-400">Gérez les membres de votre cabinet et leurs accès</p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <span className="text-xs text-blue-300">
              💡 <strong>Info :</strong> Cette section gère le <strong>personnel interne</strong> du cabinet (avocats, assistants, etc.)
            </span>
          </div>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <span className="text-xs text-orange-300">
              ℹ️ Pour <strong>créer un nouveau collaborateur</strong>, rendez-vous dans <strong>Paramètres → Permissions</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="print:hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between"><p className="text-slate-400">Total</p><Briefcase className="w-6 h-6 text-slate-400" /></div>
          <p className="text-3xl font-bold text-white">{members.length}</p>
        </motion.div>
        {Object.entries(roleCounts).slice(0, 3).map(([role, count], index) => (
          <motion.div key={role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index + 1) * 0.1 }} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between"><p className="text-slate-400 capitalize">{role}</p><User className="w-6 h-6 text-green-400" /></div>
            <p className="text-3xl font-bold text-white">{count}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 print:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un collaborateur par nom, email ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Column Headers */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4 px-6 py-3 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-700/50 text-sm text-slate-400 font-medium">
        <div>Nom et Prénoms</div>
        <div>Titre / Fonction</div>
        <div>Courriel</div>
        <div>Rôle & Actions</div>
      </div>

      {/* Collaborator List */}
      <div className="space-y-4">
        {filteredMembers.map((member, index) => (
          <CollaboratorListItem
            key={member.id}
            member={member}
            index={index}
            onEdit={(member) => {
              setEditingMember(member);
            }}
            onDelete={(memberId) => {
              const memberToDelete = members.find(m => m.id === memberId);
              setConfirmDialog({
                open: true,
                title: 'Supprimer le collaborateur',
                message: `Voulez-vous vraiment supprimer le membre "${memberToDelete?.name}" ?\n\nCette action est irréversible.`,
                onConfirm: () => {
                  handleDeleteMember(memberId);
                  setConfirmDialog({ ...confirmDialog, open: false });
                }
              });
            }}
            isCurrentUser={member.id === currentUser.id}
          />
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 print:hidden">
          <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucun collaborateur trouvé</h3>
          <p className="text-slate-500">
            {searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par ajouter un membre à votre équipe'}
          </p>
        </motion.div>
      )}

      {editingMember && (
        <TeamMemberForm
          member={editingMember}
          onSubmit={handleEditMember}
          onCancel={() => {
            setEditingMember(null);
          }}
        />
      )}

      <ConfirmationModal
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
      />

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        user={userToDelete}
        onConfirmDelete={confirmDeleteUser}
      />
    </div>
  );
};

TeamManager.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    function: PropTypes.string,
  })
};

export default TeamManager;
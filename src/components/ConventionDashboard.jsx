import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, Calendar, AlertTriangle, CheckCircle, XCircle, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { getClientDisplayName } from '../lib/clientUtils';

const ConventionDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    expirees: 0,
    expirantBientot: 0
  });
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState('all'); // all, actives, expiring, expired
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConventionData();
  }, []);

  const fetchConventionData = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les clients conventionnés
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_conventionne', true)
        .order('date_fin_convention', { ascending: true, nullsFirst: false });

      if (clientsError) throw clientsError;

      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);

      const processedClients = (clientsData || []).map(client => {
        const dateFin = client.date_fin_convention ? new Date(client.date_fin_convention) : null;
        let status = 'active';
        let daysRemaining = null;

        if (dateFin) {
          daysRemaining = Math.ceil((dateFin - now) / (1000 * 60 * 60 * 24));
          
          if (dateFin < now) {
            status = 'expired';
          } else if (dateFin <= in30Days) {
            status = 'expiring';
          }
        }

        return {
          ...client,
          status,
          daysRemaining,
          displayName: getClientDisplayName(client)
        };
      });

      setClients(processedClients);

      // Calculer les statistiques
      const actives = processedClients.filter(c => c.status === 'active').length;
      const expirees = processedClients.filter(c => c.status === 'expired').length;
      const expirantBientot = processedClients.filter(c => c.status === 'expiring').length;

      setStats({
        total: processedClients.length,
        actives,
        expirees,
        expirantBientot
      });

    } catch (error) {
      console.error('Erreur chargement conventions:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les données des conventions.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredClients = () => {
    if (filter === 'all') return clients;
    if (filter === 'actives') return clients.filter(c => c.status === 'active');
    if (filter === 'expiring') return clients.filter(c => c.status === 'expiring');
    if (filter === 'expired') return clients.filter(c => c.status === 'expired');
    return clients;
  };

  const getStatusBadge = (status, daysRemaining) => {
    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-600/20 text-red-300 border border-red-500/30">
          <XCircle className="w-3 h-3" />
          Expirée
        </span>
      );
    }
    
    if (status === 'expiring') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-600/20 text-orange-300 border border-orange-500/30">
          <AlertTriangle className="w-3 h-3" />
          Expire dans {daysRemaining} jour(s)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-600/20 text-green-300 border border-green-500/30">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      'aide_juridictionnelle': 'Aide juridictionnelle',
      'assurance_protection_juridique': 'Assurance',
      'convention_entreprise': 'Convention entreprise',
      'autre': 'Autre'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Chargement des conventions...</div>
      </div>
    );
  }

  const filteredClients = getFilteredClients();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck className="w-8 h-8 text-green-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Clients Conventionnés</h2>
            <p className="text-slate-400 text-sm">Suivi des conventions et alertes d'expiration</p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Actives</p>
              <p className="text-2xl font-bold text-green-400">{stats.actives}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Expirent bientôt</p>
              <p className="text-2xl font-bold text-orange-400">{stats.expirantBientot}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Expirées</p>
              <p className="text-2xl font-bold text-red-400">{stats.expirees}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
        >
          Tous ({stats.total})
        </Button>
        <Button
          onClick={() => setFilter('actives')}
          variant={filter === 'actives' ? 'default' : 'outline'}
          size="sm"
          className={filter === 'actives' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          Actives ({stats.actives})
        </Button>
        <Button
          onClick={() => setFilter('expiring')}
          variant={filter === 'expiring' ? 'default' : 'outline'}
          size="sm"
          className={filter === 'expiring' ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          Expirent bientôt ({stats.expirantBientot})
        </Button>
        <Button
          onClick={() => setFilter('expired')}
          variant={filter === 'expired' ? 'default' : 'outline'}
          size="sm"
          className={filter === 'expired' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          Expirées ({stats.expirees})
        </Button>
      </div>

      {/* Liste des clients */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Aucun client conventionné dans cette catégorie
          </div>
        ) : (
          filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                {/* Client */}
                <div className="md:col-span-2">
                  <h4 className="text-white font-medium">{client.displayName}</h4>
                  <p className="text-slate-400 text-sm">
                    {client.client_code && `N° ${client.client_code}`}
                  </p>
                </div>

                {/* Convention */}
                <div>
                  <p className="text-slate-300 text-sm font-medium">{client.numero_convention}</p>
                  <p className="text-slate-400 text-xs">{getTypeLabel(client.type_convention)}</p>
                </div>

                {/* Dates */}
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">
                      {formatDate(client.date_debut_convention)} → {formatDate(client.date_fin_convention)}
                    </span>
                  </div>
                  {client.organisme_convention && (
                    <p className="text-slate-400 text-xs mt-1">{client.organisme_convention}</p>
                  )}
                </div>

                {/* Statut */}
                <div className="flex justify-end">
                  {getStatusBadge(client.status, client.daysRemaining)}
                </div>
              </div>

              {/* Taux de prise en charge */}
              {client.taux_prise_en_charge && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-300">
                      Prise en charge : <strong className="text-green-400">{client.taux_prise_en_charge}%</strong>
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConventionDashboard;

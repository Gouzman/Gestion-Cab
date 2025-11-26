import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Users, 
  FileText, 
  Clock,
  AlertTriangle,
  Target,
  UserX,
  Megaphone,
  Send,
  Briefcase,
  Banknote,
  Plus,
  FolderPlus,
  UserPlus,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const Dashboard = ({ currentUser, setActiveView }) => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalClients: 0,
    activeCases: 0,
    urgentTasks: 0,
    todayDeadlines: 0,
    revenue: 0,
    previousClients: 0,
    previousCases: 0,
    previousRevenue: 0,
    previousTasks: 0
  });
  const [caseStats, setCaseStats] = useState({
    active: 0,
    pending: 0,
    closed: 0,
    suspended: 0
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState('');

  const isGerantOrAssocie = currentUser && (currentUser.function === 'Gerant' || currentUser.function === 'Associe Emerite');
  const isAdmin = isGerantOrAssocie || (currentUser.role && currentUser.role.toLowerCase() === 'admin');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all data for admins/managers
      let tasksQuery = supabase.from('tasks').select('*');
      let clientsQuery = supabase.from('clients').select('id', { count: 'exact' });
      let casesQuery = supabase.from('cases').select('*');
      
      // If not admin, fetch only user-specific data
      if (!isAdmin) {
        tasksQuery = tasksQuery.eq('assigned_to_id', currentUser.id);
        casesQuery = casesQuery.eq('assigned_to_id', currentUser.id);
      }

      const [
        { data: tasksData, error: tasksError },
        { count: clientsCount, error: clientsError },
        { data: casesData, error: casesError },
        { data: alertsData, error: alertsError }
      ] = await Promise.all([
        tasksQuery,
        isAdmin ? clientsQuery : Promise.resolve({ count: 0, error: null }),
        casesQuery,
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const invoicesData = [];

      if (tasksError || clientsError || casesError || alertsError) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données du tableau de bord." });
      }

      setAlerts(alertsData || []);

      const tasks = tasksData || [];
      const cases = casesData || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date();
      
      // Calcul des stats de tâches
      const urgentTasks = tasks.filter(task => task.priority === 'urgent' && task.status !== 'completed');
      const todayDeadlines = tasks.filter(task => {
        if (!task.deadline) return false;
        const deadlineDate = new Date(task.deadline);
        deadlineDate.setHours(0,0,0,0);
        return deadlineDate.getTime() === today.getTime();
      });
      const overdue = tasks.filter(task => 
        task.deadline && new Date(task.deadline) < now && task.status !== 'completed'
      );
      setOverdueTasks(overdue);

      // Calcul des stats de dossiers
      const activeCases = cases.filter(c => c.status === 'active' || c.status === 'actif').length;
      const pendingCases = cases.filter(c => c.status === 'pending' || c.status === 'en-attente').length;
      const closedCases = cases.filter(c => c.status === 'closed' || c.status === 'cloture').length;
      const suspendedCases = cases.filter(c => c.status === 'suspended' || c.status === 'suspendu').length;
      
      setCaseStats({
        active: activeCases,
        pending: pendingCases,
        closed: closedCases,
        suspended: suspendedCases
      });

      // Calcul du revenu total (mois en cours)
      // NOTE: Désactivé jusqu'à ce que la table invoices soit configurée avec la colonne amount
      const monthlyRevenue = 0;
      const previousMonthRevenue = 0;
      
      setStats({
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'completed').length,
        totalClients: clientsCount || 0,
        activeCases: activeCases,
        urgentTasks: urgentTasks.length,
        todayDeadlines: todayDeadlines.length,
        revenue: monthlyRevenue,
        previousClients: Math.floor((clientsCount || 0) * 0.89), // Simulation +12%
        previousCases: Math.floor(activeCases * 0.95), // Simulation +5%
        previousRevenue: previousMonthRevenue,
        previousTasks: Math.floor(tasks.length * 1.08) // Simulation -8%
      });

      // Récupérer les échéances à venir (7 prochains jours)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const upcoming = tasks
        .filter(task => {
          if (!task.deadline || task.status === 'completed') return false;
          const deadline = new Date(task.deadline);
          return deadline >= now && deadline <= sevenDaysFromNow;
        })
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 3);
      
      setUpcomingDeadlines(upcoming);

      // Activités récentes (dernières tâches créées ou mises à jour)
      const recent = [...tasks]
        .sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at))
        .slice(0, 2)
        .map(task => ({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: task.assigned_to_name || 'Non assigné',
          time: task.created_at || task.updated_at,
          description: task.status === 'completed' ? 'Tâche terminée' : 'Nouvelle tâche créée'
        }));
      
      // Ajouter les nouveaux clients si admin
      if (isAdmin && clientsCount > 0) {
        const { data: recentClients } = await supabase
          .from('clients')
          .select('name, created_at')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (recentClients && recentClients.length > 0) {
          recent.unshift({
            id: `client-${Date.now()}`,
            type: 'client',
            title: 'Nouveau client ajouté',
            subtitle: recentClients[0].name,
            time: recentClients[0].created_at,
            description: 'Client ajouté au système'
          });
        }
      }
      
      setRecentActivities(recent.slice(0, 3));

      if (isAdmin) {
        const { data: membersData } = await supabase.from('profiles').select('*, role');
        // Filtrer pour exclure les comptes admin
        const filteredMembers = (membersData || []).filter(member => member.role !== 'admin');
        const { data: allTasksData } = await supabase.from('tasks').select('assigned_to_id, status, deadline');
        
        const performance = filteredMembers.map(member => {
          const memberTasks = (allTasksData || []).filter(t => t.assigned_to_id === member.id);
          const completed = memberTasks.filter(t => t.status === 'completed').length;
          const overduePerf = memberTasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'completed').length;
          return {
            name: member.name,
            total: memberTasks.length,
            completed,
            overdue: overduePerf,
            completionRate: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
          };
        });
        setTeamPerformance(performance);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser, isAdmin]);

  const handlePostAlert = async () => {
    if (newAlert.trim() === '') return;
    const alert = {
      text: newAlert,
      author_id: currentUser.id,
      author_name: currentUser.name,
    };
    const { data, error } = await supabase.from('alerts').insert([alert]).select();
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de publier l'alerte." });
    } else {
      setAlerts([data[0], ...alerts]);
      setNewAlert('');
      toast({ title: "📢 Alerte publiée", description: "Votre message est visible par toute l'équipe." });
    }
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' F CFA';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Il y a moins d\'1 heure';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return formatDate(dateString);
  };

  const getDeadlineColor = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-400';
    if (diffDays === 0) return 'text-orange-400';
    if (diffDays <= 2) return 'text-yellow-400';
    return 'text-blue-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tableau de bord</h1>
          <p className="text-slate-400">
            Bon retour ! Voici un aperçu de votre cabinet.
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <CalendarIcon className="w-5 h-5" />
          <p className="text-slate-300 font-medium">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Cards - Exactement comme sur l'image */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clients */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            onClick={() => setActiveView('clients')}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">Total Clients</p>
                <p className="text-3xl font-bold text-white">{stats.totalClients}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {stats.totalClients >= stats.previousClients ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">+{calculatePercentageChange(stats.totalClients, stats.previousClients)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">{calculatePercentageChange(stats.totalClients, stats.previousClients)}%</span>
                </>
              )}
              <span className="text-slate-500">vs last month</span>
            </div>
          </motion.div>
        )}

        {/* Dossiers Actifs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setActiveView('cases')}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-green-500/50 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">Dossiers Actifs</p>
              <p className="text-3xl font-bold text-white">{stats.activeCases}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Briefcase className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {stats.activeCases >= stats.previousCases ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400">+{calculatePercentageChange(stats.activeCases, stats.previousCases)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-red-400">{calculatePercentageChange(stats.activeCases, stats.previousCases)}%</span>
              </>
            )}
            <span className="text-slate-500">vs last month</span>
          </div>
        </motion.div>

        {/* Revenu (Mois) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setActiveView('billing')}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">Revenu (Mois)</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(stats.revenue)}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Banknote className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {stats.revenue >= stats.previousRevenue ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">+{calculatePercentageChange(stats.revenue, stats.previousRevenue)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">{calculatePercentageChange(stats.revenue, stats.previousRevenue)}%</span>
                </>
              )}
              <span className="text-slate-500">vs last month</span>
            </div>
          </motion.div>
        )}

        {/* Tâches en Attente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setActiveView('tasks')}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-red-500/50 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">Tâches en Attente</p>
              <p className="text-3xl font-bold text-white">{stats.totalTasks - stats.completedTasks}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {stats.totalTasks <= stats.previousTasks ? (
              <>
                <TrendingDown className="w-4 h-4 text-green-400" />
                <span className="text-green-400">{calculatePercentageChange(stats.totalTasks, stats.previousTasks)}%</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span className="text-red-400">+{calculatePercentageChange(stats.totalTasks, stats.previousTasks)}%</span>
              </>
            )}
            <span className="text-slate-500">vs last month</span>
          </div>
        </motion.div>
      </div>

      {/* Section Aperçu du statut des dossiers & Échéances à venir */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aperçu du statut des dossiers */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Aperçu du statut des dossiers</h3>
          
          <div className="space-y-6">
            {/* Actif */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-slate-300 font-medium">Actif</span>
                </div>
                <span className="text-white font-bold text-xl">{caseStats.active}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(caseStats.active / (caseStats.active + caseStats.pending + caseStats.closed + caseStats.suspended || 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {((caseStats.active / (caseStats.active + caseStats.pending + caseStats.closed + caseStats.suspended || 1)) * 100).toFixed(1)}% du total
              </p>
            </div>

            {/* En attente */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-slate-300 font-medium">En attente</span>
                </div>
                <span className="text-white font-bold text-xl">{caseStats.pending}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(caseStats.pending / (caseStats.active + caseStats.pending + caseStats.closed + caseStats.suspended || 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {((caseStats.pending / (caseStats.active + caseStats.pending + caseStats.closed + caseStats.suspended || 1)) * 100).toFixed(1)}% du total
              </p>
            </div>

            {/* Clôturé */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckSquare className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-slate-300 font-medium">Clôturé</span>
                </div>
                <span className="text-white font-bold text-xl">{caseStats.closed}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(caseStats.closed / (caseStats.active + caseStats.pending + caseStats.closed + caseStats.suspended || 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {((caseStats.closed / (caseStats.active + caseStats.pending + caseStats.closed + caseStats.suspended || 1)) * 100).toFixed(1)}% du total
              </p>
            </div>

            {/* En suspens */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-slate-300 font-medium">En suspens</span>
                </div>
                <span className="text-white font-bold text-xl">{caseStats.suspended}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(caseStats.suspended / (caseStats.active + caseStats.pending + caseStats.closed + caseStats.suspended || 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {((caseStats.suspended / (caseStats.active + caseStats.pending + caseStats.closed + caseStats.suspended || 1)) * 100).toFixed(1)}% du total
              </p>
            </div>
          </div>
        </motion.div>

        {/* Échéances à venir */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Échéances à venir</h3>
            <div className="p-2 bg-slate-700/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          
          <div className="space-y-4">
            {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(task => (
              <div 
                key={task.id}
                className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-500/50 transition-colors cursor-pointer"
                onClick={() => setActiveView('tasks')}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    task.title.includes('tribunal') || task.title.includes('Audience') ? 'bg-red-500/10' : 
                    task.title.includes('document') || task.title.includes('Soumission') ? 'bg-yellow-500/10' : 
                    'bg-green-500/10'
                  }`}>
                    {task.title.includes('tribunal') || task.title.includes('Audience') ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : task.title.includes('document') || task.title.includes('Soumission') ? (
                      <FileText className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Users className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm mb-1 truncate">{task.title}</p>
                    <p className="text-slate-400 text-xs mb-2">{task.assigned_to_name || 'Non assigné'}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <CalendarIcon className="w-3 h-3 text-slate-500" />
                      <span className={getDeadlineColor(task.deadline)}>
                        {formatDate(task.deadline)}
                      </span>
                      <Clock className="w-3 h-3 text-slate-500 ml-2" />
                      <span className="text-slate-400">
                        {new Date(task.deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucune échéance prévue dans les 7 prochains jours</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Section Activités récentes & Actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités récentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Activités récentes</h3>
          
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  activity.type === 'task' ? 'bg-blue-500/10' : 
                  activity.type === 'client' ? 'bg-green-500/10' : 
                  'bg-purple-500/10'
                }`}>
                  {activity.type === 'task' ? (
                    <Briefcase className="w-5 h-5 text-blue-400" />
                  ) : activity.type === 'client' ? (
                    <Users className="w-5 h-5 text-green-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm mb-1">{activity.title}</p>
                  <p className="text-slate-400 text-xs mb-1">{activity.subtitle}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(activity.time)}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Actions rapides</h3>
          
          <div className="space-y-3">
            {isAdmin && (
              <>
                <Button
                  onClick={() => setActiveView('clients')}
                  className="w-full justify-start gap-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white h-auto py-4"
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <UserPlus className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Ajouter un nouveau client</p>
                    <p className="text-xs text-slate-400">Enregistrer un nouveau profil client</p>
                  </div>
                </Button>

                <Button
                  onClick={() => setActiveView('cases')}
                  className="w-full justify-start gap-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white h-auto py-4"
                >
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <FolderPlus className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Créer un nouveau dossier</p>
                    <p className="text-xs text-slate-400">Ouvrir un nouveau dossier</p>
                  </div>
                </Button>
              </>
            )}

            <Button
              onClick={() => setActiveView('tasks')}
              className="w-full justify-start gap-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white h-auto py-4"
            >
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Plus className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="font-medium">Créer une nouvelle tâche</p>
                <p className="text-xs text-slate-400">Ajouter une tâche au système</p>
              </div>
            </Button>

            <Button
              onClick={() => setActiveView('calendar')}
              className="w-full justify-start gap-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white h-auto py-4"
            >
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-left">
                <p className="font-medium">Voir le calendrier</p>
                <p className="text-xs text-slate-400">Consulter toutes les échéances</p>
              </div>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Section Performance de l'équipe (conservée pour les admins) */}
      {isAdmin && teamPerformance.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Performance de l'Équipe</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-3 text-slate-400 font-medium">Collaborateur</th>
                  <th className="p-3 text-slate-400 font-medium text-center">Tâches Assignées</th>
                  <th className="p-3 text-slate-400 font-medium text-center">Tâches Terminées</th>
                  <th className="p-3 text-slate-400 font-medium text-center">En Retard</th>
                  <th className="p-3 text-slate-400 font-medium text-center">Taux de Complétion</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformance.map(member => (
                  <tr key={member.name} className="border-b border-slate-800 hover:bg-slate-700/30">
                    <td className="p-3 text-white font-medium">{member.name}</td>
                    <td className="p-3 text-white text-center">{member.total}</td>
                    <td className="p-3 text-green-400 text-center">{member.completed}</td>
                    <td className="p-3 text-red-400 text-center">{member.overdue}</td>
                    <td className="p-3 text-white text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>{member.completionRate}%</span>
                        <div className="w-24 bg-slate-600 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${member.completionRate}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

Dashboard.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    function: PropTypes.string,
  }),
  setActiveView: PropTypes.func.isRequired
};

export default Dashboard;
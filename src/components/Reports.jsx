import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, FileText, Download, Users, CheckSquare, Briefcase, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Bar, 
  BarChart as RechartsBarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Pie, 
  PieChart as RechartsPieChart, 
  Cell 
} from 'recharts';
import { supabase } from '@/lib/customSupabaseClient';
import Papa from 'papaparse';
import { startOfMonth, startOfQuarter, startOfYear, isWithinInterval, getYear, startOfWeek, endOfMonth, endOfQuarter, endOfYear, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

const formatCurrency = (value) => {
  if (Number.isNaN(value) || value === null) return '0 F CFA';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value);
};

const startOfSemester = (date) => {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month < 6) {
    return new Date(year, 0, 1);
  } else {
    return new Date(year, 6, 1);
  }
};

const Reports = ({ currentUser }) => {
  const [activeReport, setActiveReport] = useState('overview');
  const [data, setData] = useState({ tasks: [], cases: [], team: [], invoices: [] });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les tâches avec tous les détails nécessaires pour les calculs de performance
        const { data: tasks, error: tasksError } = await supabase.from('tasks').select('*');
        if (tasksError) {
          console.error('Erreur lors de la récupération des tâches:', tasksError);
          toast({
            variant: "destructive", 
            title: "Erreur", 
            description: "Impossible de charger les données des tâches."
          });
        }

        const { data: cases, error: casesError } = await supabase.from('cases').select('*');
        if (casesError) {
          console.error('Erreur lors de la récupération des dossiers:', casesError);
        }
        
        // Récupérer l'équipe en excluant les admins (même logique que Dashboard.jsx)
        const { data: teamData, error: teamError } = await supabase.from('profiles').select('id, name, role');
        if (teamError) {
          console.error('Erreur lors de la récupération de l\'équipe:', teamError);
        }
        const team = (teamData || []).filter(member => member.role !== 'admin');
        
        // Récupérer les vraies factures depuis Supabase
        const { data: invoicesData, error: invoicesError } = await supabase.from('invoices').select('*');
        if (invoicesError) {
          console.error('Erreur lors de la récupération des factures:', invoicesError);
          toast({
            variant: "destructive", 
            title: "Erreur", 
            description: "Impossible de charger les factures."
          });
        }
        
        // Mapper les factures au format attendu par les rapports
        const invoices = (invoicesData || []).map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          clientName: inv.client_name,
          caseId: inv.case_id,
          totalTTC: inv.total_ttc || 0,
          date: inv.date || inv.created_at,
          payment: {
            provision: inv.provision || false,
            provisionAmount: inv.provision_amount || 0
          }
        }));
        
        setData({ 
          tasks: tasks || [], 
          cases: cases || [], 
          team: team || [], 
          invoices: invoices 
        });
      } catch (error) {
        console.error('Erreur générale lors de la récupération des données:', error);
        toast({
          variant: "destructive", 
          title: "Erreur", 
          description: "Impossible de charger les données du rapport."
        });
      }
    };
    
    fetchData();
  }, []);

  const financialData = useMemo(() => {
    const invoices = data.invoices;

    const collected = (period) => invoices
      .filter(inv => isWithinInterval(new Date(inv.date), period))
      .reduce((sum, inv) => sum + (inv.payment?.provisionAmount || 0), 0);

    const totalCollected = invoices.reduce((sum, inv) => sum + (inv.payment?.provisionAmount || 0), 0);
    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0);
    const totalOutstanding = totalBilled - totalCollected;

    const monthDate = new Date(selectedYear, selectedMonth, 1);
    const quarterDate = new Date(selectedYear, selectedQuarter * 3, 1);

    return {
      collectedForSelectedMonth: collected({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) }),
      collectedForSelectedQuarter: collected({ start: startOfQuarter(quarterDate), end: endOfQuarter(quarterDate) }),
      totalOutstanding,
      totalRevenue: totalBilled,
    };
  }, [data.invoices, selectedYear, selectedMonth, selectedQuarter]);

  const taskStatusData = [
    { name: 'En attente', value: data.tasks.filter(t => t.status === 'pending').length },
    { name: 'Vue', value: data.tasks.filter(t => t.status === 'seen').length },
    { name: 'En cours', value: data.tasks.filter(t => t.status === 'in-progress').length },
    { name: 'Terminées', value: data.tasks.filter(t => t.status === 'completed').length },
  ];

  const taskPriorityData = [
    { name: 'Faible', value: data.tasks.filter(t => t.priority === 'low').length },
    { name: 'Moyenne', value: data.tasks.filter(t => t.priority === 'medium').length },
    { name: 'Élevée', value: data.tasks.filter(t => t.priority === 'high').length },
    { name: 'Urgente', value: data.tasks.filter(t => t.priority === 'urgent').length },
  ];

  const taskCategoryData = data.tasks.reduce((acc, task) => {
    const category = task.main_category || 'Non défini';
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: category, value: 1 });
    }
    return acc;
  }, []);

  // Calculs de performance de l'équipe (même logique que Dashboard.jsx)
  const teamPerformanceData = data.team.map(member => {
    const now = new Date();
    const memberTasks = data.tasks.filter(t => t.assigned_to_id === member.id);
    const completed = memberTasks.filter(t => t.status === 'completed').length;
    const overdue = memberTasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'completed').length;
    const completionRate = memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0;
    
    return {
      name: member.name ? member.name.split(' ')[0] : 'N/A',
      'Tâches assignées': memberTasks.length,
      'Tâches terminées': completed,
      'Tâches en retard': overdue,
      'Taux de complétion (%)': completionRate,
    };
  });

  const handleExport = () => {
    let csvData, filename;
    switch (activeReport) {
      case 'activity':
        // Enrichir les données d'export avec des statistiques globales
        const activityExportData = [
          { Type: 'RÉSUMÉ GLOBAL' },
          { Indicateur: 'Total des tâches', Valeur: data.tasks.length },
          { Indicateur: 'Tâches terminées', Valeur: data.tasks.filter(t => t.status === 'completed').length },
          { Indicateur: 'Tâches en cours', Valeur: data.tasks.filter(t => t.status === 'in-progress').length },
          { Indicateur: 'Tâches en attente', Valeur: data.tasks.filter(t => t.status === 'pending').length },
          { Indicateur: 'Membres d\'équipe actifs', Valeur: data.team.length },
          { Type: '' },
          { Type: 'PERFORMANCE PAR MEMBRE' },
          ...teamPerformanceData.map(member => ({
            Membre: member.name,
            'Tâches assignées': member['Tâches assignées'],
            'Tâches terminées': member['Tâches terminées'],
            'Tâches en retard': member['Tâches en retard'],
            'Taux de complétion': `${member['Taux de complétion (%)']}%`
          }))
        ];
        csvData = Papa.unparse(activityExportData);
        filename = 'rapport_activite_equipe.csv';
        break;
      case 'distribution':
        const distributionData = [
          { type: 'Statut', ...Object.fromEntries(taskStatusData.map(d => [d.name, d.value])) },
          { type: 'Priorité', ...Object.fromEntries(taskPriorityData.map(d => [d.name, d.value])) },
          { type: 'Catégorie', ...Object.fromEntries(taskCategoryData.map(d => [d.name, d.value])) },
        ];
        csvData = Papa.unparse(distributionData);
        filename = 'rapport_repartition_taches.csv';
        break;
      case 'finances':
        const finData = [
          { Indicateur: `Encaissé (${fr.localize.month(selectedMonth, { width: 'abbreviated' })} ${selectedYear})`, Valeur: financialData.collectedForSelectedMonth },
          { Indicateur: `Encaissé (T${selectedQuarter + 1} ${selectedYear})`, Valeur: financialData.collectedForSelectedQuarter },
          { Indicateur: 'Total Non-Encaissé', Valeur: financialData.totalOutstanding },
          { Indicateur: 'Chiffre d\'Affaires Global', Valeur: financialData.totalRevenue },
        ];
        csvData = Papa.unparse(finData);
        filename = 'rapport_financier.csv';
        break;
      case 'overview':
        const overviewData = [
          { 'Indicateur': 'Tâches totales', 'Valeur': data.tasks.length },
          { 'Indicateur': 'Dossiers actifs', 'Valeur': data.cases.filter(c => c.status === 'active').length },
          { 'Indicateur': 'Membres de l\'équipe', 'Valeur': data.team.length },
        ];
        csvData = Papa.unparse(overviewData);
        filename = 'rapport_vue_ensemble.csv';
        break;
      default:
        toast({
          title: "Exportation non disponible",
          description: "Il n'y a pas de données à exporter pour cette vue.",
        });
        return;
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    toast({
      title: "✅ Exportation réussie",
      description: `Le fichier ${filename} a été téléchargé.`,
    });
  };

  const COLORS_STATUS = ['#fb923c', '#a855f7', '#38bdf8', '#4ade80'];
  const COLORS_PRIORITY = ['#22c55e', '#facc15', '#f97316', '#ef4444'];
  const COLORS_CATEGORY = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#64748b'];

  const renderContent = () => {
    switch (activeReport) {
      case 'finances':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-700/30 rounded-lg">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-300 mb-1">Mois</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number.parseInt(e.target.value, 10))} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i} className="capitalize">{fr.localize.month(i, { width: 'wide' })}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-300 mb-1">Trimestre</label>
                <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number.parseInt(e.target.value, 10))} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['1er Trimestre', '2ème Trimestre', '3ème Trimestre', '4ème Trimestre'].map((q, i) => (
                    <option key={i} value={i}>{q}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-300 mb-1">Année</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number.parseInt(e.target.value, 10))} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[2023, 2024, 2025].map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <StatCard icon={DollarSign} title={`Encaissé (${fr.localize.month(selectedMonth, { width: 'abbreviated' })} ${selectedYear})`} value={formatCurrency(financialData.collectedForSelectedMonth)} color="text-green-400" />
              <StatCard icon={DollarSign} title={`Encaissé (T${selectedQuarter + 1} ${selectedYear})`} value={formatCurrency(financialData.collectedForSelectedQuarter)} color="text-green-400" />
              <StatCard icon={DollarSign} title="Non-encaissé" value={formatCurrency(financialData.totalOutstanding)} color="text-yellow-400" />
              <StatCard icon={DollarSign} title="Chiffre d'Affaires" value={formatCurrency(financialData.totalRevenue)} color="text-blue-400" />
            </div>
          </motion.div>
        );
      case 'activity':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard 
                icon={CheckSquare} 
                title="Total des tâches" 
                value={data.tasks.length} 
                color="text-blue-400" 
              />
              <StatCard 
                icon={Users} 
                title="Membres actifs" 
                value={data.team.length} 
                color="text-purple-400" 
              />
              <StatCard 
                icon={TrendingUp} 
                title="Taux moyen de complétion" 
                value={`${teamPerformanceData.length > 0 ? Math.round(teamPerformanceData.reduce((sum, member) => sum + member['Taux de complétion (%)'], 0) / teamPerformanceData.length) : 0}%`} 
                color="text-green-400" 
              />
            </div>
            <div className="h-96 bg-slate-800/50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-4">Performance détaillée de l'équipe</h4>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={teamPerformanceData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [
                      typeof value === 'number' && name === 'Taux de complétion (%)' ? `${value}%` : value,
                      name
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="Tâches assignées" fill="#3b82f6" name="Assignées" />
                  <Bar dataKey="Tâches terminées" fill="#22c55e" name="Terminées" />
                  <Bar dataKey="Tâches en retard" fill="#ef4444" name="En retard" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );
      case 'distribution':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PieChartCard title="Par Statut" data={taskStatusData} colors={COLORS_STATUS} />
            <PieChartCard title="Par Priorité" data={taskPriorityData} colors={COLORS_PRIORITY} />
            <PieChartCard title="Par Catégorie" data={taskCategoryData} colors={COLORS_CATEGORY} />
          </motion.div>
        );
      case 'trends':
        return <div className="text-center text-slate-400 p-10 bg-slate-800/50 rounded-lg">Graphique des tendances à venir.</div>;
      case 'overview':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard icon={CheckSquare} title="Tâches totales" value={data.tasks.length} />
            <StatCard icon={Briefcase} title="Dossiers actifs" value={data.cases.filter(c => c.status === 'active').length} />
            <StatCard icon={Users} title="Membres de l'équipe" value={data.team.length} />
          </div>
        );
    }
  };

  const reportOptions = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'finances', label: 'Finances', icon: DollarSign },
    { id: 'activity', label: 'Activité', icon: TrendingUp },
    { id: 'distribution', label: 'Répartition', icon: PieChart },
    { id: 'trends', label: 'Tendances', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rapports & Analyses</h1>
          <p className="text-slate-400">Analysez les performances de votre cabinet</p>
        </div>
        <Button onClick={handleExport} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex space-x-2 border-b border-slate-700 mb-6 overflow-x-auto">
          {reportOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveReport(opt.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeReport === opt.id
                  ? 'border-b-2 border-blue-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </button>
          ))}
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color = 'text-blue-400' }) => (
  <div className="bg-slate-700/30 rounded-lg p-6">
    <Icon className={`w-8 h-8 ${color} mb-3`} />
    <p className="text-3xl font-bold text-white">{value}</p>
    <h4 className="text-slate-400 font-semibold">{title}</h4>
  </div>
);

const PieChartCard = ({ title, data, colors }) => (
  <div className="h-96 bg-slate-800/50 p-4 rounded-lg">
    <h4 className="text-lg font-semibold text-white text-center mb-4">{title}</h4>
    <ResponsiveContainer width="100%" height="85%">
      <RechartsPieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  </div>
);

export default Reports;
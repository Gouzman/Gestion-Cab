import React, { useState, useEffect, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, View } from 'lucide-react';
    import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, addWeeks, subWeeks, eachDayOfInterval, setHours, setMinutes, getDay } from 'date-fns';
    import { fr } from 'date-fns/locale';
    import { Button } from '@/components/ui/button';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import EventForm from '@/components/EventForm';

    const Calendar = ({ currentUser }) => {
      const [currentDate, setCurrentDate] = useState(new Date());
      const [view, setView] = useState('month'); // 'month' or 'week'
      const [events, setEvents] = useState([]);
      const [tasks, setTasks] = useState([]);
      const [showEventForm, setShowEventForm] = useState(false);

      const isGerantOrAssocie = currentUser && (currentUser.function === 'Gerant' || currentUser.function === 'Associe Emerite');
      const isAdmin = isGerantOrAssocie || (currentUser.role && currentUser.role.toLowerCase() === 'admin');

      const fetchData = useCallback(async () => {
      const fetchTasks = async () => {
        let query = supabase.from('tasks').select('id, title, deadline, priority, status, created_at').not('deadline', 'is', null);
        if (!isAdmin) {
          // Filtrer : assigned_to_id OU dans assigned_to_ids OU dans visible_by_ids
          query = query.or(`assigned_to_id.eq.${currentUser.id},assigned_to_ids.cs.{${currentUser.id}},visible_by_ids.cs.{${currentUser.id}}`);
        }
        const { data, error } = await query;
        if (error) {
          toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les tâches." });
          return [];
        }
        return data.map(t => ({ 
          ...t, 
          type: 'task',
          // Utiliser deadline pour l'affichage sur le calendrier (date d'échéance)
          display_time: t.deadline,
          // Vérifier si la deadline est dépassée
          isOverdue: new Date(t.deadline) < new Date() && t.status !== 'completed'
        }));
      };        const fetchEvents = async () => {
          let query = supabase.from('calendar_events').select('*');
          const { data, error } = await query;
          if (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les événements." });
            return [];
          }
          
          // Filtrer les événements visibles par l'utilisateur
          const userVisibleEvents = data.filter(e => 
            e.created_by === currentUser.id || 
            (e.attendees && e.attendees.includes(currentUser.id)) ||
            isAdmin
          );

          // Utiliser start_time pour l'affichage temporel
          return userVisibleEvents.map(e => ({ 
            ...e, 
            type: 'event', 
            deadline: e.start_time, 
            display_time: e.start_time 
          }));
        };

        const [taskData, eventData] = await Promise.all([fetchTasks(), fetchEvents()]);
        setTasks(taskData);
        setEvents(eventData);
      }, [currentUser, isAdmin]);

      useEffect(() => {
        fetchData();
      }, [currentDate, fetchData]);

      // Écouter les événements de création/modification de tâches pour rafraîchir le calendrier
      useEffect(() => {
        const handleTaskUpdate = (event) => {
          console.log('✅ Nouvelle tâche détectée, rafraîchissement du calendrier...', event.detail);
          fetchData();
        };

        window.addEventListener('taskCreated', handleTaskUpdate);
        window.addEventListener('taskUpdated', handleTaskUpdate);
        window.addEventListener('taskDeleted', handleTaskUpdate);

        return () => {
          window.removeEventListener('taskCreated', handleTaskUpdate);
          window.removeEventListener('taskUpdated', handleTaskUpdate);
          window.removeEventListener('taskDeleted', handleTaskUpdate);
        };
      }, [fetchData]);

      const handleEventCreated = () => {
        setShowEventForm(false);
        fetchData();
      };

      const renderHeader = () => {
        const dateFormat = view === 'month' ? "MMMM yyyy" : "MMMM yyyy";
        return (
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => view === 'month' ? setCurrentDate(subMonths(currentDate, 1)) : setCurrentDate(subWeeks(currentDate, 1))}>
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </Button>
            <span className="text-2xl font-bold text-white capitalize">
              {format(currentDate, dateFormat, { locale: fr })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => view === 'month' ? setCurrentDate(addMonths(currentDate, 1)) : setCurrentDate(addWeeks(currentDate, 1))}>
              <ChevronRight className="w-6 h-6 text-slate-300" />
            </Button>
          </div>
        );
      };

      const renderDays = () => {
        const days = [];
        const dateFormat = "EEEE";
        const startDate = startOfWeek(currentDate, { locale: fr });
        for (let i = 0; i < 7; i++) {
          days.push(
            <div className="text-center text-sm font-medium text-slate-400 capitalize" key={i}>
              {format(addDays(startDate, i), dateFormat, { locale: fr })}
            </div>
          );
        }
        return <div className="grid grid-cols-7 gap-2">{days}</div>;
      };

      const getMonthItemClassName = (item) => {
        if (item.type === 'task') {
          // Si la deadline est dépassée et que la tâche n'est pas complétée, afficher en rouge foncé
          if (item.isOverdue) {
            return 'bg-red-700/90 text-white border border-red-400';
          }
          switch (item.priority) {
            case 'urgent': return 'bg-red-500/70 text-white';
            case 'high': return 'bg-orange-500/70 text-white';
            case 'medium': return 'bg-yellow-500/70 text-slate-900';
            default: return 'bg-green-500/70 text-white';
          }
        }
        return 'bg-purple-500/70 text-white';
      };

      const getEventTooltip = (item) => {
        const itemTime = parseISO(item.display_time);
        const metadata = item.metadata || {};
        
        let tooltip = `${item.type === 'task' ? '📝 Tâche' : '📅 Événement'}: ${item.title}\n`;
        
        if (item.type === 'task') {
          tooltip += `⏰ Échéance: ${format(itemTime, 'dd/MM/yyyy à HH:mm', { locale: fr })}\n`;
          if (item.isOverdue) {
            tooltip += `⚠️ DEADLINE DÉPASSÉE\n`;
          }
          tooltip += `📊 Priorité: ${item.priority === 'urgent' ? 'Urgente' : item.priority === 'high' ? 'Haute' : item.priority === 'medium' ? 'Moyenne' : 'Normale'}\n`;
          tooltip += `📋 Statut: ${item.status === 'completed' ? 'Complétée' : item.status === 'in_progress' ? 'En cours' : 'En attente'}\n`;
        } else {
          tooltip += `📆 ${format(itemTime, 'dd/MM/yyyy à HH:mm', { locale: fr })}\n`;
        }
        
        if (item.description) {
          tooltip += `💬 Description: ${item.description}\n`;
        }
        
        if (metadata.location) {
          tooltip += `📍 Lieu: ${metadata.location}\n`;
        }
        
        if (metadata.linked_cases && metadata.linked_cases.length > 0) {
          tooltip += `📂 Dossier(s): ${metadata.linked_cases.length} lié(s)\n`;
        }
        
        if (metadata.linked_files && metadata.linked_files.length > 0) {
          tooltip += `📎 Fichier(s): ${metadata.linked_files.length} joint(s)\n`;
        }
        
        if (metadata.attendees && metadata.attendees.length > 0) {
          tooltip += `👥 Participants: ${metadata.attendees.length}\n`;
        }
        
        return tooltip;
      };

      const renderMonthCells = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: fr });
        const endDate = endOfWeek(monthEnd, { locale: fr });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
          for (let i = 0; i < 7; i++) {
            const cloneDay = day;
            const dayItems = [...tasks, ...events].filter(item => isSameDay(parseISO(item.display_time), cloneDay));

            days.push(
              <div
                className={`p-2 h-32 border border-slate-700/50 rounded-lg flex flex-col overflow-hidden transition-colors duration-200 ${
                  !isSameMonth(day, monthStart) ? "bg-slate-800/30" : "bg-slate-800/60 hover:bg-slate-700/50"
                } ${isSameDay(day, new Date()) ? "border-blue-500" : ""}`}
                key={day.toString()}
              >
                <span className={`font-semibold ${!isSameMonth(day, monthStart) ? "text-slate-600" : "text-slate-300"}`}>
                  {format(day, "d")}
                </span>
                <div className="flex-grow overflow-y-auto mt-1 space-y-1 pr-1">
                  {dayItems
                    .sort((a, b) => new Date(a.display_time) - new Date(b.display_time))
                    .map(item => {
                      const itemTime = parseISO(item.display_time);
                      return (
                        <div 
                          key={`${item.type}-${item.id}`} 
                          className={`px-1.5 py-0.5 text-xs rounded-md mb-1 ${getMonthItemClassName(item)} cursor-pointer hover:opacity-90 transition-opacity`}
                          title={getEventTooltip(item)}
                        >
                          <div className="font-semibold text-xs flex items-center justify-between">
                            <span>{format(itemTime, 'HH:mm')}</span>
                            {item.type === 'task' && (
                              <span className="text-xs opacity-75">
                                {item.isOverdue ? '⏰' : getPriorityEmoji(item.priority)}
                              </span>
                            )}
                          </div>
                          <div className="truncate flex items-center gap-1">
                            {item.type === 'task' && <span className="text-[10px]">📝</span>}
                            <span>{item.title}</span>
                          </div>
                          {item.type === 'task' && (
                            <div className="text-[10px] opacity-75 mt-0.5">
                              Échéance: {format(itemTime, 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
            day = addDays(day, 1);
          }
          rows.push(<div className="grid grid-cols-7 gap-2" key={day.toString()}>{days}</div>);
          days = [];
        }
        return <div className="space-y-2">{rows}</div>;
      };

      const getPriorityEmoji = (priority) => {
        switch (priority) {
          case 'urgent': return '🔴';
          case 'high': return '🟠';
          case 'medium': return '🟡';
          default: return '🟢';
        }
      };

      const getItemClassName = (item) => {
        if (item.type === 'task') {
          // Si la deadline est dépassée et que la tâche n'est pas complétée, afficher en rouge foncé
          if (item.isOverdue) {
            return 'bg-red-700/90 text-white border border-red-400';
          }
          switch (item.priority) {
            case 'urgent': return 'bg-red-500/80 text-white';
            case 'high': return 'bg-orange-500/80 text-white';
            case 'medium': return 'bg-yellow-500/80 text-slate-900';
            default: return 'bg-green-500/80 text-white';
          }
        }
        return 'bg-purple-500/80 text-white';
      };

      const renderWeekView = () => {
        const weekDays = eachDayOfInterval({
          start: startOfWeek(currentDate, { locale: fr }),
          end: endOfWeek(currentDate, { locale: fr }),
        });
        // Plage horaire optimisée : 6h à 22h (17 heures)
        const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 06h to 22h

        return (
          <div className="flex">
            <div className="flex flex-col">
              <div className="h-12"></div>
              {hours.map(hour => (
                <div key={hour} className="h-12 flex items-center justify-center text-xs text-slate-400 pr-2">
                  {format(setHours(new Date(), hour), 'HH:mm')}
                </div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7">
              {weekDays.map(day => (
                <div key={day.toString()} className="flex flex-col border-l border-slate-700/50">
                  <div className={`h-12 text-center p-2 ${isSameDay(day, new Date()) ? 'text-blue-400' : 'text-slate-300'}`}>
                    <p className="font-semibold text-lg">{format(day, 'd')}</p>
                    <p className="text-xs capitalize">{format(day, 'EEE', { locale: fr })}</p>
                  </div>
                  <div className="relative flex-1">
                    {hours.map(hour => (
                      <div key={hour} className="h-12 border-t border-slate-700/50"></div>
                    ))}
                    {[...tasks, ...events]
                      .filter(item => isSameDay(parseISO(item.display_time), day))
                      .map(item => {
                        const itemDate = parseISO(item.display_time);
                        const hoursSince6am = itemDate.getHours() - 6; // Ajustement pour commencer à 6h
                        const top = (hoursSince6am + itemDate.getMinutes() / 60) * 3; // 3rem (h-12) per hour
                        
                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            className={`absolute w-full p-1 text-xs rounded-md z-10 cursor-pointer hover:opacity-90 transition-opacity ${getItemClassName(item)}`}
                            style={{ top: `${top}rem` }}
                            title={getEventTooltip(item)}
                          >
                            <div className="font-semibold flex items-center justify-between">
                              <span>{format(itemDate, 'HH:mm')}</span>
                              {item.type === 'task' && (
                                <span className="text-xs">
                                  {item.isOverdue ? '⏰' : getPriorityEmoji(item.priority)}
                                </span>
                              )}
                            </div>
                            <div className="truncate flex items-center gap-1">
                              {item.type === 'task' && <span className="text-[10px]">📝</span>}
                              <span>{item.title}</span>
                            </div>
                            {item.type === 'task' && (
                              <div className="text-[10px] opacity-75">
                                Échéance: {format(itemDate, 'dd/MM/yyyy')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      };

      return (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Agenda</h1>
                <p className="text-slate-400">Visualisez vos échéances et événements</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-slate-700/50 p-1 rounded-lg flex gap-1">
                  <Button size="sm" variant={view === 'week' ? 'secondary' : 'ghost'} onClick={() => setView('week')}>Semaine</Button>
                  <Button size="sm" variant={view === 'month' ? 'secondary' : 'ghost'} onClick={() => setView('month')}>Mois</Button>
                </div>
                <Button 
                  onClick={() => setShowEventForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel Événement
                </Button>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              {renderHeader()}
              {view === 'month' && renderDays()}
              <div className="mt-2">
                {view === 'month' ? renderMonthCells() : renderWeekView()}
              </div>
            </div>
          </motion.div>
          {showEventForm && (
            <EventForm 
              currentUser={currentUser}
              onCancel={() => setShowEventForm(false)}
              onEventCreated={handleEventCreated}
            />
          )}
        </>
      );
    };

    export default Calendar;
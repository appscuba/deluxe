
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Appointment, Treatment, User } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PhoneCall, 
  TrendingUp,
  DollarSign,
  Briefcase,
  UserPlus,
  Trash2,
  Calendar as CalendarIcon
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { appointments, setAppointments, treatments, addNotification, allUsers, setAllUsers } = useAppContext();
  const [filter, setFilter] = useState<Appointment['status'] | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'daily' | 'stats' | 'users'>('daily');
  
  const todayStr = new Date().toISOString().split('T')[0];

  const statsSummary = useMemo(() => {
    const todayApps = appointments.filter(a => a.date === todayStr);
    const todayCompleted = todayApps.filter(a => a.status === 'completed');
    
    const totalEarningsToday = todayCompleted.reduce((acc, curr) => {
      const t = treatments.find(tr => tr.id === curr.treatmentId);
      return acc + (t?.price || 0);
    }, 0);

    const totalHistoricalEarnings = appointments
      .filter(a => a.status === 'completed')
      .reduce((acc, curr) => {
        const t = treatments.find(tr => tr.id === curr.treatmentId);
        return acc + (t?.price || 0);
      }, 0);

    return {
      todayCount: todayApps.length,
      todayEarnings: totalEarningsToday,
      totalHistoricalEarnings,
      pendingCount: appointments.filter(a => a.status === 'pending').length,
    };
  }, [appointments, treatments, todayStr]);

  const earningsChartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return months.map((m, i) => ({
      name: m,
      earnings: i === 5 ? statsSummary.totalHistoricalEarnings : Math.floor(Math.random() * 5000) + 2000,
    }));
  }, [statsSummary.totalHistoricalEarnings]);

  const updateStatus = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        addNotification(app.clientId, `Cita Actualizada`, `Tu cita ha sido marcada como ${newStatus}.`, 'status_change');
        return { ...app, status: newStatus };
      }
      return app;
    }));
  };

  const filteredAppointments = appointments
    .filter(a => filter === 'all' || a.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="pb-24 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Panel de Gestión</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Administración Deluxe Dental</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-sky-100 flex flex-col justify-between h-40">
          <DollarSign size={24} className="opacity-50" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ganancia Hoy</p>
            <p className="text-3xl font-black tracking-tight">${statsSummary.todayEarnings}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <Briefcase size={24} className="text-indigo-500 opacity-50" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Servicios Hoy</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{statsSummary.todayCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <Clock size={24} className="text-amber-500 opacity-50" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendientes</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{statsSummary.pendingCount}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 flex flex-col justify-between h-40">
          <TrendingUp size={24} className="text-emerald-400 opacity-50" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Histórico</p>
            <p className="text-3xl font-black tracking-tight">${statsSummary.totalHistoricalEarnings}</p>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] backdrop-blur-sm sticky top-0 z-30">
        <button onClick={() => setActiveTab('daily')} className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'daily' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>Agenda</button>
        <button onClick={() => setActiveTab('stats')} className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>Estadísticas</button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>Pacientes</button>
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-900 text-xl">Citas Programadas</h3>
            <div className="flex gap-2">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}>Todas</button>
              <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filter === 'pending' ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-400 border-slate-200'}`}>Pendientes</button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAppointments.length > 0 ? filteredAppointments.map((app) => (
              <div key={app.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-sky-200 hover:shadow-xl hover:shadow-sky-50/50 group">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 rounded-[1.8rem] bg-slate-50 flex items-center justify-center font-black text-sky-500 border border-slate-100 shadow-inner text-xl group-hover:bg-sky-50 transition-colors">{app.clientName.charAt(0)}</div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 leading-tight">{app.clientName}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{app.startTime}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <span className="text-[10px] text-sky-500 font-black uppercase tracking-widest">{treatments.find(t => t.id === app.treatmentId)?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {app.status === 'pending' ? (
                    <div className="flex space-x-2">
                      <button onClick={() => updateStatus(app.id, 'approved')} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors"><CheckCircle2 size={20} /></button>
                      <button onClick={() => updateStatus(app.id, 'rejected')} className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors"><XCircle size={20} /></button>
                    </div>
                  ) : (
                    <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                      app.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                      app.status === 'approved' ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {app.status === 'approved' ? 'Confirmada' : app.status}
                    </span>
                  )}
                </div>
              </div>
            )) : <div className="col-span-full py-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.3em]">No hay citas en esta lista</div>}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 text-xl mb-8">Crecimiento de Ingresos</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsChartData}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                    itemStyle={{fontWeight: '900', color: '#0ea5e9'}}
                    labelStyle={{fontWeight: '900', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px'}}
                  />
                  <Area type="monotone" dataKey="earnings" stroke="#0ea5e9" strokeWidth={5} fillOpacity={1} fill="url(#colorEarnings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-900 text-xl">Base de Pacientes</h3>
            <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"><UserPlus size={16} />Añadir</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers.map((user) => (
              <div key={user.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black border border-slate-100 ${user.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>{user.name.charAt(0)}</div>
                  <div>
                    <h4 className="text-md font-black text-slate-800 leading-tight">{user.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{user.role}</p>
                  </div>
                </div>
                <button onClick={() => setAllUsers(prev => prev.filter(u => u.id !== user.id))} className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-2xl transition-all"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="fixed bottom-10 right-10 w-20 h-20 bg-sky-500 text-white rounded-[2.5rem] shadow-2xl shadow-sky-300 flex items-center justify-center active:scale-90 transition-all z-40 border-[6px] border-white ring-1 ring-slate-100">
        <PhoneCall size={30} />
      </button>
    </div>
  );
};

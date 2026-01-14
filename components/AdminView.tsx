
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
  Calendar as CalendarIcon,
  TrendingUp,
  DollarSign,
  Briefcase,
  ChevronRight,
  Download,
  CheckCircle,
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { appointments, setAppointments, treatments, addNotification, allUsers, setAllUsers } = useAppContext();
  const [filter, setFilter] = useState<Appointment['status'] | 'all'>('all');
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'stats' | 'users'>('daily');
  
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'client' as 'client' | 'admin'
  });

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

  const treatmentPopularityData = useMemo(() => {
    return treatments.map(t => ({
      name: t.name,
      count: appointments.filter(a => a.treatmentId === t.id).length
    }));
  }, [appointments, treatments]);

  const updateStatus = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        addNotification(app.clientId, `Cita Actualizada`, `Tu cita del ${app.date} ha sido marcada como ${newStatus}.`, 'status_change');
        return { ...app, status: newStatus };
      }
      return app;
    }));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUserForm.name,
      email: newUserForm.email,
      phone: newUserForm.phone,
      role: newUserForm.role,
      createdAt: new Date().toISOString()
    };
    setAllUsers(prev => [...prev, newUser]);
    setShowUserModal(false);
    setNewUserForm({ name: '', email: '', phone: '', role: 'client' });
  };

  const deleteUser = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setAllUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const filteredAppointments = appointments
    .filter(a => filter === 'all' || a.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="pb-24 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Console</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Deluxe Dental Care Management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-sky-500 p-5 rounded-[2.5rem] text-white shadow-xl shadow-sky-100">
          <DollarSign size={24} className="mb-4 opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ganancia Hoy</p>
          <p className="text-2xl font-black tracking-tight">${statsSummary.todayEarnings}</p>
        </div>
        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Briefcase size={24} className="mb-4 text-indigo-500 opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Servicios Hoy</p>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{statsSummary.todayCount}</p>
        </div>
        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Clock size={24} className="mb-4 text-amber-500 opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendientes</p>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{statsSummary.pendingCount}</p>
        </div>
        <div className="bg-slate-900 p-5 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200">
          <TrendingUp size={24} className="mb-4 text-emerald-400 opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Histórico</p>
          <p className="text-2xl font-black tracking-tight">${statsSummary.totalHistoricalEarnings}</p>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-3xl backdrop-blur-sm sticky top-0 z-30">
        <button onClick={() => setActiveTab('daily')} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'daily' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>Agenda</button>
        <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>Finanzas</button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>Usuarios</button>
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-900 text-lg">Citas de Hoy</h3>
            <button onClick={() => setFilter(filter === 'all' ? 'pending' : 'all')} className="text-[10px] font-black uppercase text-sky-500">{filter === 'all' ? 'Solo Pendientes' : 'Ver Todas'}</button>
          </div>
          <div className="space-y-3">
            {filteredAppointments.length > 0 ? filteredAppointments.map((app) => (
              <div key={app.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-sky-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-sky-500 border border-slate-100 shadow-inner">{app.clientName.charAt(0)}</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 leading-tight">{app.clientName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{treatments.find(t => t.id === app.treatmentId)?.name} • {app.startTime}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {app.status === 'pending' ? (
                    <div className="flex space-x-1">
                      <button onClick={() => updateStatus(app.id, 'approved')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={18} /></button>
                      <button onClick={() => updateStatus(app.id, 'rejected')} className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl"><XCircle size={18} /></button>
                    </div>
                  ) : app.status === 'approved' ? (
                    <button onClick={() => updateStatus(app.id, 'completed')} className="px-4 py-2 bg-sky-50 text-sky-600 rounded-2xl text-[10px] font-black uppercase">Finalizar</button>
                  ) : (
                    <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase ${app.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{app.status}</span>
                  )}
                </div>
              </div>
            )) : <div className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest italic">Vacío</div>}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 text-lg mb-6">Ingresos del Mes</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsChartData}>
                  <defs><linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient></defs>
                  <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="earnings" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorEarnings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-900 text-lg">Base de Usuarios</h3>
            <button onClick={() => setShowUserModal(true)} className="p-3 bg-sky-500 text-white rounded-2xl shadow-xl shadow-sky-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><UserPlus size={16} />Crear</button>
          </div>
          <div className="space-y-3">
            {allUsers.length > 0 ? allUsers.map((user) => (
              <div key={user.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border border-slate-100 ${user.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>{user.name.charAt(0)}</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 leading-tight">{user.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{user.role} • {user.email}</p>
                  </div>
                </div>
                <button onClick={() => deleteUser(user.id)} className="p-2.5 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-2xl transition-colors"><Trash2 size={18} /></button>
              </div>
            )) : <div className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest italic">Sin usuarios</div>}
          </div>
        </div>
      )}

      <button onClick={() => setShowManualBooking(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-sky-500 text-white rounded-[2rem] shadow-2xl shadow-sky-200 flex items-center justify-center active:scale-95 transition-all z-40 border-4 border-white"><PhoneCall size={24} /></button>
    </div>
  );
};

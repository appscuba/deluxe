
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Appointment, Treatment, User } from '../types';
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
  Calendar as CalendarIcon,
  Download,
  Plus,
  X,
  Users,
  Search,
  Settings
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminView: React.FC = () => {
  const { appointments, setAppointments, treatments, addNotification, allUsers } = useAppContext();
  const [filter, setFilter] = useState<Appointment['status'] | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'daily' | 'stats' | 'users' | 'slots'>('daily');
  
  // States for New Slot
  const [slotDate, setSlotDate] = useState('');
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('10:00');

  const todayStr = new Date().toISOString().split('T')[0];

  const statsSummary = useMemo(() => {
    const todayCompleted = appointments.filter(a => a.date === todayStr && a.status === 'completed');
    const earningsToday = todayCompleted.reduce((acc, curr) => acc + (treatments.find(t => t.id === curr.treatmentId)?.price || 0), 0);
    const pending = appointments.filter(a => a.status === 'pending').length;
    const totalHistorical = appointments.filter(a => a.status === 'completed').reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    return { earningsToday, todayCount: appointments.filter(a => a.date === todayStr).length, pending, totalHistorical };
  }, [appointments, treatments, todayStr]);

  const updateStatus = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        if (app.clientId) {
          addNotification(app.clientId, `Cita Actualizada`, `Tu cita ha sido ${newStatus}.`, 'status_change');
        }
        return { ...app, status: newStatus };
      }
      return app;
    }));
  };

  const createSlot = () => {
    if (!slotDate || !slotStart || !slotEnd) return;
    const newSlot: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      date: slotDate,
      startTime: slotStart,
      endTime: slotEnd,
      status: 'available',
      createdAt: new Date().toISOString(),
    };
    setAppointments(prev => [newSlot, ...prev]);
  };

  const deleteSlot = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const exportToCSV = () => {
    const headers = "ID,Cliente,Fecha,Hora,Estado,Sintomas\n";
    const rows = appointments.map(a => `${a.id},${a.clientName || 'N/A'},${a.date},${a.startTime},${a.status},${a.symptoms?.join(';') || ''}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Citas_DeluxeDental_${todayStr}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredAppointments = appointments
    .filter(a => a.status !== 'available' && (filter === 'all' || a.status === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const availableSlots = appointments
    .filter(a => a.status === 'available')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  return (
    <div className="pb-24 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Panel Administrativo</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Centro de Control Deluxe</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
        >
          <Download size={16} /> Reporte CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-sky-100 flex flex-col justify-between h-40">
          <DollarSign size={24} className="opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ingresos Hoy</p><p className="text-3xl font-black tracking-tight">${statsSummary.earningsToday}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <Clock size={24} className="text-amber-500 opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Solicitudes</p><p className="text-3xl font-black text-slate-800 tracking-tight">{statsSummary.pending}</p></div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 flex flex-col justify-between h-40">
          <TrendingUp size={24} className="text-emerald-400 opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Historico</p><p className="text-3xl font-black tracking-tight">${statsSummary.totalHistorical}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <Users size={24} className="text-sky-500 opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pacientes</p><p className="text-3xl font-black text-slate-800 tracking-tight">{allUsers.length}</p></div>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-[2.2rem] backdrop-blur-sm sticky top-0 z-30 overflow-x-auto no-scrollbar">
        {[
          { id: 'daily', label: 'Agenda' },
          { id: 'slots', label: 'Gestión de Turnos' },
          { id: 'users', label: 'Pacientes' },
          { id: 'stats', label: 'Analíticas' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-1 min-w-[120px] py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-900 text-xl">Gestión de Citas</h3>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-white border border-slate-200 rounded-xl px-6 py-2.5 text-[10px] font-black uppercase">
              <option value="all">Todas las Solicitudes</option>
              <option value="pending">Pendientes de Revisión</option>
              <option value="approved">Confirmadas</option>
            </select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAppointments.length > 0 ? filteredAppointments.map((app) => (
              <div key={app.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col space-y-4 hover:border-sky-200 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-slate-50 flex items-center justify-center font-black text-sky-500 border border-slate-100 text-xl">{app.clientName?.charAt(0)}</div>
                    <div>
                      <h4 className="text-xl font-black text-slate-800">{app.clientName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{app.date} • {app.startTime}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {app.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(app.id, 'approved')} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100"><CheckCircle2 size={20} /></button>
                        <button onClick={() => updateStatus(app.id, 'rejected')} className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100"><XCircle size={20} /></button>
                      </>
                    )}
                    {app.status === 'approved' && (
                      <span className="bg-sky-50 text-sky-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Confirmada</span>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Detalles del Paciente</p>
                  <div className="flex flex-wrap gap-2">
                    {app.symptoms?.map(s => <span key={s} className="bg-rose-50 text-rose-500 px-3 py-1 rounded-lg text-[9px] font-bold uppercase">{s}</span>)}
                    {app.improvements?.map(i => <span key={i} className="bg-emerald-50 text-emerald-500 px-3 py-1 rounded-lg text-[9px] font-bold uppercase">{i}</span>)}
                  </div>
                  {app.reason && <p className="mt-3 text-xs text-slate-500 font-medium italic">"{app.reason}"</p>}
                </div>
              </div>
            )) : <div className="col-span-full py-24 text-center text-slate-300 font-black uppercase text-xs">Sin registros que mostrar</div>}
          </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 h-fit space-y-6">
            <h3 className="text-xl font-black text-slate-900">Abrir Nuevo Turno</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                <input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inicio</label>
                  <input type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fin</label>
                  <input type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold" />
                </div>
              </div>
              <button onClick={createSlot} className="w-full py-5 bg-sky-500 text-white rounded-[2rem] font-black uppercase text-[11px] shadow-xl shadow-sky-100 hover:bg-sky-600 active:scale-95 transition-all">Publicar Disponibilidad</button>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-900 px-2">Turnos Disponibles Públicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableSlots.map(slot => (
                <div key={slot.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center font-black"><CalendarIcon size={20} /></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{slot.date}</p>
                      <p className="text-lg font-black text-slate-800">{slot.startTime} - {slot.endTime}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteSlot(slot.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
                </div>
              ))}
              {availableSlots.length === 0 && <div className="col-span-full py-20 text-center bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-300 font-black uppercase text-[10px]">No has publicado turnos aún</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-900 text-xl">Fichas de Pacientes</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Buscar paciente..." className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers.map((user) => (
              <div key={user.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black border border-slate-100 bg-slate-50 text-slate-400 text-xl`}>{user.name.charAt(0)}</div>
                  <div>
                    <h4 className="text-md font-black text-slate-800 leading-tight">{user.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{user.email}</p>
                  </div>
                </div>
                <button className="p-3 text-slate-300 hover:text-sky-500"><Settings size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


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
  Settings,
  MoreVertical,
  Stethoscope,
  Smile,
  BarChart,
  Activity,
  CalendarDays
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const AdminView: React.FC = () => {
  const { 
    appointments, 
    setAppointments, 
    treatments, 
    setTreatments, 
    addNotification, 
    allUsers, 
    activeTab,
    availability,
    setAvailability
  } = useAppContext();

  // Internal states for modals and helpers
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotDate, setSlotDate] = useState('');
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('09:45');
  const [searchTerm, setSearchTerm] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper: Get all actual bookings (not empty slots)
  const bookings = useMemo(() => {
    return appointments.filter(a => a.status !== 'available');
  }, [appointments]);

  // Helper: Get empty slots
  const availableSlots = useMemo(() => {
    return appointments.filter(a => a.status === 'available');
  }, [appointments]);

  // Analytics Helpers
  const statsSummary = useMemo(() => {
    const todayCompleted = bookings.filter(a => a.date === todayStr && a.status === 'completed');
    const earningsToday = todayCompleted.reduce((acc, curr) => {
      const t = treatments.find(tr => tr.id === curr.treatmentId);
      return acc + (t?.price || 0);
    }, 0);
    const pendingCount = bookings.filter(a => a.status === 'pending').length;
    const totalHistoricalEarnings = bookings.filter(a => a.status === 'completed').reduce((acc, curr) => {
      const t = treatments.find(tr => tr.id === curr.treatmentId);
      return acc + (t?.price || 0);
    }, 0);
    return { earningsToday, todayCount: bookings.filter(a => a.date === todayStr).length, pendingCount, totalHistoricalEarnings };
  }, [bookings, treatments, todayStr]);

  const chartData = useMemo(() => {
    // Generate last 7 days for a simple bar chart
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const count = bookings.filter(a => a.date === dStr).length;
      days.push({ name: dStr.split('-').slice(1).join('/'), citas: count });
    }
    return days;
  }, [bookings]);

  const updateStatus = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        if (app.clientId) {
          addNotification(app.clientId, `Actualización de Cita`, `Tu cita ha sido marcada como ${newStatus}.`, 'status_change');
        }
        return { ...app, status: newStatus };
      }
      return app;
    }));
  };

  const createSlot = (e: React.FormEvent) => {
    e.preventDefault();
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
    setShowSlotModal(false);
  };

  const removeAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Cliente,Fecha,Hora,Estado,Sintomas\n"
      + bookings.map(a => `${a.id},${a.clientName},${a.date},${a.startTime},${a.status},${a.symptoms?.join(';') || ''}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `deluxe_dental_report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- MODULE RENDERING ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-sky-100 flex flex-col justify-between h-40">
          <DollarSign size={24} className="opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ingresos Hoy</p><p className="text-3xl font-black tracking-tight">${statsSummary.earningsToday}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <Clock size={24} className="text-amber-500 opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendientes</p><p className="text-3xl font-black text-slate-800 tracking-tight">{statsSummary.pendingCount}</p></div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 flex flex-col justify-between h-40">
          <TrendingUp size={24} className="text-emerald-400 opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Histórico</p><p className="text-3xl font-black tracking-tight">${statsSummary.totalHistoricalEarnings}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <Users size={24} className="text-sky-500 opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pacientes</p><p className="text-3xl font-black text-slate-800 tracking-tight">{allUsers.length}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-900">Actividad Semanal</h3>
            <BarChart size={20} className="text-slate-300" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBar data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="citas" fill="#0ea5e9" radius={[10, 10, 10, 10]} barSize={24} />
              </RechartsBar>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6">Solicitudes Recientes</h3>
          <div className="space-y-4">
            {bookings.filter(b => b.status === 'pending').slice(0, 4).map(app => (
              <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.8rem]">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-black">{app.clientName?.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-black text-slate-800 leading-none">{app.clientName}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{app.startTime}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => updateStatus(app.id, 'approved')} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"><CheckCircle2 size={16} /></button>
                  <button onClick={() => updateStatus(app.id, 'rejected')} className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"><XCircle size={16} /></button>
                </div>
              </div>
            ))}
            {bookings.filter(b => b.status === 'pending').length === 0 && (
              <div className="text-center py-10">
                <Smile className="mx-auto text-slate-200 mb-2" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Todo al día</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Turnos</h3>
        <button 
          onClick={() => setShowSlotModal(true)}
          className="bg-sky-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-sky-600 shadow-lg shadow-sky-100"
        >
          <Plus size={18} /> Crear Turno Vacío
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Available Slots Section */}
        <div className="lg:col-span-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-2">Turnos Disponibles (Vacíos)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableSlots.map(slot => (
              <div key={slot.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-sky-200 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center"><CalendarDays size={20} /></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{slot.date}</p>
                    <p className="text-lg font-black text-slate-800">{slot.startTime}</p>
                  </div>
                </div>
                <button onClick={() => removeAppointment(slot.id)} className="p-3 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
              </div>
            ))}
            {availableSlots.length === 0 && <p className="col-span-full py-10 text-center text-slate-300 font-bold uppercase text-[10px]">No hay turnos abiertos para clientes.</p>}
          </div>
        </div>

        {/* Confirmed Appointments Section */}
        <div className="lg:col-span-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 mt-8 ml-2">Agenda de Citas Confirmadas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.filter(b => b.status === 'approved').map(app => (
              <div key={app.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase text-sky-500 tracking-widest">{app.date}</p>
                    <h4 className="text-xl font-black text-slate-900 leading-tight">{app.startTime}</h4>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400">{app.clientName?.charAt(0)}</div>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{app.clientName}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Status: <span className="text-emerald-500 uppercase">Confirmada</span></p>
                </div>
                <div className="pt-4 border-t border-slate-50 flex gap-2">
                  <button onClick={() => updateStatus(app.id, 'completed')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Completar</button>
                  <button onClick={() => updateStatus(app.id, 'cancelled')} className="px-4 py-3 bg-rose-50 text-rose-500 rounded-xl"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analíticas de Rendimiento</h3>
        <button onClick={exportData} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"><Download size={16} /> Descargar Reporte</button>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
        <h4 className="text-lg font-black text-slate-900 mb-8">Flujo de Ingresos (Simulado)</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                itemStyle={{fontWeight: '900', color: '#0ea5e9'}}
                labelStyle={{fontWeight: '900', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px'}}
              />
              <Area type="monotone" dataKey="citas" stroke="#0ea5e9" strokeWidth={5} fillOpacity={1} fill="url(#colorCitas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Smile, label: 'Satisfacción', value: '98%', color: 'bg-emerald-500' },
          { icon: Activity, label: 'Crecimiento', value: '+12%', color: 'bg-sky-500' },
          { icon: TrendingUp, label: 'Fidelidad', value: '85%', color: 'bg-slate-900' }
        ].map(card => (
          <div key={card.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center space-x-6">
            <div className={`w-16 h-16 rounded-[1.8rem] ${card.color} text-white flex items-center justify-center shadow-lg shadow-slate-100`}><card.icon size={28} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="text-3xl font-black text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPatients = () => {
    const filtered = allUsers.filter(u => 
      u.role === 'client' && 
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Fichas de Pacientes</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase w-64 md:w-80 shadow-sm focus:border-sky-500 outline-none" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((user) => (
            <div key={user.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
              <div className="flex items-center space-x-5 mb-6">
                <div className="w-16 h-16 rounded-[1.8rem] bg-slate-50 flex items-center justify-center font-black text-slate-400 text-2xl group-hover:bg-sky-500 group-hover:text-white transition-colors">{user.name.charAt(0)}</div>
                <div className="text-left">
                  <h4 className="text-lg font-black text-slate-800 leading-none">{user.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{user.email}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Citas: {bookings.filter(b => b.clientId === user.id).length}</p>
                <button className="text-[9px] font-black uppercase text-sky-500 tracking-widest hover:underline">Ver Historial</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No se encontraron pacientes.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h3 className="text-2xl font-black text-slate-900 tracking-tight px-2">Configuración Clínica</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3"><Clock size={20} className="text-sky-500" /> Horarios de Atención</h4>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inicio de Jornada</label>
                <input type="time" value={availability.startHour} onChange={e => setAvailability({...availability, startHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fin de Jornada</label>
                <input type="time" value={availability.endHour} onChange={e => setAvailability({...availability, endHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold" />
              </div>
            </div>
            <div className="space-y-2 pt-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Días de Apertura</label>
              <div className="flex flex-wrap gap-2">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, idx) => {
                  const isActive = availability.days.includes(idx);
                  return (
                    <button 
                      key={day}
                      onClick={() => {
                        const newDays = isActive ? availability.days.filter(d => d !== idx) : [...availability.days, idx];
                        setAvailability({...availability, days: newDays});
                      }}
                      className={`w-12 h-12 rounded-xl font-black text-xs transition-all ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-3"><Stethoscope size={20} className="text-sky-500" /> Tratamientos</h4>
            <button className="p-3 bg-slate-50 text-sky-500 rounded-xl hover:bg-sky-500 hover:text-white transition-all"><Plus size={18} /></button>
          </div>
          <div className="space-y-3">
            {treatments.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group">
                <div>
                  <p className="text-xs font-black text-slate-800 leading-none">{t.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">${t.price} • {t.durationMinutes}m</p>
                </div>
                <button onClick={() => setTreatments(prev => prev.filter(item => item.id !== t.id))} className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- RENDER ROUTER ---

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'Dashboard': return renderDashboard();
      case 'Calendario': return renderCalendar();
      case 'Analíticas': return renderStats();
      case 'Pacientes': return renderPatients();
      case 'Ajustes': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="pb-24">
      {renderActiveModule()}

      {/* Floating Action Button for manual phone bookings */}
      <button 
        onClick={() => {
          setSlotDate(todayStr);
          setShowSlotModal(true);
        }}
        className="fixed bottom-10 right-10 w-20 h-20 bg-sky-500 text-white rounded-[2.5rem] shadow-2xl shadow-sky-300 flex items-center justify-center active:scale-90 transition-all z-40 border-[6px] border-white ring-1 ring-slate-100 hover:bg-sky-600"
      >
        <PhoneCall size={30} />
      </button>

      {/* Manual Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900">Abrir Nuevo Turno</h3>
              <button onClick={() => setShowSlotModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={createSlot} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Disponibilidad</label>
                <input required type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} min={todayStr} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora Inicio</label>
                  <input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora Fin</label>
                  <input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed">Al crear este turno, aparecerá automáticamente en la agenda de los pacientes para que puedan solicitar su cita.</p>
              <button type="submit" className="w-full py-5 bg-sky-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-sky-100 hover:bg-sky-600 mt-4 transition-all">Publicar Disponibilidad</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

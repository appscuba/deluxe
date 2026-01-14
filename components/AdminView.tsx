
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Appointment, Treatment, User, ToothCondition, ToothState } from '../types';
import { Odontogram } from './Odontogram';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PhoneCall, 
  TrendingUp,
  DollarSign,
  Trash2,
  Calendar as CalendarIcon,
  Download,
  Plus,
  X,
  Users,
  Search,
  Settings,
  Smile,
  BarChart,
  Activity,
  CalendarDays,
  FileText,
  ChevronRight,
  Stethoscope,
  ClipboardList
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const AdminView: React.FC = () => {
  const { 
    appointments, 
    setAppointments, 
    treatments, 
    addNotification, 
    allUsers, 
    activeTab,
    availability,
    setAvailability,
    patientRecords,
    updatePatientOdontogram
  } = useAppContext();

  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('09:45');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingPatientFile, setViewingPatientFile] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const bookings = useMemo(() => appointments.filter(a => a.status !== 'available'), [appointments]);

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
    if (confirm('¿Estás seguro de que deseas eliminar este turno?')) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  // --- RENDERS DE MÓDULOS ---

  const renderDashboard = () => {
    const todayCompleted = bookings.filter(a => a.date === todayStr && a.status === 'completed');
    const earningsToday = todayCompleted.reduce((acc, curr) => {
      const t = treatments.find(tr => tr.id === curr.treatmentId);
      return acc + (t?.price || 0);
    }, 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-sky-100 flex flex-col justify-between h-40">
            <DollarSign size={24} className="opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ingresos Hoy</p><p className="text-3xl font-black">${earningsToday}</p></div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
            <Clock size={24} className="text-amber-500 opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Solicitudes Pendientes</p><p className="text-3xl font-black text-slate-800">{bookings.filter(b => b.status === 'pending').length}</p></div>
          </div>
          <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 flex flex-col justify-between h-40">
            <TrendingUp size={24} className="text-emerald-400 opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Pacientes Totales</p><p className="text-3xl font-black">{allUsers.filter(u => u.role === 'client').length}</p></div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
            <CalendarIcon size={24} className="text-sky-500 opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Citas Hoy</p><p className="text-3xl font-black text-slate-800">{bookings.filter(b => b.date === todayStr).length}</p></div>
          </div>
        </div>
        
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="text-sky-500" /> Actividad Reciente
          </h3>
          <div className="space-y-4">
            {bookings.slice(0, 5).map(app => (
              <div key={app.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-sky-500 shadow-sm">{app.clientName?.charAt(0)}</div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{app.clientName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.date} • {app.startTime}</p>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                  app.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-200 text-slate-500'
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const [selectedDateFilter, setSelectedDateFilter] = useState(todayStr);
    const dayAppointments = appointments.filter(a => a.date === selectedDateFilter);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-80 space-y-4">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Agenda Diaria</h4>
              <input 
                type="date" 
                value={selectedDateFilter} 
                onChange={e => setSelectedDateFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:border-sky-500 transition-all mb-4"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed text-center">
                Visualizando toda la actividad del centro para la fecha seleccionada.
              </p>
            </div>
            <button 
              onClick={() => {
                setSlotDate(selectedDateFilter);
                setShowSlotModal(true);
              }}
              className="w-full bg-sky-500 text-white py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-sky-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Plus size={20} /> Abrir Nuevo Turno
            </button>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agenda: {selectedDateFilter}</h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400"><div className="w-2 h-2 rounded-full bg-sky-500"></div> Disponible</span>
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Agendado</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {dayAppointments.length > 0 ? dayAppointments.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(app => (
                <div key={app.id} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6
                  ${app.status === 'available' ? 'bg-white border-dashed border-slate-200 opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}>
                  
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black shadow-inner
                      ${app.status === 'available' ? 'bg-slate-50 text-slate-300' : 'bg-sky-50 text-sky-500'}`}>
                      <span className="text-xl leading-none">{app.startTime}</span>
                      <span className="text-[8px] opacity-60 mt-1 uppercase">Inicio</span>
                    </div>
                    <div>
                      {app.status === 'available' ? (
                        <div className="space-y-1">
                          <h4 className="text-lg font-black text-slate-300 uppercase italic">Espacio Disponible</h4>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Visible para pacientes</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-slate-900">{app.clientName}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase">{app.status}</span>
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest">{app.reason || 'Sin motivo especificado'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(app.id, 'approved')} className="bg-emerald-500 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-emerald-100">Aprobar</button>
                        <button onClick={() => updateStatus(app.id, 'rejected')} className="bg-rose-50 text-rose-600 px-5 py-3 rounded-2xl text-[9px] font-black uppercase">Rechazar</button>
                      </div>
                    )}
                    {app.status === 'approved' && (
                      <button onClick={() => updateStatus(app.id, 'completed')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl">Completar Cita</button>
                    )}
                    <button onClick={() => removeAppointment(app.id)} className="p-4 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                  </div>
                </div>
              )) : (
                <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-4">
                  <div className="p-6 bg-slate-50 rounded-full text-slate-200"><CalendarDays size={60} /></div>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No hay actividad para este día</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPatients = () => {
    const filtered = allUsers.filter(u => 
      u.role === 'client' && 
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone.includes(searchTerm))
    );

    if (viewingPatientFile && selectedPatientId) {
      const patient = allUsers.find(u => u.id === selectedPatientId);
      const record = patientRecords.find(r => r.patientId === selectedPatientId);
      const odontogram = record?.odontogram || [];
      const patientApps = appointments.filter(a => a.clientId === selectedPatientId);

      return (
        <div className="animate-in slide-in-from-right-12 duration-500 space-y-8 pb-20">
          <button 
            onClick={() => setViewingPatientFile(false)}
            className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm transition-all"
          >
            <ChevronRight size={18} className="rotate-180" /> Regresar al listado
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center">
                <div className="w-28 h-28 bg-sky-500 text-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-2xl shadow-sky-100 transform -rotate-3">
                  {patient?.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{patient?.name}</h2>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-8">{patient?.email}</p>
                
                <div className="space-y-4 pt-8 border-t border-slate-50 text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Teléfono Directo</span>
                    <span className="text-sm font-black text-slate-800">{patient?.phone}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Paciente desde</span>
                    <span className="text-sm font-black text-slate-800">{patient?.createdAt.split('T')[0]}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-slate-300">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-sky-400">
                  <ClipboardList size={18} /> Historial Citas
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
                  {patientApps.length > 0 ? patientApps.map(a => (
                    <div key={a.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{a.date}</p>
                      <p className="text-xs font-bold mt-1">{a.startTime} - {a.status}</p>
                    </div>
                  )) : <p className="text-[10px] text-white/30 font-black uppercase">Sin citas previas</p>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-12">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <Stethoscope size={28} className="text-sky-500" /> Dentigrama Clínico
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado dental en tiempo real</p>
                  </div>
                  <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                    <CheckCircle2 size={16} /> Ficha Sincronizada
                  </div>
                </div>
                
                <Odontogram 
                  toothStates={odontogram} 
                  onUpdateTooth={(id, condition) => {
                    const newOdontogram = [...odontogram];
                    const existingIdx = newOdontogram.findIndex(s => s.id === id);
                    if (existingIdx >= 0) {
                      newOdontogram[existingIdx] = { ...newOdontogram[existingIdx], condition };
                    } else {
                      newOdontogram.push({ id, condition });
                    }
                    updatePatientOdontogram(selectedPatientId!, newOdontogram);
                  }} 
                />

                <div className="mt-12 space-y-6">
                  <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-200">
                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                      <FileText size={18} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Evolución Médica y Notas</h4>
                    </div>
                    <textarea 
                      placeholder="Agregue detalles del tratamiento, alergias o notas importantes para el próximo turno..."
                      className="w-full h-40 bg-transparent text-sm font-bold text-slate-800 outline-none resize-none leading-relaxed"
                    />
                  </div>
                  <button className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Guardar Observaciones</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Pacientes</h3>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Nombre o teléfono..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-500/5 transition-all" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((user) => (
            <div key={user.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -mr-16 -mt-16 group-hover:bg-sky-500 transition-colors duration-500"></div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-2xl mb-6 group-hover:scale-110 group-hover:bg-white group-hover:text-sky-500 transition-all duration-500">
                  {user.name.charAt(0)}
                </div>
                <h4 className="text-lg font-black text-slate-800 leading-tight mb-1 group-hover:text-slate-900">{user.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">{user.phone}</p>
                
                <button 
                  onClick={() => {
                    setSelectedPatientId(user.id);
                    setViewingPatientFile(true);
                  }}
                  className="w-full py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  <FileText size={16} /> Ver Ficha Médica
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
              <Users size={60} className="mx-auto text-slate-100 mb-4" />
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No se encontraron pacientes registrados</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    // Generar datos de la semana
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const count = bookings.filter(a => a.date === dStr).length;
      chartData.push({ name: dStr.split('-').slice(1).join('/'), citas: count });
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight px-4">Análisis del Centro</h3>
        
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
          <h4 className="text-lg font-black text-slate-900 mb-10 flex items-center gap-3">
            <Activity className="text-sky-500" /> Rendimiento de Citas Semanal
          </h4>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{stroke: '#0ea5e9', strokeWidth: 2}} 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                />
                <Area type="monotone" dataKey="citas" stroke="#0ea5e9" strokeWidth={5} fillOpacity={1} fill="url(#colorCitas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Estado de Conversión</h4>
            <div className="space-y-6">
              {[
                { label: 'Citas Completadas', count: bookings.filter(b => b.status === 'completed').length, color: 'bg-emerald-500' },
                { label: 'Canceladas/Rechazadas', count: bookings.filter(b => ['cancelled', 'rejected'].includes(b.status)).length, color: 'bg-rose-500' },
                { label: 'En Proceso', count: bookings.filter(b => ['approved', 'pending'].includes(b.status)).length, color: 'bg-sky-500' }
              ].map(stat => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span>{stat.label}</span>
                    <span>{stat.count}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color} transition-all duration-1000`} style={{ width: `${(stat.count / bookings.length || 1) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 p-10 rounded-[3.5rem] flex flex-col items-center justify-center text-center text-white">
            <Smile size={60} className="text-sky-400 mb-6" />
            <h4 className="text-4xl font-black mb-2">{bookings.filter(b => b.status === 'completed').length}</h4>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 leading-relaxed">
              Tratamientos finalizados <br />con éxito total
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'Dashboard': return renderDashboard();
      case 'Calendario': return renderCalendar();
      case 'Analíticas': return renderStats();
      case 'Pacientes': return renderPatients();
      case 'Ajustes': return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Ajustes de la Clínica</h3>
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Inicio Jornada</label>
                <input type="time" value={availability.startHour} onChange={e => setAvailability({...availability, startHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[1.8rem] px-8 py-5 font-black text-lg focus:border-sky-500 outline-none" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fin Jornada</label>
                <input type="time" value={availability.endHour} onChange={e => setAvailability({...availability, endHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[1.8rem] px-8 py-5 font-black text-lg focus:border-sky-500 outline-none" />
              </div>
            </div>
            <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
              <p className="text-xs font-bold text-slate-400 italic">Los cambios se aplican inmediatamente para nuevas reservas.</p>
              <button className="bg-sky-500 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-sky-100">Guardar Cambios</button>
            </div>
          </div>
        </div>
      );
      default: return renderDashboard();
    }
  };

  return (
    <div className="pb-32 min-h-screen">
      {renderActiveModule()}

      {/* FAB - Llamada Rápida / Agenda Manual */}
      <button 
        onClick={() => { setSlotDate(todayStr); setShowSlotModal(true); }}
        className="fixed bottom-12 right-12 w-24 h-24 bg-sky-500 text-white rounded-[3rem] shadow-2xl shadow-sky-200 flex items-center justify-center z-[80] border-[8px] border-white hover:bg-sky-600 active:scale-90 transition-all group"
      >
        <PhoneCall size={32} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Modal de Nuevo Turno */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900 leading-tight">Abrir Turno</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilidad pública</p>
              </div>
              <button onClick={() => setShowSlotModal(false)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100"><X size={24} /></button>
            </div>
            <form onSubmit={createSlot} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha del Turno</label>
                <input required type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} min={todayStr} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg outline-none focus:border-sky-500" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hora Inicio</label>
                  <input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg outline-none" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hora Fin</label>
                  <input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 mt-4 active:scale-95 transition-all">Publicar en Agenda</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

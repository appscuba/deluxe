
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
  ClipboardList,
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  Lock
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const AdminView: React.FC = () => {
  const { 
    appointments, 
    setAppointments, 
    treatments, 
    addNotification, 
    allUsers, 
    setAllUsers,
    activeTab,
    availability,
    setAvailability,
    patientRecords,
    updatePatientOdontogram
  } = useAppContext();

  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('09:45');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingPatientFile, setViewingPatientFile] = useState(false);

  // Form para nuevo Admin
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

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

  const createAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const newAdmin: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAdminData.name,
      email: newAdminData.email,
      phone: newAdminData.phone,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    setAllUsers(prev => [...prev, newAdmin]);
    setShowAdminModal(false);
    setNewAdminData({ name: '', email: '', phone: '', password: '' });
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
            <div className="grid grid-cols-1 gap-4">
              {dayAppointments.length > 0 ? dayAppointments.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(app => (
                <div key={app.id} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6
                  ${app.status === 'available' ? 'bg-white border-dashed border-slate-200 opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}>
                  
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black shadow-inner
                      ${app.status === 'available' ? 'bg-slate-50 text-slate-300' : 'bg-sky-50 text-sky-500'}`}>
                      <span className="text-xl leading-none">{app.startTime}</span>
                    </div>
                    <div>
                      <h4 className={`text-lg font-black ${app.status === 'available' ? 'text-slate-300' : 'text-slate-900'}`}>{app.status === 'available' ? 'Espacio Libre' : app.clientName}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(app.id, 'approved')} className="bg-emerald-500 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase">Aprobar</button>
                        <button onClick={() => updateStatus(app.id, 'rejected')} className="bg-rose-50 text-rose-600 px-5 py-3 rounded-2xl text-[9px] font-black uppercase">Rechazar</button>
                      </div>
                    )}
                    <button onClick={() => removeAppointment(app.id)} className="p-4 text-slate-200 hover:text-rose-500 rounded-2xl transition-all"><Trash2 size={20} /></button>
                  </div>
                </div>
              )) : (
                <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Sin actividad este día</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEquipo = () => {
    const admins = allUsers.filter(u => u.role === 'admin');

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Equipo Administrativo</h3>
          <button 
            onClick={() => setShowAdminModal(true)}
            className="bg-sky-500 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-sky-100 flex items-center gap-3"
          >
            <UserPlus size={20} /> Añadir Administrador
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-sky-500 transition-colors duration-500"></div>
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-2xl mb-6 group-hover:bg-white group-hover:text-sky-500 transition-all">
                  {admin.name.charAt(0)}
                </div>
                <h4 className="text-lg font-black text-slate-800 leading-tight mb-1">{admin.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{admin.email}</p>
                <div className="px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Administrator
                </div>
              </div>
            </div>
          ))}
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
            className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm"
          >
            <ChevronRight size={18} className="rotate-180" /> Regresar
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl text-center">
                <div className="w-28 h-28 bg-sky-500 text-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black mx-auto mb-6">
                  {patient?.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">{patient?.name}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient?.phone}</p>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white p-12 rounded-[4rem] border border-slate-100">
                <h3 className="text-2xl font-black text-slate-900 mb-12 flex items-center gap-3">
                  <Stethoscope size={28} className="text-sky-500" /> Odontograma
                </h3>
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
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Base de Pacientes</h3>
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-96 pl-8 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((user) => (
            <div key={user.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-2xl mb-6 group-hover:bg-sky-500 group-hover:text-white transition-all">
                  {user.name.charAt(0)}
                </div>
                <h4 className="text-lg font-black text-slate-800 leading-tight mb-4">{user.name}</h4>
                <button 
                  onClick={() => {
                    setSelectedPatientId(user.id);
                    setViewingPatientFile(true);
                  }}
                  className="w-full py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all"
                >
                  <FileText size={16} /> Ver Ficha
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'Dashboard': return renderDashboard();
      case 'Calendario': return renderCalendar();
      case 'Analíticas': return <div className="p-10 text-center font-black uppercase text-slate-300">Modulo Analíticas en desarrollo</div>;
      case 'Pacientes': return renderPatients();
      case 'Equipo': return renderEquipo();
      case 'Ajustes': return <div className="p-10 text-center font-black uppercase text-slate-300">Modulo Ajustes en desarrollo</div>;
      default: return renderDashboard();
    }
  };

  return (
    <div className="pb-32 min-h-screen">
      {renderActiveModule()}

      {/* FAB */}
      <button 
        onClick={() => { setSlotDate(todayStr); setShowSlotModal(true); }}
        className="fixed bottom-12 right-12 w-24 h-24 bg-sky-500 text-white rounded-[3rem] shadow-2xl flex items-center justify-center z-[80] border-[8px] border-white hover:bg-sky-600 transition-all"
      >
        <PhoneCall size={32} />
      </button>

      {/* Modal Nuevo Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900">Nuevo Administrador</h3>
              <button onClick={() => setShowAdminModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={createAdmin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                <div className="relative">
                  <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input required type="text" value={newAdminData.name} onChange={e => setNewAdminData({...newAdminData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] pl-16 pr-8 py-5 font-bold" placeholder="Nombre completo" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Profesional</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input required type="email" value={newAdminData.email} onChange={e => setNewAdminData({...newAdminData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] pl-16 pr-8 py-5 font-bold" placeholder="email@clinica.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input required type="tel" value={newAdminData.phone} onChange={e => setNewAdminData({...newAdminData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] pl-16 pr-8 py-5 font-bold" placeholder="Teléfono" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Asignar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input required type="password" value={newAdminData.password} onChange={e => setNewAdminData({...newAdminData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] pl-16 pr-8 py-5 font-bold" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl mt-4">Registrar en el Sistema</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Turno */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 leading-tight">Abrir Turno</h3>
              <button onClick={() => setShowSlotModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={createSlot} className="space-y-8">
              <input required type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} min={todayStr} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg" />
              <div className="grid grid-cols-2 gap-6">
                <input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg" />
                <input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg" />
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 mt-4 active:scale-95 transition-all">Publicar en Agenda</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Appointment, Treatment, User, ToothCondition, ToothState, Notification, PatientRecord, ClinicAvailability } from '../types';
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
  ChevronLeft,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  Lock,
  RefreshCw,
  Receipt,
  CreditCard,
  Database,
  UploadCloud,
  Save,
  Info,
  Archive,
  Edit2,
  AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const AdminView: React.FC = () => {
  const { 
    currentUser,
    appointments, 
    setAppointments, 
    treatments, 
    setTreatments,
    notifications,
    setNotifications,
    addNotification, 
    allUsers, 
    setAllUsers,
    activeTab,
    availability,
    setAvailability,
    patientRecords,
    setPatientRecords,
    updatePatientOdontogram
  } = useAppContext();

  // Modales
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  
  // Estados de formulario
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('09:45');
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdminData, setNewAdminData] = useState({ name: '', email: '', password: '' });
  
  // Edición de Usuario (Pacientes o Admins)
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Facturación
  const [billingAppointment, setBillingAppointment] = useState<Appointment | null>(null);
  const [billingAmount, setBillingAmount] = useState<number>(0);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingPatientFile, setViewingPatientFile] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const bookings = useMemo(() => appointments.filter(a => a.status !== 'available'), [appointments]);

  const ROOT_ADMIN_EMAIL = 'appscuba@gmail.com';
  const isSuperAdmin = currentUser?.email === ROOT_ADMIN_EMAIL;

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysCount = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];
    
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysCount; i++) {
      const d = new Date(year, month, i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  // --- Sistema de Respaldo XML ---

  const exportToXML = () => {
    const data = {
      users: allUsers,
      appointments: appointments,
      treatments: treatments,
      notifications: notifications,
      availability: availability,
      patientRecords: patientRecords,
      exportDate: new Date().toISOString(),
      version: "1.2"
    };

    let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlString += '<DeluxeDentalSystemBackup>\n';
    xmlString += `  <Metadata>\n    <ClinicName>Deluxe Dental Care</ClinicName>\n    <GeneratedAt>${data.exportDate}</GeneratedAt>\n    <Version>${data.version}</Version>\n  </Metadata>\n`;
    xmlString += `  <DataPayload><![CDATA[${JSON.stringify(data)}]]></DataPayload>\n`;
    xmlString += '</DeluxeDentalSystemBackup>';

    const blob = new Blob([xmlString], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeluxeDental_FULL_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromXML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");
        const payloadNode = xmlDoc.getElementsByTagName("DataPayload")[0];
        
        if (!payloadNode) throw new Error("Formato inválido.");

        const jsonData = JSON.parse(payloadNode.textContent || "");
        
        if (jsonData.users) setAllUsers(jsonData.users);
        if (jsonData.appointments) setAppointments(jsonData.appointments);
        if (jsonData.treatments) setTreatments(jsonData.treatments);
        if (jsonData.notifications) setNotifications(jsonData.notifications);
        if (jsonData.availability) setAvailability(jsonData.availability);
        if (jsonData.patientRecords) setPatientRecords(jsonData.patientRecords);

        alert("¡Base de datos restaurada correctamente!");
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        alert("Error al importar el archivo.");
      }
    };
    reader.readAsText(file);
  };

  // --- Funciones de Gestión de Usuarios ---

  const handleDeleteUser = (id: string, email: string) => {
    if (email === ROOT_ADMIN_EMAIL) {
      alert('No se puede eliminar al Administrador Global por razones de seguridad.');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar permanentemente a este usuario?')) {
      setAllUsers(prev => prev.filter(u => u.id !== id));
      setAppointments(prev => prev.filter(a => a.clientId !== id));
      setPatientRecords(prev => prev.filter(r => r.patientId !== id));
      if (selectedPatientId === id) setViewingPatientFile(false);
      alert('Usuario eliminado.');
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setAllUsers(prev => prev.map(u => u.id === userToEdit.id ? userToEdit : u));
    setShowEditPatientModal(false);
    setUserToEdit(null);
    alert('Información actualizada correctamente.');
  };

  // --- Funciones de Gestión de Citas ---

  const updateStatus = (id: string, newStatus: Appointment['status']) => {
    if (newStatus === 'completed') {
      const app = appointments.find(a => a.id === id);
      if (app) {
        const treatment = treatments.find(t => t.id === app.treatmentId);
        setBillingAppointment(app);
        setBillingAmount(treatment?.price || 0);
        setShowBillingModal(true);
        return;
      }
    }

    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        if (app.clientId) {
          const title = newStatus === 'approved' ? 'Cita Aprobada' : 
                        newStatus === 'rejected' ? 'Cita Rechazada' : 
                        newStatus === 'completed' ? 'Cita Completada' : 'Actualización';
          addNotification(app.clientId, title, `Tu cita ha sido marcada como ${newStatus}.`, 'status_change');
        }
        return { ...app, status: newStatus };
      }
      return app;
    }));
  };

  const handleFinalizeBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingAppointment) return;

    setAppointments(prev => prev.map(app => {
      if (app.id === billingAppointment.id) {
        if (app.clientId) {
          addNotification(app.clientId, "Cita Finalizada", "Tratamiento registrado con éxito.", 'status_change');
        }
        return { ...app, status: 'completed', paidAmount: billingAmount };
      }
      return app;
    }));

    setShowBillingModal(false);
    setBillingAppointment(null);
  };

  const createSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !slotStart || !slotEnd) return;
    
    const newSlot: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate,
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
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAdminData.name,
      email: newAdminData.email,
      phone: 'N/A',
      password: newAdminData.password,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    setAllUsers(prev => [...prev, newUser]);
    setNewAdminData({ name: '', email: '', password: '' });
    setShowAdminModal(false);
  };

  const removeAppointment = (id: string) => {
    if (confirm('¿Eliminar este turno?')) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  // --- Renders ---

  const renderDashboard = () => {
    const todayCompleted = bookings.filter(a => a.date === todayStr && a.status === 'completed');
    const earningsToday = todayCompleted.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-sky-100 flex flex-col justify-between h-40">
            <DollarSign size={24} className="opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ingresos Hoy</p><p className="text-3xl font-black">${earningsToday}</p></div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
            <Clock size={24} className="text-amber-500 opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendientes</p><p className="text-3xl font-black text-slate-800">{bookings.filter(b => b.status === 'pending').length}</p></div>
          </div>
          <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 flex flex-col justify-between h-40">
            <TrendingUp size={24} className="text-emerald-400 opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Pacientes</p><p className="text-3xl font-black">{allUsers.filter(u => u.role === 'client').length}</p></div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
            <CalendarIcon size={24} className="text-sky-500 opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Citas Hoy</p><p className="text-3xl font-black text-slate-800">{bookings.filter(b => b.date === todayStr).length}</p></div>
          </div>
        </div>
        
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="text-sky-500" size={20} /> Actividad Reciente
          </h3>
          <div className="space-y-4">
            {bookings.length > 0 ? bookings.slice(0, 5).map(app => (
              <div key={app.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-sky-500 shadow-sm">{app.clientName?.charAt(0)}</div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{app.clientName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.date} • {app.startTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {app.status === 'completed' && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">+${app.paidAmount || 0}</span>}
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                    app.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                    app.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 
                    app.status === 'completed' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-slate-300 font-bold uppercase text-[10px]">Sin movimientos registrados</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'Dashboard': return renderDashboard();
      case 'Calendario': return renderCalendar();
      case 'Pacientes': return renderPatients();
      case 'Equipo': return renderEquipo();
      case 'Ajustes': return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Settings className="text-sky-500" size={28} /> Operación
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apertura</label>
                <input type="time" value={availability.startHour} onChange={e => setAvailability({...availability, startHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 font-black text-xl" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cierre</label>
                <input type="time" value={availability.endHour} onChange={e => setAvailability({...availability, endHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 font-black text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Database className="text-emerald-500" size={28} /> Backup & Restaurar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={exportToXML} className="bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3">
                <Archive size={18} /> Exportar Backup XML
              </button>
              <div className="relative">
                <input type="file" accept=".xml" onChange={importFromXML} ref={fileInputRef} className="hidden" id="xml-restore-ajustes" />
                <label htmlFor="xml-restore-ajustes" className="w-full flex items-center justify-center gap-3 bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] cursor-pointer">
                  <UploadCloud size={18} /> Importar XML
                </label>
              </div>
            </div>
          </div>
        </div>
      );
      default: return renderDashboard();
    }
  };

  const renderCalendar = () => {
    const dayAppointments = appointments.filter(a => a.date === selectedDate);
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[450px] space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h4>
                <div className="flex gap-2">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><ChevronLeft size={20}/></button>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><ChevronRight size={20}/></button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['D','L','M','X','J','V','S'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-slate-300 py-2">{d}</div>
                ))}
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} className="p-2"></div>;
                  const isSelected = date === selectedDate;
                  const hasApps = appointments.some(a => a.date === date && a.status !== 'available');

                  return (
                    <button 
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`relative p-3 rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center
                        ${isSelected ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}
                      `}
                    >
                      {new Date(date).getDate() + 1}
                      {hasApps && <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => setShowSlotModal(true)}
              className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-2xl"
            >
              <Plus size={20} /> Abrir Espacio en {selectedDate}
            </button>
          </div>

          <div className="flex-1 space-y-6">
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm h-full min-h-[500px]">
              <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Agenda Diaria</h3>
              <div className="space-y-4">
                {dayAppointments.length > 0 ? dayAppointments.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(app => (
                  <div key={app.id} className={`p-6 rounded-[2.5rem] border transition-all flex items-center justify-between
                    ${app.status === 'available' ? 'bg-slate-50/50 border-dashed border-slate-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                    
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black shadow-inner
                        ${app.status === 'available' ? 'bg-white text-slate-300' : 'bg-sky-500 text-white'}`}>
                        {app.startTime}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900">{app.status === 'available' ? 'Libre' : app.clientName}</h4>
                        <p className="text-[10px] font-black text-sky-500 uppercase">{app.reason || 'General'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {app.status === 'pending' && (
                        <button onClick={() => updateStatus(app.id, 'approved')} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase">Aprobar</button>
                      )}
                      {app.status === 'approved' && (
                        <button onClick={() => updateStatus(app.id, 'completed')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase">Cobrar</button>
                      )}
                      <button onClick={() => removeAppointment(app.id)} className="p-4 text-slate-200 hover:text-rose-500"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center opacity-20">
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Sin turnos hoy</p>
                  </div>
                )}
              </div>
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

      return (
        <div className="animate-in slide-in-from-right-12 duration-500 space-y-8 pb-20">
          <button onClick={() => setViewingPatientFile(false)} className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 bg-white px-6 py-3 rounded-full border shadow-sm">
            <ChevronRight size={18} className="rotate-180" /> Regresar
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-10 rounded-[3.5rem] border shadow-xl text-center relative group">
                <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setUserToEdit(patient!); setShowEditPatientModal(true); }} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-sky-500"><Edit2 size={16} /></button>
                   <button onClick={() => handleDeleteUser(patient!.id, patient!.email)} className="p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600"><Trash2 size={16} /></button>
                </div>
                <div className="w-28 h-28 bg-sky-500 text-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black mx-auto mb-6">
                  {patient?.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-slate-900">{patient?.name}</h2>
                <p className="text-xs text-slate-400 font-bold mt-2">{patient?.phone}</p>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white p-12 rounded-[4rem] border shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
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
        <div className="flex items-center justify-between gap-6 px-4">
          <h3 className="text-3xl font-black text-slate-900">Pacientes</h3>
          <div className="relative w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white border rounded-[2rem] text-sm font-bold shadow-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((user) => (
            <div key={user.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden text-center">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setUserToEdit(user); setShowEditPatientModal(true); }} className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={16} /></button>
                   <button onClick={() => handleDeleteUser(user.id, user.email)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
                <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 flex items-center justify-center font-black text-slate-400 text-2xl mx-auto mb-6 group-hover:text-sky-500 transition-all">
                  {user.name.charAt(0)}
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-8">{user.name}</h4>
                <button onClick={() => { setSelectedPatientId(user.id); setViewingPatientFile(true); }} className="w-full py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] hover:bg-slate-900 hover:text-white transition-all">Ver Expediente</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEquipo = () => {
    const admins = allUsers.filter(u => u.role === 'admin');

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-6 px-4">
          <h3 className="text-3xl font-black text-slate-900">Equipo Médico</h3>
          <button onClick={() => setShowAdminModal(true)} className="bg-sky-500 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-2xl flex items-center gap-3">
            <UserPlus size={20} /> Nuevo Admin
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {admins.map((admin) => {
            const isGlobalAdmin = admin.email === ROOT_ADMIN_EMAIL;
            return (
              <div key={admin.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm relative overflow-hidden group text-center">
                {!isGlobalAdmin && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setUserToEdit(admin); setShowEditPatientModal(true); }} className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteUser(admin.id, admin.email)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                  </div>
                )}
                
                <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 flex items-center justify-center font-black text-slate-400 text-2xl mx-auto mb-6 group-hover:text-sky-500 transition-all">
                  {admin.name.charAt(0)}
                </div>
                <h4 className="text-lg font-black text-slate-800 leading-tight mb-1">{admin.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{admin.email}</p>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-block ${isGlobalAdmin ? 'bg-slate-900 text-white' : 'bg-sky-50 text-sky-600'}`}>
                  {isGlobalAdmin ? 'Global Admin' : 'Admin'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-32 min-h-screen">
      {renderActiveModule()}

      {/* Modal Edición (Compartido para Pacientes y Admins) */}
      {showEditPatientModal && userToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900">Editar Usuario</h3>
              <button onClick={() => setShowEditPatientModal(false)} className="text-slate-400 hover:text-slate-900"><X size={24}/></button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input required type="text" value={userToEdit.name} onChange={e => setUserToEdit({...userToEdit, name: e.target.value})} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input required type="email" value={userToEdit.email} disabled={userToEdit.email === ROOT_ADMIN_EMAIL} onChange={e => setUserToEdit({...userToEdit, email: e.target.value})} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold disabled:opacity-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                <input required type="tel" value={userToEdit.phone} onChange={e => setUserToEdit({...userToEdit, phone: e.target.value})} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold" />
              </div>

              {/* Nueva Funcionalidad: Cambio de Contraseña solo para Super Admin */}
              {isSuperAdmin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest ml-1">Nueva Contraseña (Opcional)</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={18} />
                    <input 
                      type="password" 
                      value={userToEdit.password || ''} 
                      onChange={e => setUserToEdit({...userToEdit, password: e.target.value})} 
                      placeholder="Nueva contraseña"
                      className="w-full bg-sky-50 border border-sky-100 rounded-2xl px-12 py-4 font-bold text-slate-800 placeholder:text-sky-200" 
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] mt-4 shadow-xl">Actualizar Información</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Facturación */}
      {showBillingModal && billingAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[4rem] p-12 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 text-center mb-10">Finalizar Tratamiento</h3>
            <form onSubmit={handleFinalizeBilling} className="space-y-8">
              <div className="relative">
                <DollarSign className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                <input required type="number" value={billingAmount} onChange={e => setBillingAmount(Number(e.target.value))} className="w-full bg-slate-50 border rounded-[2.5rem] pl-16 pr-8 py-6 font-black text-3xl" />
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] shadow-xl">Confirmar Pago</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900">Registrar Admin</h3>
              <button onClick={() => setShowAdminModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={createAdmin} className="space-y-6">
              <input required type="text" value={newAdminData.name} onChange={e => setNewAdminData({...newAdminData, name: e.target.value})} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-bold" placeholder="Nombre" />
              <input required type="email" value={newAdminData.email} onChange={e => setNewAdminData({...newAdminData, email: e.target.value})} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-bold" placeholder="Email" />
              <input required type="password" value={newAdminData.password} onChange={e => setNewAdminData({...newAdminData, password: e.target.value})} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-bold" placeholder="Contraseña" />
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest mt-4">Guardar</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Turno */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 leading-tight">Habilitar Turno</h3>
              <button onClick={() => setShowSlotModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={createSlot} className="space-y-8">
              <input required type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={todayStr} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-black text-lg" />
              <div className="grid grid-cols-2 gap-6">
                <input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold" />
                <input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold" />
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase shadow-2xl mt-4">Crear Espacio</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

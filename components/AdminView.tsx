
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
  
  // Edición de Paciente
  const [patientToEdit, setPatientToEdit] = useState<User | null>(null);

  // Facturación
  const [billingAppointment, setBillingAppointment] = useState<Appointment | null>(null);
  const [billingAmount, setBillingAmount] = useState<number>(0);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingPatientFile, setViewingPatientFile] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const bookings = useMemo(() => appointments.filter(a => a.status !== 'available'), [appointments]);

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
        
        if (!payloadNode) throw new Error("El archivo XML no tiene el formato de respaldo de Deluxe Dental.");

        const jsonData = JSON.parse(payloadNode.textContent || "");
        
        if (jsonData.users) setAllUsers(jsonData.users);
        if (jsonData.appointments) setAppointments(jsonData.appointments);
        if (jsonData.treatments) setTreatments(jsonData.treatments);
        if (jsonData.notifications) setNotifications(jsonData.notifications);
        if (jsonData.availability) setAvailability(jsonData.availability);
        if (jsonData.patientRecords) setPatientRecords(jsonData.patientRecords);

        alert("¡Base de datos restaurada correctamente! Toda la información ha sido sincronizada.");
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error("Error al restaurar:", error);
        alert("Error crítico al importar el archivo. Formato incompatible.");
      }
    };
    reader.readAsText(file);
  };

  // --- Funciones de Gestión de Pacientes ---

  const handleDeletePatient = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar permanentemente a este paciente? Se perderán todas sus citas e historial clínico.')) {
      setAllUsers(prev => prev.filter(u => u.id !== id));
      setAppointments(prev => prev.filter(a => a.clientId !== id));
      setPatientRecords(prev => prev.filter(r => r.patientId !== id));
      if (selectedPatientId === id) setViewingPatientFile(false);
      alert('Paciente eliminado correctamente.');
    }
  };

  const handleUpdatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientToEdit) return;

    setAllUsers(prev => prev.map(u => u.id === patientToEdit.id ? patientToEdit : u));
    setShowEditPatientModal(false);
    setPatientToEdit(null);
    alert('Información del paciente actualizada con éxito.');
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
                        newStatus === 'completed' ? 'Cita Completada' : 'Actualización de Cita';
          addNotification(app.clientId, title, `Tu cita del ${app.date} ha sido marcada como ${newStatus}.`, 'status_change');
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
          addNotification(app.clientId, "Cita Finalizada", `Tu tratamiento ha sido registrado. Pago recibido: $${billingAmount}. ¡Gracias!`, 'status_change');
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
    
    const exists = appointments.some(a => a.date === selectedDate && a.startTime === slotStart);
    if (exists) {
      alert("Ya existe un turno programado a esta hora.");
      return;
    }

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
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    setAllUsers(prev => [...prev, newUser]);
    setNewAdminData({ name: '', email: '', password: '' });
    setShowAdminModal(false);
  };

  const removeAppointment = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este turno?')) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  // --- Renders de Módulos ---

  const renderDashboard = () => {
    const todayCompleted = bookings.filter(a => a.date === todayStr && a.status === 'completed');
    const earningsToday = todayCompleted.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-sky-100 flex flex-col justify-between h-40">
            <DollarSign size={24} className="opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ingresos Hoy (Confirmado)</p><p className="text-3xl font-black">${earningsToday}</p></div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
            <Clock size={24} className="text-amber-500 opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Solicitudes Pendientes</p><p className="text-3xl font-black text-slate-800">{bookings.filter(b => b.status === 'pending').length}</p></div>
          </div>
          <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 flex flex-col justify-between h-40">
            <TrendingUp size={24} className="text-emerald-400 opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Pacientes</p><p className="text-3xl font-black">{allUsers.filter(u => u.role === 'client').length}</p></div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
            <CalendarIcon size={24} className="text-sky-500 opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Citas para Hoy</p><p className="text-3xl font-black text-slate-800">{bookings.filter(b => b.date === todayStr).length}</p></div>
          </div>
        </div>
        
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="text-sky-500" size={20} /> Resumen de Actividad Diaria
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
              <p className="text-center py-10 text-slate-300 font-bold uppercase text-[10px]">Sin movimientos registrados recientemente</p>
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
      case 'Analíticas': return (
         <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm text-center py-32">
          <BarChart size={64} className="mx-auto text-slate-200 mb-6" />
          <h3 className="text-2xl font-black text-slate-900 mb-2">Panel de Analíticas</h3>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Informes de rendimiento próximamente</p>
        </div>
      );
      case 'Ajustes': return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Settings className="text-sky-500" size={28} /> Configuración de Operación
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apertura Clínica</label>
                <input type="time" value={availability.startHour} onChange={e => setAvailability({...availability, startHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 font-black text-xl" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cierre Clínica</label>
                <input type="time" value={availability.endHour} onChange={e => setAvailability({...availability, endHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 font-black text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Database className="text-emerald-500" size={28} /> Módulo de Backup y Restauración
              </h3>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Formato Seguro XML</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Resguarda toda la información de la clínica. Genera archivos de salvaguarda que incluyen pacientes, turnos, odontogramas y registros de facturación para procesos de mantenimiento o migración de datos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                <div>
                  <h4 className="text-lg font-black text-slate-800 mb-1">Exportar Sistema</h4>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed">Generar una copia completa en XML.</p>
                </div>
                <button 
                  onClick={exportToXML}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                >
                  <Archive size={18} /> Descargar Backup XML
                </button>
              </div>

              <div className="p-8 bg-sky-50 rounded-[3rem] border border-sky-100 space-y-6">
                <div>
                  <h4 className="text-lg font-black text-sky-900 mb-1">Restaurar Datos</h4>
                  <p className="text-xs font-medium text-sky-700/60 leading-relaxed">Cargar un archivo de salva XML previo.</p>
                </div>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xml" 
                    onChange={importFromXML}
                    ref={fileInputRef}
                    className="hidden" 
                    id="xml-restore-btn"
                  />
                  <label 
                    htmlFor="xml-restore-btn"
                    className="w-full flex items-center justify-center gap-3 bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-sky-100 hover:bg-sky-600 cursor-pointer text-center active:scale-95 transition-all"
                  >
                    <UploadCloud size={18} /> Subir XML de Salva
                  </label>
                </div>
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
                  const hasAppointments = appointments.some(a => a.date === date && a.status !== 'available');
                  const hasSlots = appointments.some(a => a.date === date && a.status === 'available');

                  return (
                    <button 
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`relative p-3 rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center
                        ${isSelected ? 'bg-sky-500 text-white shadow-lg shadow-sky-100' : 'text-slate-600 hover:bg-slate-50'}
                      `}
                    >
                      {new Date(date).getDate() + 1}
                      <div className="absolute bottom-1.5 flex gap-0.5">
                        {hasAppointments && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></div>}
                        {hasSlots && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/50' : 'bg-sky-300'}`}></div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => setShowSlotModal(true)}
              className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Plus size={20} /> Abrir Espacio en {selectedDate}
            </button>
          </div>

          <div className="flex-1 space-y-6">
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agenda Diaria</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedDate}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-sky-500"></div> Disponible
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Paciente
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {dayAppointments.length > 0 ? dayAppointments.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(app => (
                  <div key={app.id} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6
                    ${app.status === 'available' ? 'bg-slate-50/50 border-dashed border-slate-200' : 
                      app.status === 'rejected' ? 'bg-rose-50/30 border-rose-100' : 
                      app.status === 'completed' ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-100 shadow-sm ring-1 ring-slate-50'}`}>
                    
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner
                        ${app.status === 'available' ? 'bg-white text-slate-300' : 
                          app.status === 'rejected' ? 'bg-rose-100 text-rose-500' : 
                          app.status === 'completed' ? 'bg-slate-200 text-slate-500' : 'bg-sky-500 text-white'}`}>
                        <span className="text-sm leading-none">{app.startTime}</span>
                      </div>
                      <div>
                        {app.status === 'available' ? (
                          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Horario Libre</h4>
                        ) : (
                          <div>
                            <h4 className="text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
                              {app.clientName}
                              {app.status === 'rejected' && <span className="text-[8px] px-2 py-0.5 bg-rose-500 text-white rounded-full uppercase">Rechazada</span>}
                              {app.status === 'completed' && <span className="text-[8px] px-2 py-0.5 bg-slate-800 text-white rounded-full uppercase">Facturada</span>}
                            </h4>
                            <p className="text-[9px] font-bold text-sky-500 uppercase tracking-widest">
                              {app.reason || 'Consulta General'} {app.paidAmount && `· $${app.paidAmount}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {app.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(app.id, 'approved')} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-emerald-100">Aprobar</button>
                          <button onClick={() => updateStatus(app.id, 'rejected')} className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl text-[9px] font-black uppercase">Rechazar</button>
                        </>
                      )}
                      {app.status === 'approved' && (
                        <button onClick={() => updateStatus(app.id, 'completed')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                          <Receipt size={14} /> Finalizar y Cobrar
                        </button>
                      )}
                      {app.status === 'rejected' && (
                        <button onClick={() => updateStatus(app.id, 'approved')} className="bg-sky-500 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase flex items-center gap-2 shadow-lg shadow-sky-100">
                          <RefreshCw size={14} /> Re-aprobar
                        </button>
                      )}
                      <button onClick={() => removeAppointment(app.id)} className="p-4 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center flex flex-col items-center justify-center space-y-4 opacity-20">
                    <CalendarDays size={60} className="text-slate-300" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Sin turnos creados</p>
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
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl text-center relative group">
                <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => { setPatientToEdit(patient!); setShowEditPatientModal(true); }}
                    className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-sky-500 transition-colors"
                   >
                    <Edit2 size={16} />
                   </button>
                   <button 
                    onClick={() => handleDeletePatient(patient!.id)}
                    className="p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-colors"
                   >
                    <Trash2 size={16} />
                   </button>
                </div>
                
                <div className="w-28 h-28 bg-sky-500 text-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-2xl shadow-sky-100">
                  {patient?.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">{patient?.name}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{patient?.phone}</p>
                <div className="pt-6 border-t border-slate-50 space-y-2">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Email</p>
                   <p className="text-xs font-bold text-slate-800">{patient?.email}</p>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-sky-400">Próximas Citas</h4>
                <div className="space-y-4">
                  {patientApps.filter(a => ['approved', 'pending'].includes(a.status)).map(a => (
                    <div key={a.id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{a.date}</p>
                      <p className="text-xs font-bold mt-1">{a.startTime} - {a.status}</p>
                    </div>
                  ))}
                  {patientApps.length === 0 && <p className="text-[10px] opacity-30 italic">Sin actividad registrada</p>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <Stethoscope size={28} className="text-sky-500" /> Odontograma de Evolución
                    </h3>
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

                <div className="mt-12 p-8 bg-slate-50 rounded-[3rem] border border-slate-200">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Evolución y Notas Médicas</h4>
                  <textarea 
                    placeholder="Escriba aquí la evolución del paciente, tratamientos recomendados o alergias importantes..."
                    className="w-full h-40 bg-transparent text-sm font-bold text-slate-800 outline-none resize-none"
                  />
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
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Manejo de Pacientes</h3>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o celular..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-sky-500/5 transition-all" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((user) => (
            <div key={user.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full -mr-12 -mt-12 group-hover:bg-sky-500 transition-colors duration-500"></div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                   <button 
                    onClick={() => { setPatientToEdit(user); setShowEditPatientModal(true); }}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                    title="Editar"
                   >
                    <Edit2 size={16} />
                   </button>
                   <button 
                    onClick={() => handleDeletePatient(user.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Eliminar"
                   >
                    <Trash2 size={16} />
                   </button>
                </div>
                
                <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-2xl mb-6 group-hover:bg-white group-hover:text-sky-500 transition-all duration-500">
                  {user.name.charAt(0)}
                </div>
                <h4 className="text-lg font-black text-slate-800 leading-tight mb-8">{user.name}</h4>
                <button 
                  onClick={() => {
                    setSelectedPatientId(user.id);
                    setViewingPatientFile(true);
                  }}
                  className="w-full py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  <FileText size={16} /> Ver Expediente
                </button>
              </div>
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Personal Administrativo</h3>
          <button 
            onClick={() => setShowAdminModal(true)}
            className="bg-sky-500 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-sky-100 flex items-center gap-3"
          >
            <UserPlus size={20} /> Nuevo Administrador
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

  return (
    <div className="pb-32 min-h-screen">
      {renderActiveModule()}

      {/* Modal Edición de Paciente */}
      {showEditPatientModal && patientToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900">Editar Paciente</h3>
              <button onClick={() => setShowEditPatientModal(false)} className="text-slate-400 hover:text-slate-900"><X size={24}/></button>
            </div>
            <form onSubmit={handleUpdatePatient} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  value={patientToEdit.name}
                  onChange={e => setPatientToEdit({...patientToEdit, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input 
                  required
                  type="email" 
                  value={patientToEdit.email}
                  onChange={e => setPatientToEdit({...patientToEdit, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono Móvil</label>
                <input 
                  required
                  type="tel" 
                  value={patientToEdit.phone}
                  onChange={e => setPatientToEdit({...patientToEdit, phone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest mt-4 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
              >
                Actualizar Información
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Botón flotante para abrir horarios */}
      <button 
        onClick={() => setShowSlotModal(true)}
        className="fixed bottom-12 right-12 w-20 h-20 bg-sky-500 text-white rounded-[2.5rem] shadow-2xl flex items-center justify-center z-[80] border-[6px] border-white hover:bg-sky-600 active:scale-90 transition-all group"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform" />
      </button>

      {/* Modal de Facturación */}
      {showBillingModal && billingAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-50">
                <Receipt size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Finalizar Tratamiento</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Cita de {billingAppointment.clientName}</p>
            </div>

            <form onSubmit={handleFinalizeBilling} className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe Total Cobrado</label>
                  <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest font-bold">Base: ${treatments.find(t => t.id === billingAppointment.treatmentId)?.price || 0}</span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                  <input 
                    required 
                    type="number" 
                    value={billingAmount} 
                    onChange={e => setBillingAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] pl-16 pr-8 py-6 font-black text-3xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                  <span>Procedimiento</span>
                  <span className="text-slate-900">{treatments.find(t => t.id === billingAppointment.treatmentId)?.name || 'Consulta General'}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                  <span>Fecha Cita</span>
                  <span className="text-slate-900">{billingAppointment.date}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setShowBillingModal(false); setBillingAppointment(null); }}
                  className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} /> Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900">Registrar Admin</h3>
              <button onClick={() => setShowAdminModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={createAdmin} className="space-y-6">
              <input required type="text" value={newAdminData.name} onChange={e => setNewAdminData({...newAdminData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold" placeholder="Nombre completo" />
              <input required type="email" value={newAdminData.email} onChange={e => setNewAdminData({...newAdminData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold" placeholder="Correo electrónico" />
              <input required type="password" value={newAdminData.password} onChange={e => setNewAdminData({...newAdminData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold" placeholder="Contraseña de acceso" />
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest mt-4">Guardar Administrador</button>
            </form>
          </div>
        </div>
      )}

      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 leading-tight">Habilitar Turno</h3>
              <button onClick={() => setShowSlotModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={createSlot} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Seleccionar Fecha</label>
                <input required type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={todayStr} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hora Inicio</label>
                  <input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hora Fin</label>
                  <input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-lg" />
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl mt-4 active:scale-95 transition-all">Crear Espacio de Reserva</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

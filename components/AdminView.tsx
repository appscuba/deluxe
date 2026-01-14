
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
  Info
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
  
  // Estados de formulario
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('09:45');
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdminData, setNewAdminData] = useState({ name: '', email: '', password: '' });
  
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
      version: "1.0"
    };

    // Crear estructura XML básica
    let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlString += '<DeluxeDentalBackup>\n';
    xmlString += `  <Metadata>\n    <Date>${data.exportDate}</Date>\n    <Version>${data.version}</Version>\n  </Metadata>\n`;
    
    // Serializar el objeto principal como CDATA para garantizar integridad absoluta
    xmlString += `  <Payload><![CDATA[${JSON.stringify(data)}]]></Payload>\n`;
    xmlString += '</DeluxeDentalBackup>';

    const blob = new Blob([xmlString], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeluxeDental_Backup_${new Date().toISOString().split('T')[0]}.xml`;
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
        const payloadNode = xmlDoc.getElementsByTagName("Payload")[0];
        
        if (!payloadNode) throw new Error("Archivo XML no válido para Deluxe Dental.");

        const jsonData = JSON.parse(payloadNode.textContent || "");
        
        // Restauración de estados
        if (jsonData.users) setAllUsers(jsonData.users);
        if (jsonData.appointments) setAppointments(jsonData.appointments);
        if (jsonData.treatments) setTreatments(jsonData.treatments);
        if (jsonData.notifications) setNotifications(jsonData.notifications);
        if (jsonData.availability) setAvailability(jsonData.availability);
        if (jsonData.patientRecords) setPatientRecords(jsonData.patientRecords);

        alert("¡Sistema restaurado con éxito!");
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error("Error al importar:", error);
        alert("Error al procesar el archivo de respaldo. Asegúrate de que es un archivo XML válido generado por esta aplicación.");
      }
    };
    reader.readAsText(file);
  };

  // --- Funciones de Gestión ---

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
          addNotification(app.clientId, "Tratamiento Finalizado", `Se ha registrado el pago de $${billingAmount}. ¡Gracias por confiar en nosotros!`, 'status_change');
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

  // --- Renders ---

  const renderDashboard = () => {
    const todayCompleted = bookings.filter(a => a.date === todayStr && a.status === 'completed');
    const earningsToday = todayCompleted.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-sky-100 flex flex-col justify-between h-40">
            <DollarSign size={24} className="opacity-50" />
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ingresos Hoy (Facturado)</p><p className="text-3xl font-black">${earningsToday}</p></div>
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
              <p className="text-center py-10 text-slate-300 font-bold uppercase text-[10px]">No hay actividad reciente</p>
            )}
          </div>
        </div>
      </div>
    );
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
                      app.status === 'rejected' ? 'bg-rose-50/30 border-rose-100 grayscale-[0.3]' : 
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
                          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Espacio para Reserva</h4>
                        ) : (
                          <div>
                            <h4 className="text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
                              {app.clientName}
                              {app.status === 'rejected' && <span className="text-[8px] px-2 py-0.5 bg-rose-500 text-white rounded-full">RECHAZADA</span>}
                              {app.status === 'completed' && <span className="text-[8px] px-2 py-0.5 bg-slate-800 text-white rounded-full">FACTURADA</span>}
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
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Agenda Vacía</p>
                  </div>
                )}
              </div>
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
            className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm transition-all"
          >
            <ChevronRight size={18} className="rotate-180" /> Regresar al listado
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl text-center">
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
                      <Stethoscope size={28} className="text-sky-500" /> Dentigrama Clínico
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
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Notas y Observaciones</h4>
                  <textarea 
                    placeholder="Escriba aquí la evolución del paciente..."
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
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Pacientes</h3>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((user) => (
            <div key={user.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full -mr-12 -mt-12 group-hover:bg-sky-500 transition-colors duration-500"></div>
              
              <div className="flex flex-col items-center text-center relative z-10">
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
                  <FileText size={16} /> Ver Ficha Médica
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
      case 'Pacientes': return renderPatients();
      case 'Equipo': return renderEquipo();
      case 'Analíticas': return (
         <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm text-center py-32">
          <BarChart size={64} className="mx-auto text-slate-200 mb-6" />
          <h3 className="text-2xl font-black text-slate-900 mb-2">Panel de Analíticas</h3>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Visualización de datos avanzados</p>
        </div>
      );
      case 'Ajustes': return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Settings className="text-sky-500" size={28} /> Configuración del Centro
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inicio Jornada</label>
                <input type="time" value={availability.startHour} onChange={e => setAvailability({...availability, startHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 font-black" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fin Jornada</label>
                <input type="time" value={availability.endHour} onChange={e => setAvailability({...availability, endHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 font-black" />
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Database className="text-emerald-500" size={28} /> Mantenimiento de Datos
              </h3>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                <Info size={14} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Formato XML Soportado</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                <div>
                  <h4 className="text-lg font-black text-slate-800 mb-1">Copia de Seguridad</h4>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed">Exporta todos los pacientes, citas y registros contables a un archivo XML seguro.</p>
                </div>
                <button 
                  onClick={exportToXML}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <Save size={18} /> Generar Backup XML
                </button>
              </div>

              <div className="p-8 bg-sky-50 rounded-[3rem] border border-sky-100 space-y-6">
                <div>
                  <h4 className="text-lg font-black text-sky-900 mb-1">Restauración</h4>
                  <p className="text-xs font-medium text-sky-700/60 leading-relaxed">Carga un archivo de respaldo previo para restaurar el estado del sistema.</p>
                </div>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xml" 
                    onChange={importFromXML}
                    ref={fileInputRef}
                    className="hidden" 
                    id="xml-upload"
                  />
                  <label 
                    htmlFor="xml-upload"
                    className="w-full flex items-center justify-center gap-3 bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-sky-100 hover:bg-sky-600 active:scale-95 transition-all cursor-pointer"
                  >
                    <UploadCloud size={18} /> Importar y Restaurar
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

  return (
    <div className="pb-32 min-h-screen">
      {renderActiveModule()}

      <button 
        onClick={() => setShowSlotModal(true)}
        className="fixed bottom-12 right-12 w-24 h-24 bg-sky-500 text-white rounded-[3rem] shadow-2xl flex items-center justify-center z-[80] border-[8px] border-white hover:bg-sky-600 active:scale-90 transition-all group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform" />
      </button>

      {/* Modal de Facturación */}
      {showBillingModal && billingAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-50">
                <Receipt size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Cerrar y Facturar</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Cita de {billingAppointment.clientName}</p>
            </div>

            <form onSubmit={handleFinalizeBilling} className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto Final Cobrado</label>
                  <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Sugerido: ${treatments.find(t => t.id === billingAppointment.treatmentId)?.price || 0}</span>
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
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Tratamiento</span>
                  <span>{treatments.find(t => t.id === billingAppointment.treatmentId)?.name || 'Consulta General'}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Fecha</span>
                  <span>{billingAppointment.date}</span>
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
              <h3 className="text-3xl font-black text-slate-900">Nuevo Admin</h3>
              <button onClick={() => setShowAdminModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={createAdmin} className="space-y-6">
              <input required type="text" value={newAdminData.name} onChange={e => setNewAdminData({...newAdminData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold" placeholder="Nombre" />
              <input required type="email" value={newAdminData.email} onChange={e => setNewAdminData({...newAdminData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold" placeholder="Email" />
              <input required type="password" value={newAdminData.password} onChange={e => setNewAdminData({...newAdminData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold" placeholder="Contraseña" />
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest mt-4">Guardar</button>
            </form>
          </div>
        </div>
      )}

      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 leading-tight">Abrir Turno</h3>
              <button onClick={() => setShowSlotModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={createSlot} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha</label>
                <input required type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={todayStr} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Inicio</label>
                  <input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fin</label>
                  <input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg" />
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl mt-4 active:scale-95 transition-all">Habilitar Horario</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

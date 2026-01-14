
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Appointment, User, PatientRecord, ClinicSettings } from '../types';
import { Odontogram } from './Odontogram';
import { 
  CheckCircle2, 
  Trash2,
  Calendar as CalendarIcon,
  Plus,
  X,
  Search,
  Activity,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  ShieldCheck,
  UserPlus,
  Lock,
  Database,
  UploadCloud,
  Archive,
  Edit2,
  UserCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { 
    currentUser,
    appointments, 
    setAppointments, 
    addNotification, 
    allUsers, 
    setAllUsers,
    activeTab,
    clinicSettings,
    setClinicSettings,
    patientRecords,
    updatePatientOdontogram,
    setPatientRecords
  } = useAppContext();

  // Modales
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Estados de formulario
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('09:45');
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdminData, setNewAdminData] = useState({ name: '', email: '', password: '', phone: '' });
  
  // Ajustes de Clínica (Sincronizado con contexto)
  const [tempSettings, setTempSettings] = useState<ClinicSettings>(clinicSettings);

  // Solo actualizar tempSettings cuando cambiamos explícitamente a la pestaña Ajustes o si clinicSettings cambia externamente
  useEffect(() => {
    setTempSettings(clinicSettings);
  }, [clinicSettings]);

  // Asignación de Cita
  const [appointmentToAssign, setAppointmentToAssign] = useState<Appointment | null>(null);
  const [patientSearch, setPatientSearch] = useState('');

  // Edición de Usuario
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingPatientFile, setViewingPatientFile] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const bookings = useMemo(() => appointments.filter(a => a.status !== 'available'), [appointments]);
  const ROOT_ADMIN_EMAIL = 'appscuba@gmail.com';

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysCount; i++) days.push(new Date(year, month, i).toISOString().split('T')[0]);
    return days;
  }, [currentMonth]);

  const handleDeleteUser = (id: string, email: string) => {
    if (email === ROOT_ADMIN_EMAIL) {
      alert('No se puede eliminar al Administrador Global.');
      return;
    }
    if (confirm('¿Deseas eliminar este usuario permanentemente?')) {
      setAllUsers(prev => prev.filter(u => u.id !== id));
      setAppointments(prev => prev.filter(a => a.clientId !== id));
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    setAllUsers(prev => prev.map(u => u.id === userToEdit.id ? userToEdit : u));
    setShowEditUserModal(false);
    alert('Usuario actualizado con éxito.');
  };

  const updateStatus = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => {
      const updated = prev.map(app => {
        if (app.id === id) {
          if (app.clientId) {
            const title = newStatus === 'approved' ? 'Cita Confirmada' : 'Cita Rechazada';
            addNotification(app.clientId, title, `Tu cita para el ${app.date} ha sido ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}.`, 'status_change');
          }
          return { ...app, status: newStatus };
        }
        return app;
      });
      return updated;
    });
  };

  const createSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlot: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate,
      startTime: slotStart,
      endTime: slotEnd,
      status: 'available',
      createdAt: new Date().toISOString(),
    };
    setAppointments(prev => [...prev, newSlot]);
    setShowSlotModal(false);
  };

  const createAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (allUsers.some(u => u.email.toLowerCase() === newAdminData.email.toLowerCase()) || newAdminData.email.toLowerCase() === ROOT_ADMIN_EMAIL) {
      alert("Este email ya está registrado.");
      return;
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAdminData.name,
      email: newAdminData.email,
      phone: newAdminData.phone,
      password: newAdminData.password,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    setAllUsers(prev => [...prev, newUser]);
    setNewAdminData({ name: '', email: '', password: '', phone: '' });
    setShowAdminModal(false);
    alert("Administrador creado exitosamente.");
  };

  const saveSettings = () => {
    setClinicSettings({ ...tempSettings });
    alert("Ajustes de la clínica guardados correctamente.");
  };

  const exportData = () => {
    const data = { allUsers, appointments, clinicSettings, patientRecords };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_deluxe_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.allUsers) setAllUsers(data.allUsers);
        if (data.appointments) setAppointments(data.appointments);
        if (data.clinicSettings) setClinicSettings(data.clinicSettings);
        if (data.patientRecords) setPatientRecords(data.patientRecords);
        alert("Restauración completada satisfactoriamente.");
      } catch (err) { alert("Archivo inválido o corrupto."); }
    };
    reader.readAsText(file);
  };

  const handleAssignPatient = (patient: User) => {
    if (!appointmentToAssign) return;
    setAppointments(prev => prev.map(app => 
      app.id === appointmentToAssign.id 
      ? { ...app, status: 'approved', clientId: patient.id, clientName: patient.name } 
      : app
    ));
    addNotification(patient.id, "Cita Agendada", `Se te ha asignado una cita para el día ${appointmentToAssign.date} a las ${appointmentToAssign.startTime}.`, 'status_change');
    setShowAssignModal(false);
    setAppointmentToAssign(null);
    setPatientSearch('');
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between h-40">
          <Activity size={24} className="opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Pendientes</p><p className="text-3xl font-black">{bookings.filter(b => b.status === 'pending').length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <CheckCircle2 size={24} className="text-emerald-500 opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hoy</p><p className="text-3xl font-black text-slate-800">{bookings.filter(b => b.date === todayStr).length}</p></div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between h-40">
          <ShieldCheck size={24} className="text-sky-400 opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Admin Staff</p><p className="text-3xl font-black">{allUsers.filter(u => u.role === 'admin').length + 1}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <CalendarIcon size={24} className="text-sky-500 opacity-50" />
          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pacientes</p><p className="text-3xl font-black text-slate-800">{allUsers.filter(u => u.role === 'client').length}</p></div>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const dayAppointments = appointments.filter(a => a.date === selectedDate).sort((a,b) => a.startTime.localeCompare(b.startTime));
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
      <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
        <div className="w-full lg:w-[400px] space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h4>
              <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl"><ChevronLeft size={20}/></button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl"><ChevronRight size={20}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['D','L','M','M','J','V','S'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-300 py-2">{d}</div>)}
              {calendarDays.map((date, i) => (
                <button key={i} onClick={() => date && setSelectedDate(date)} disabled={!date} className={`p-3 rounded-2xl text-[11px] font-bold transition-all ${date === selectedDate ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'} ${!date && 'opacity-0'}`}>
                  {date ? new Date(date).getDate() + 1 : ''}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowSlotModal(true)} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform">
            <Plus size={20} /> Nuevo Espacio Libre
          </button>
        </div>

        <div className="flex-1 bg-white p-8 rounded-[3.5rem] border shadow-sm min-h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agenda: {selectedDate}</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{dayAppointments.length} turnos configurados</span>
          </div>
          <div className="space-y-4">
            {dayAppointments.length > 0 ? dayAppointments.map(app => (
              <div key={app.id} className={`p-6 rounded-[2.5rem] border transition-all flex items-center justify-between ${app.status === 'available' ? 'bg-slate-50/50 border-dashed' : 'bg-white shadow-sm border-slate-100'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${app.status === 'available' ? 'bg-white text-slate-300 border border-slate-100 shadow-inner' : 'bg-sky-500 text-white shadow-lg shadow-sky-100'}`}>{app.startTime}</div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">{app.status === 'available' ? 'Espacio Libre' : app.clientName}</h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${app.status === 'pending' ? 'text-amber-500' : 'text-slate-400'}`}>
                      {app.status === 'pending' ? 'Solicitud por Aprobar' : app.status === 'available' ? 'Disponible para paciente' : 'Cita Confirmada'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {app.status === 'available' && (
                    <button onClick={() => { setAppointmentToAssign(app); setShowAssignModal(true); }} className="bg-sky-100 text-sky-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-sky-500 hover:text-white transition-all shadow-sm">
                      <UserCheck size={16} /> Agendar
                    </button>
                  )}
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(app.id, 'approved')} className="bg-emerald-500 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-emerald-100 active:scale-90">Aprobar</button>
                      <button onClick={() => updateStatus(app.id, 'rejected')} className="bg-rose-50 text-rose-500 px-5 py-3 rounded-2xl text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all active:scale-90">Rechazar</button>
                    </div>
                  )}
                  <button onClick={() => { if(confirm('¿Eliminar turno definitivamente?')) setAppointments(prev => prev.filter(a => a.id !== app.id)) }} className="p-3 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            )) : <div className="py-24 text-center opacity-20 font-black uppercase text-[10px] tracking-widest">No hay turnos disponibles para este día</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderAjustes = () => (
    <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-6 duration-700">
      <section className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-8">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Building2 className="text-sky-500" size={28} /> Información de la Clínica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
            <input type="text" value={tempSettings.name} onChange={e => setTempSettings({...tempSettings, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-sky-500/10" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono Público</label>
            <input type="text" value={tempSettings.phone} onChange={e => setTempSettings({...tempSettings, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Contacto</label>
            <input type="email" value={tempSettings.email} onChange={e => setTempSettings({...tempSettings, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Física</label>
            <input type="text" value={tempSettings.address} onChange={e => setTempSettings({...tempSettings, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none" />
          </div>
        </div>
        <button onClick={saveSettings} className="bg-sky-500 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] flex items-center gap-3 shadow-lg hover:bg-sky-600 transition-all active:scale-95"><Save size={18} /> Guardar Cambios en Ajustes</button>
      </section>

      <section className="bg-slate-900 p-12 rounded-[4rem] shadow-2xl space-y-8">
        <h3 className="text-2xl font-black text-white flex items-center gap-3"><Database className="text-emerald-400" size={28} /> Copia de Seguridad</h3>
        <p className="text-slate-400 text-sm font-bold">Descarga o restaura toda la base de datos de la aplicación incluyendo pacientes, citas y configuraciones.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={exportData} className="bg-white/10 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3 hover:bg-white/20 transition-all"><Archive size={18} /> Descargar Backup (JSON)</button>
          <div className="relative">
            <input type="file" accept=".json" onChange={importData} className="hidden" id="import-json-full-data" />
            <label htmlFor="import-json-full-data" className="w-full flex items-center justify-center gap-3 bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] cursor-pointer hover:bg-sky-600 transition-all"><UploadCloud size={18} /> Cargar Backup</label>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="pb-32">
      {activeTab === 'Dashboard' && renderDashboard()}
      {activeTab === 'Calendario' && renderCalendar()}
      {activeTab === 'Pacientes' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           {viewingPatientFile && selectedPatientId ? (
              <div className="space-y-8">
                <button onClick={() => setViewingPatientFile(false)} className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 bg-white px-6 py-3 rounded-full border shadow-sm">
                  <ChevronLeft size={18} /> Volver al listado
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1 bg-white p-10 rounded-[3.5rem] border shadow-xl text-center relative group">
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setUserToEdit(allUsers.find(u => u.id === selectedPatientId)!); setShowEditUserModal(true); }} className="p-3 bg-slate-900 text-white rounded-2xl"><Edit2 size={16} /></button>
                    </div>
                    <div className="w-28 h-28 bg-sky-500 text-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-xl shadow-sky-100">{allUsers.find(u => u.id === selectedPatientId)?.name.charAt(0)}</div>
                    <h2 className="text-2xl font-black text-slate-900">{allUsers.find(u => u.id === selectedPatientId)?.name}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{allUsers.find(u => u.id === selectedPatientId)?.phone}</p>
                  </div>
                  <div className="lg:col-span-3 bg-white p-12 rounded-[4rem] border shadow-sm">
                    <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3"><Stethoscope size={28} className="text-sky-500" /> Historial / Odontograma</h3>
                    <Odontogram toothStates={patientRecords.find(r => r.patientId === selectedPatientId)?.odontogram || []} onUpdateTooth={(id, condition) => {
                      const record = patientRecords.find(r => r.patientId === selectedPatientId);
                      const newOdo = [...(record?.odontogram || [])];
                      const idx = newOdo.findIndex(s => s.id === id);
                      if (idx >= 0) newOdo[idx] = { ...newOdo[idx], condition };
                      else newOdo.push({ id, condition });
                      updatePatientOdontogram(selectedPatientId!, newOdo);
                    }} />
                  </div>
                </div>
              </div>
           ) : (
             <>
               <div className="flex items-center justify-between gap-6 px-4">
                  <h3 className="text-3xl font-black text-slate-900">Base de Pacientes</h3>
                  <div className="relative w-96">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-sky-500/10" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allUsers.filter(u => u.role === 'client' && u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                    <div key={user.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm group text-center relative hover:shadow-2xl transition-all">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                         <button onClick={() => { setUserToEdit(user); setShowEditUserModal(true); }} className="p-2 text-slate-400 hover:text-sky-500"><Edit2 size={16} /></button>
                         <button onClick={() => handleDeleteUser(user.id, user.email)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                      </div>
                      <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 flex items-center justify-center font-black text-slate-400 text-2xl mx-auto mb-6 group-hover:bg-sky-50 transition-colors shadow-inner">{user.name.charAt(0)}</div>
                      <h4 className="text-lg font-black text-slate-800 mb-8">{user.name}</h4>
                      <button onClick={() => { setSelectedPatientId(user.id); setViewingPatientFile(true); }} className="w-full py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] hover:bg-slate-900 hover:text-white transition-all shadow-sm">Ver Expediente</button>
                    </div>
                  ))}
                </div>
             </>
           )}
        </div>
      )}
      {activeTab === 'Equipo' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between gap-6 px-4">
            <h3 className="text-3xl font-black text-slate-900">Personal Administrativo</h3>
            <button onClick={() => setShowAdminModal(true)} className="bg-sky-500 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-2xl flex items-center gap-3 active:scale-95 transition-all"><UserPlus size={20} /> Crear Administrador</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="bg-slate-900 p-8 rounded-[3.5rem] shadow-xl text-center relative group">
              <div className="w-20 h-20 rounded-[2.2rem] bg-sky-500/20 flex items-center justify-center font-black text-sky-400 text-2xl mx-auto mb-6 shadow-inner">A</div>
              <h4 className="text-lg font-black text-white leading-tight mb-1">Super Administrador</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">{ROOT_ADMIN_EMAIL}</p>
              <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-block bg-sky-500 text-white shadow-lg shadow-sky-500/20">Acceso Total</div>
            </div>
            
            {allUsers.filter(u => u.role === 'admin').map(admin => (
              <div key={admin.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm text-center relative group hover:shadow-xl transition-all">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => { setUserToEdit(admin); setShowEditUserModal(true); }} className="p-2 text-slate-400 hover:text-sky-500"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteUser(admin.id, admin.email)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
                <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 flex items-center justify-center font-black text-slate-400 text-2xl mx-auto mb-6 group-hover:bg-sky-50 transition-colors shadow-inner">{admin.name.charAt(0)}</div>
                <h4 className="text-lg font-black text-slate-800 leading-tight mb-1">{admin.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{admin.email}</p>
                <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-block bg-sky-50 text-sky-600">Administrador</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'Ajustes' && renderAjustes()}

      {/* MODALES REUTILIZABLES */}
      {showEditUserModal && userToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900">Editar Perfil</h3>
              <button onClick={() => setShowEditUserModal(false)} className="text-slate-400"><X size={24}/></button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                <input required type="text" value={userToEdit.name} onChange={e => setUserToEdit({...userToEdit, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input required type="email" value={userToEdit.email} disabled={userToEdit.email === ROOT_ADMIN_EMAIL} onChange={e => setUserToEdit({...userToEdit, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none disabled:opacity-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={18} />
                  <input type="password" value={userToEdit.password || ''} onChange={e => setUserToEdit({...userToEdit, password: e.target.value})} className="w-full bg-sky-50 border border-sky-100 rounded-2xl px-12 py-4 font-bold text-slate-800 outline-none" placeholder="Actualizar contraseña" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-3xl font-black text-slate-900 mb-10 tracking-tighter">Crear Cuenta Admin</h3>
            <form onSubmit={createAdmin} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" value={newAdminData.name} onChange={e => setNewAdminData({...newAdminData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold outline-none shadow-inner" placeholder="Nombre completo" />
                <input required type="tel" value={newAdminData.phone} onChange={e => setNewAdminData({...newAdminData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold outline-none shadow-inner" placeholder="Teléfono" />
              </div>
              <input required type="email" value={newAdminData.email} onChange={e => setNewAdminData({...newAdminData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold outline-none shadow-inner" placeholder="Correo electrónico" />
              <input required type="password" value={newAdminData.password} onChange={e => setNewAdminData({...newAdminData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-bold outline-none shadow-inner" placeholder="Contraseña de acceso" />
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-4">Habilitar Administrador</button>
              <button type="button" onClick={() => setShowAdminModal(false)} className="w-full text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest">Cancelar Registro</button>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && appointmentToAssign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">Agendar Paciente</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400"><X size={24}/></button>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Buscar por nombre..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 font-bold outline-none" />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {allUsers.filter(u => u.role === 'client' && u.name.toLowerCase().includes(patientSearch.toLowerCase())).map(p => (
                <button key={p.id} onClick={() => handleAssignPatient(p)} className="w-full flex items-center gap-4 p-4 hover:bg-sky-50 rounded-2xl transition-all group border border-transparent hover:border-sky-100">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-inner">{p.name.charAt(0)}</div>
                  <div className="text-left"><p className="text-sm font-black text-slate-800">{p.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p.email}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-3xl font-black text-slate-900 mb-10 tracking-tighter">Crear Espacio Libre</h3>
            <form onSubmit={createSlot} className="space-y-8">
              <input required type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={todayStr} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 font-black text-lg outline-none" />
              <div className="grid grid-cols-2 gap-6">
                <input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none" />
                <input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none" />
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase mt-4 shadow-xl active:scale-95 transition-all">Publicar en Agenda</button>
              <button type="button" onClick={() => setShowSlotModal(false)} className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Cerrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Appointment, Treatment, User, Notification, PatientRecord, ClinicAvailability } from '../types';
import { Odontogram } from './Odontogram';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  DollarSign,
  Trash2,
  Calendar as CalendarIcon,
  Plus,
  X,
  Search,
  Settings,
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
  AlertCircle
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { 
    currentUser,
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
    setPatientRecords,
    updatePatientOdontogram,
    notifications,
    setNotifications
  } = useAppContext();

  // Modales
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  
  // Estados de formulario
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('09:45');
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdminData, setNewAdminData] = useState({ name: '', email: '', password: '', phone: '' });
  
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

  const exportToXML = () => {
    const data = {
      users: allUsers,
      appointments,
      treatments,
      notifications,
      availability,
      patientRecords,
      exportDate: new Date().toISOString()
    };
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?><DeluxeBackup><Payload><![CDATA[${JSON.stringify(data)}]]></Payload></DeluxeBackup>`;
    const blob = new Blob([xmlString], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DentalBackup_${new Date().getTime()}.xml`;
    link.click();
  };

  const importFromXML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(event.target?.result as string, "text/xml");
        const payload = JSON.parse(xmlDoc.getElementsByTagName("Payload")[0].textContent || "");
        if (payload.users) setAllUsers(payload.users);
        if (payload.appointments) setAppointments(payload.appointments);
        alert("Restauración exitosa");
      } catch (err) { alert("Error al importar"); }
    };
    reader.readAsText(file);
  };

  const handleDeleteUser = (id: string, email: string) => {
    if (email === ROOT_ADMIN_EMAIL) {
      alert('No se puede eliminar al Administrador Global.');
      return;
    }
    if (confirm('¿Deseas eliminar este usuario? Sus citas también serán removidas.')) {
      setAllUsers(prev => prev.filter(u => u.id !== id));
      setAppointments(prev => prev.filter(a => a.clientId !== id));
      alert('Usuario eliminado.');
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setAllUsers(prev => prev.map(u => u.id === userToEdit.id ? userToEdit : u));
    setShowEditUserModal(false);
    setUserToEdit(null);
    alert('Usuario actualizado correctamente.');
  };

  const updateStatus = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        if (app.clientId) {
          const title = newStatus === 'approved' ? 'Cita Confirmada' : newStatus === 'rejected' ? 'Cita Rechazada' : 'Actualización';
          const msg = newStatus === 'approved' ? 'Tu cita ha sido aprobada. ¡Te esperamos!' : 'Tu cita no ha podido ser aceptada.';
          addNotification(app.clientId, title, msg, 'status_change');
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
        if (app.clientId) addNotification(app.clientId, "Tratamiento Finalizado", `Pago de $${billingAmount} registrado.`, 'status_change');
        return { ...app, status: 'completed', paidAmount: billingAmount };
      }
      return app;
    }));
    setShowBillingModal(false);
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
    setAppointments(prev => [newSlot, ...prev]);
    setShowSlotModal(false);
  };

  const createAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de Email Duplicado
    const emailExists = allUsers.some(u => u.email.toLowerCase() === newAdminData.email.toLowerCase()) || newAdminData.email === ROOT_ADMIN_EMAIL;
    if (emailExists) {
      alert("Este correo electrónico ya está registrado en el sistema.");
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAdminData.name,
      email: newAdminData.email,
      phone: newAdminData.phone || 'N/A',
      password: newAdminData.password,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    setAllUsers(prev => [...prev, newUser]);
    setNewAdminData({ name: '', email: '', password: '', phone: '' });
    setShowAdminModal(false);
    alert("Nuevo administrador registrado con éxito.");
  };

  return (
    <div className="pb-32">
      {activeTab === 'Dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between h-40">
              <DollarSign size={24} className="opacity-50" />
              <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ingresos Hoy</p><p className="text-3xl font-black">${bookings.filter(a => a.date === todayStr && a.status === 'completed').reduce((acc, c) => acc + (c.paidAmount || 0), 0)}</p></div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
              <Clock size={24} className="text-amber-500 opacity-50" />
              <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendientes</p><p className="text-3xl font-black text-slate-800">{bookings.filter(b => b.status === 'pending').length}</p></div>
            </div>
            <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between h-40">
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
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : app.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {app.status}
                  </span>
                </div>
              )) : <p className="text-center py-10 text-slate-300 font-bold uppercase text-[10px]">Sin movimientos</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Pacientes' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {viewingPatientFile && selectedPatientId ? (
            <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
              <button onClick={() => setViewingPatientFile(false)} className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 bg-white px-6 py-3 rounded-full border">
                <ChevronLeft size={18} /> Regresar
              </button>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 bg-white p-10 rounded-[3.5rem] border shadow-xl text-center group relative">
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => { setUserToEdit(allUsers.find(u => u.id === selectedPatientId)!); setShowEditUserModal(true); }} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-sky-500 transition-colors"><Edit2 size={16} /></button>
                  </div>
                  <div className="w-28 h-28 bg-sky-500 text-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black mx-auto mb-6">{allUsers.find(u => u.id === selectedPatientId)?.name.charAt(0)}</div>
                  <h2 className="text-2xl font-black text-slate-900">{allUsers.find(u => u.id === selectedPatientId)?.name}</h2>
                  <p className="text-xs text-slate-400 font-bold mt-2">{allUsers.find(u => u.id === selectedPatientId)?.phone}</p>
                </div>
                <div className="lg:col-span-3 bg-white p-12 rounded-[4rem] border shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3"><Stethoscope size={28} className="text-sky-500" /> Odontograma</h3>
                  <Odontogram toothStates={patientRecords.find(r => r.patientId === selectedPatientId)?.odontogram || []} onUpdateTooth={(id, condition) => {
                    const record = patientRecords.find(r => r.patientId === selectedPatientId);
                    const newOdontogram = [...(record?.odontogram || [])];
                    const idx = newOdontogram.findIndex(s => s.id === id);
                    if (idx >= 0) newOdontogram[idx] = { ...newOdontogram[idx], condition };
                    else newOdontogram.push({ id, condition });
                    updatePatientOdontogram(selectedPatientId!, newOdontogram);
                  }} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-6 px-4">
                <h3 className="text-3xl font-black text-slate-900">Pacientes</h3>
                <div className="relative w-96">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" placeholder="Buscar paciente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white border rounded-[2rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-sky-500/10 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allUsers.filter(u => u.role === 'client' && u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                  <div key={user.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm hover:shadow-2xl transition-all group text-center relative">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => { setUserToEdit(user); setShowEditUserModal(true); }} className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={16} /></button>
                       <button onClick={() => handleDeleteUser(user.id, user.email)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                    </div>
                    <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 flex items-center justify-center font-black text-slate-400 text-2xl mx-auto mb-6 group-hover:bg-sky-50 transition-colors">
                      {user.name.charAt(0)}
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-8">{user.name}</h4>
                    <button onClick={() => { setSelectedPatientId(user.id); setViewingPatientFile(true); }} className="w-full py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] hover:bg-slate-900 hover:text-white transition-all">Ver Expediente</button>
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
            <h3 className="text-3xl font-black text-slate-900">Equipo Médico</h3>
            <button onClick={() => setShowAdminModal(true)} className="bg-sky-500 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-2xl flex items-center gap-3 hover:bg-sky-600 transition-all">
              <UserPlus size={20} /> Nuevo Administrador
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allUsers.filter(u => u.role === 'admin').map(admin => {
              const isGlobal = admin.email === ROOT_ADMIN_EMAIL;
              const canEditThisAdmin = !isGlobal || (currentUser?.email === ROOT_ADMIN_EMAIL);
              
              return (
                <div key={admin.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm text-center relative group">
                  {!isGlobal && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => { setUserToEdit(admin); setShowEditUserModal(true); }} className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteUser(admin.id, admin.email)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                    </div>
                  )}
                  {isGlobal && currentUser?.email === ROOT_ADMIN_EMAIL && (
                     <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setUserToEdit(admin); setShowEditUserModal(true); }} className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={16} /></button>
                     </div>
                  )}
                  
                  <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 flex items-center justify-center font-black text-slate-400 text-2xl mx-auto mb-6 group-hover:bg-sky-50 transition-colors">
                    {admin.name.charAt(0)}
                  </div>
                  <h4 className="text-lg font-black text-slate-800 leading-tight mb-1">{admin.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{admin.email}</p>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-block ${isGlobal ? 'bg-slate-900 text-white' : 'bg-sky-50 text-sky-600'}`}>
                    {isGlobal ? 'Super Admin' : 'Administrador'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'Ajustes' && (
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-10">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Database className="text-emerald-500" size={28} /> Respaldo de Seguridad</h3>
            <p className="text-slate-400 text-sm font-medium">Descarga una copia completa de la base de datos en formato XML o restaura una previa.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={exportToXML} className="bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3 hover:opacity-90 transition-all"><Archive size={18} /> Exportar Base de Datos</button>
              <div className="relative">
                <input type="file" accept=".xml" onChange={importFromXML} ref={fileInputRef} className="hidden" id="xml-restore-file" />
                <label htmlFor="xml-restore-file" className="w-full flex items-center justify-center gap-3 bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] cursor-pointer hover:bg-sky-600 transition-all"><UploadCloud size={18} /> Importar Base de Datos</label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edición de Usuario (Accesible para cualquier Admin) */}
      {showEditUserModal && userToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Editar Perfil</h3>
              <button onClick={() => setShowEditUserModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nombre Completo</label>
                <input required type="text" value={userToEdit.name} onChange={e => setUserToEdit({...userToEdit, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold focus:ring-4 focus:ring-sky-500/10 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Correo Electrónico</label>
                <input required type="email" value={userToEdit.email} disabled={userToEdit.email === ROOT_ADMIN_EMAIL} onChange={e => setUserToEdit({...userToEdit, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold disabled:opacity-50 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest block ml-1">Gestionar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={18} />
                  <input type="password" value={userToEdit.password || ''} onChange={e => setUserToEdit({...userToEdit, password: e.target.value})} placeholder="Nueva contraseña" className="w-full bg-sky-50 border border-sky-100 rounded-2xl px-12 py-4 font-bold text-slate-800 placeholder:text-sky-200 focus:ring-4 focus:ring-sky-500/10 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] mt-4 shadow-xl hover:bg-slate-800 transition-all">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Administrador */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Registrar Miembro</h3>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-900"><X size={28}/></button>
            </div>
            <form onSubmit={createAdmin} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" value={newAdminData.name} onChange={e => setNewAdminData({...newAdminData, name: e.target.value})} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-bold outline-none" placeholder="Nombre completo" />
                <input required type="tel" value={newAdminData.phone} onChange={e => setNewAdminData({...newAdminData, phone: e.target.value})} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-bold outline-none" placeholder="Teléfono" />
              </div>
              <input required type="email" value={newAdminData.email} onChange={e => setNewAdminData({...newAdminData, email: e.target.value})} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-bold outline-none" placeholder="Correo electrónico" />
              <input required type="password" value={newAdminData.password} onChange={e => setNewAdminData({...newAdminData, password: e.target.value})} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-bold outline-none" placeholder="Contraseña de acceso" />
              
              <div className="bg-sky-50 p-6 rounded-3xl flex items-start gap-4 border border-sky-100 mt-4">
                <ShieldCheck className="text-sky-500 shrink-0" size={24} />
                <p className="text-[10px] font-bold text-sky-800 leading-relaxed uppercase tracking-widest">
                  Este usuario tendrá privilegios de administrador para gestionar citas, pacientes y equipo.
                </p>
              </div>

              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest mt-4 shadow-2xl hover:bg-slate-800 transition-all">Crear Administrador</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Turno */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900">Habilitar Turno</h3>
              <button onClick={() => setShowSlotModal(false)}><X size={28}/></button>
            </div>
            <form onSubmit={createSlot} className="space-y-8">
              <input required type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={todayStr} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-black text-lg outline-none" />
              <div className="grid grid-cols-2 gap-6">
                <input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold outline-none" />
                <input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold outline-none" />
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase mt-4 shadow-xl hover:opacity-90">Crear Espacio Libre</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

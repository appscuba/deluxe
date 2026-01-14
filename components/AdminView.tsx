
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
  Edit2
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
      appointments: appointments,
      treatments: treatments,
      notifications: notifications,
      availability: availability,
      patientRecords: patientRecords,
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
      alert('No se puede eliminar al Administrador Global por seguridad.');
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
    alert('Usuario actualizado con éxito (incluyendo nueva contraseña si fue modificada).');
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
    setShowAdminModal(false);
  };

  const renderDashboard = () => (
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
  );

  const renderPatients = () => {
    const filtered = allUsers.filter(u => u.role === 'client' && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (viewingPatientFile && selectedPatientId) {
      const patient = allUsers.find(u => u.id === selectedPatientId);
      const record = patientRecords.find(r => r.patientId === selectedPatientId);
      return (
        <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
          <button onClick={() => setViewingPatientFile(false)} className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 bg-white px-6 py-3 rounded-full border">
            <ChevronLeft size={18} /> Regresar
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 bg-white p-10 rounded-[3.5rem] border shadow-xl text-center group relative">
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => { setUserToEdit(patient!); setShowEditUserModal(true); }} className="p-3 bg-slate-900 text-white rounded-2xl"><Edit2 size={16} /></button>
              </div>
              <div className="w-28 h-28 bg-sky-500 text-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black mx-auto mb-6">{patient?.name.charAt(0)}</div>
              <h2 className="text-2xl font-black text-slate-900">{patient?.name}</h2>
              <p className="text-xs text-slate-400 font-bold mt-2">{patient?.phone}</p>
            </div>
            <div className="lg:col-span-3 bg-white p-12 rounded-[4rem] border shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3"><Stethoscope size={28} className="text-sky-500" /> Odontograma</h3>
              <Odontogram toothStates={record?.odontogram || []} onUpdateTooth={(id, condition) => {
                const newOdontogram = [...(record?.odontogram || [])];
                const idx = newOdontogram.findIndex(s => s.id === id);
                if (idx >= 0) newOdontogram[idx] = { ...newOdontogram[idx], condition };
                else newOdontogram.push({ id, condition });
                updatePatientOdontogram(selectedPatientId!, newOdontogram);
              }} />
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
          {filtered.map(user => (
            <div key={user.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm hover:shadow-2xl transition-all group text-center relative">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => { setUserToEdit(user); setShowEditUserModal(true); }} className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={16} /></button>
                 <button onClick={() => handleDeleteUser(user.id, user.email)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
              </div>
              <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 flex items-center justify-center font-black text-slate-400 text-2xl mx-auto mb-6">{user.name.charAt(0)}</div>
              <h4 className="text-lg font-black text-slate-800 mb-8">{user.name}</h4>
              <button onClick={() => { setSelectedPatientId(user.id); setViewingPatientFile(true); }} className="w-full py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] hover:bg-slate-900 hover:text-white transition-all">Expediente</button>
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
          <h3 className="text-3xl font-black text-slate-900">Equipo</h3>
          <button onClick={() => setShowAdminModal(true)} className="bg-sky-500 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-2xl flex items-center gap-3">
            <UserPlus size={20} /> Nuevo Admin
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {admins.map(admin => {
            const isGlobal = admin.email === ROOT_ADMIN_EMAIL;
            return (
              <div key={admin.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm text-center relative group">
                {!isGlobal && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setUserToEdit(admin); setShowEditUserModal(true); }} className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteUser(admin.id, admin.email)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                  </div>
                )}
                <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 flex items-center justify-center font-black text-slate-400 text-2xl mx-auto mb-6">{admin.name.charAt(0)}</div>
                <h4 className="text-lg font-black text-slate-800 leading-tight mb-1">{admin.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{admin.email}</p>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-block ${isGlobal ? 'bg-slate-900 text-white' : 'bg-sky-50 text-sky-600'}`}>{isGlobal ? 'Global' : 'Admin'}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-32">
      {activeTab === 'Dashboard' && renderDashboard()}
      {activeTab === 'Pacientes' && renderPatients()}
      {activeTab === 'Equipo' && renderEquipo()}
      {activeTab === 'Ajustes' && (
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-[4rem] border shadow-sm space-y-10">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Database className="text-emerald-500" size={28} /> Respaldo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={exportToXML} className="bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3"><Archive size={18} /> Exportar XML</button>
            <div className="relative">
              <input type="file" accept=".xml" onChange={importFromXML} ref={fileInputRef} className="hidden" id="xml-restore" />
              <label htmlFor="xml-restore" className="w-full flex items-center justify-center gap-3 bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] cursor-pointer"><UploadCloud size={18} /> Importar XML</label>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edición de Usuario (Para cualquier Admin) */}
      {showEditUserModal && userToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900">Editar Perfil</h3>
              <button onClick={() => setShowEditUserModal(false)} className="text-slate-400"><X size={24}/></button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre</label>
                <input required type="text" value={userToEdit.name} onChange={e => setUserToEdit({...userToEdit, name: e.target.value})} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                <input required type="email" value={userToEdit.email} disabled={userToEdit.email === ROOT_ADMIN_EMAIL} onChange={e => setUserToEdit({...userToEdit, email: e.target.value})} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold disabled:opacity-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest block mb-1">Cambiar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={18} />
                  <input type="password" value={userToEdit.password || ''} onChange={e => setUserToEdit({...userToEdit, password: e.target.value})} placeholder="Nueva contraseña" className="w-full bg-sky-50 border border-sky-100 rounded-2xl px-12 py-4 font-bold text-slate-800" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] mt-4">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {/* Otros modales (Slot, Billing, Admin) simplificados para mantener el contexto... */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-3xl font-black text-slate-900 mb-10">Habilitar Turno</h3>
            <form onSubmit={createSlot} className="space-y-8">
              <input required type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={todayStr} className="w-full bg-slate-50 border rounded-[2rem] px-8 py-5 font-black text-lg" />
              <div className="grid grid-cols-2 gap-6">
                <input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold" />
                <input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold" />
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase mt-4">Crear Espacio</button>
              <button type="button" onClick={() => setShowSlotModal(false)} className="w-full text-slate-400 font-bold uppercase text-[10px]">Cerrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

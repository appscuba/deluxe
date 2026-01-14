
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
  
  // Ajustes de Clínica
  const [tempSettings, setTempSettings] = useState<ClinicSettings>(clinicSettings);

  // Sincronizar tempSettings cuando los ajustes globales cambien (ej. carga inicial)
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

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
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

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminData.email.trim().toLowerCase();
    
    if (allUsers.some(u => u.email.toLowerCase() === email) || email === ROOT_ADMIN_EMAIL) {
      alert("Este correo electrónico ya está registrado en el sistema.");
      return;
    }

    const newUser: User = {
      id: 'adm_' + Math.random().toString(36).substr(2, 9),
      name: newAdminData.name,
      email: email,
      phone: newAdminData.phone,
      password: newAdminData.password,
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    setAllUsers(prev => [...prev, newUser]);
    setNewAdminData({ name: '', email: '', password: '', phone: '' });
    setShowAdminModal(false);
    alert("Administrador creado. Ahora puede iniciar sesión con estas credenciales.");
  };

  const saveGlobalSettings = () => {
    setClinicSettings({...tempSettings});
    alert("Configuración de la clínica guardada correctamente.");
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
      <div className="bg-sky-500 p-8 rounded-[3rem] text-white shadow-2xl shadow-sky-100">
        <Activity size={24} className="opacity-40 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Pacientes Totales</p>
        <p className="text-4xl font-black mt-1">{allUsers.filter(u => u.role === 'client').length}</p>
      </div>
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <ShieldCheck size={24} className="text-sky-500 opacity-40 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Equipo Admin</p>
        <p className="text-4xl font-black text-slate-900 mt-1">{allUsers.filter(u => u.role === 'admin').length + 1}</p>
      </div>
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl">
        <CalendarIcon size={24} className="opacity-40 mb-4 text-sky-400" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Citas en Agenda</p>
        <p className="text-4xl font-black mt-1">{appointments.length}</p>
      </div>
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <Clock size={24} className="text-amber-500 opacity-40 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hoy</p>
        <p className="text-4xl font-black text-slate-900 mt-1">{appointments.filter(a => a.date === todayStr).length}</p>
      </div>
    </div>
  );

  const renderAjustes = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-6">
      <div className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-10">
        <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4"><Building2 className="text-sky-500" size={32} /> Perfil Clínica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre Comercial</label>
            <input type="text" value={tempSettings.name} onChange={e => setTempSettings({...tempSettings, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 font-bold outline-none focus:ring-4 focus:ring-sky-500/10" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Teléfono de Atención</label>
            <input type="text" value={tempSettings.phone} onChange={e => setTempSettings({...tempSettings, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 font-bold outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Corporativo</label>
            <input type="email" value={tempSettings.email} onChange={e => setTempSettings({...tempSettings, email: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 font-bold outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Dirección Principal</label>
            <input type="text" value={tempSettings.address} onChange={e => setTempSettings({...tempSettings, address: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 font-bold outline-none" />
          </div>
        </div>
        <button onClick={saveGlobalSettings} className="bg-slate-900 text-white px-12 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all"><Save size={20} /> Guardar Ajustes</button>
      </div>

      <div className="bg-sky-50 p-12 rounded-[4rem] border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h4 className="text-xl font-black text-sky-900 mb-2">Base de Datos Local</h4>
          <p className="text-sm text-sky-700/60 font-bold max-w-md">Todos los cambios se guardan automáticamente en tu navegador. Puedes exportar un respaldo para seguridad adicional.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => {
            const data = { allUsers, appointments, clinicSettings, patientRecords };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_deluxe_dental.json`;
            a.click();
          }} className="bg-white text-sky-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] shadow-sm flex items-center gap-2"><Archive size={16}/> Exportar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-32">
      {activeTab === 'Dashboard' && renderDashboard()}
      {activeTab === 'Ajustes' && renderAjustes()}
      {activeTab === 'Equipo' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Personal Clínica</h3>
            <button onClick={() => setShowAdminModal(true)} className="bg-sky-500 text-white px-8 py-4 rounded-3xl font-black uppercase text-[10px] shadow-xl flex items-center gap-3 active:scale-95 transition-all"><UserPlus size={20}/> Nuevo Admin</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-center relative">
               <div className="w-20 h-20 bg-sky-500/20 text-sky-400 rounded-3xl flex items-center justify-center font-black text-2xl mx-auto mb-6">A</div>
               <h4 className="text-lg font-black text-white">Super Admin</h4>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{ROOT_ADMIN_EMAIL}</p>
               <div className="mt-6 px-4 py-2 bg-sky-500 text-white rounded-2xl text-[9px] font-black uppercase">Acceso Maestro</div>
             </div>

             {allUsers.filter(u => u.role === 'admin').map(admin => (
               <div key={admin.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center group hover:shadow-xl transition-all">
                 <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center font-black text-2xl mx-auto mb-6 group-hover:bg-sky-50 group-hover:text-sky-500 transition-all">{admin.name.charAt(0)}</div>
                 <h4 className="text-lg font-black text-slate-800">{admin.name}</h4>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{admin.email}</p>
                 <button onClick={() => { if(confirm('¿Eliminar admin?')) setAllUsers(prev => prev.filter(u => u.id !== admin.id)) }} className="mt-6 p-3 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* MODAL CREAR ADMIN */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-3xl font-black text-slate-900 mb-10">Alta de Administrador</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-6">
              <input required type="text" placeholder="Nombre completo" value={newAdminData.name} onChange={e => setNewAdminData({...newAdminData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 font-bold outline-none" />
              <input required type="email" placeholder="Correo electrónico" value={newAdminData.email} onChange={e => setNewAdminData({...newAdminData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 font-bold outline-none" />
              <input required type="tel" placeholder="Teléfono" value={newAdminData.phone} onChange={e => setNewAdminData({...newAdminData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 font-bold outline-none" />
              <input required type="password" placeholder="Contraseña de acceso" value={newAdminData.password} onChange={e => setNewAdminData({...newAdminData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 font-bold outline-none" />
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Habilitar Cuenta</button>
              <button type="button" onClick={() => setShowAdminModal(false)} className="w-full text-slate-300 font-black uppercase text-[10px] mt-2">Cerrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Appointment, UrgencyLevel } from '../types';
import { canPatientManageAppointment } from '../utils/helpers';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Check,
  XCircle,
  CheckCircle2,
  Trash2,
  Info
} from 'lucide-react';

const SYMPTOMS = [
  { id: 'pain', label: 'Dolor Agudo', icon: '⚡' },
  { id: 'sensitivity', label: 'Sensibilidad', icon: '❄️' },
  { id: 'broken', label: 'Diente Roto', icon: '🦷' },
  { id: 'checkup', label: 'Revisión General', icon: '🔍' },
];

export const ClientView: React.FC = () => {
  const { currentUser, appointments, setAppointments, addNotification } = useAppContext();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showBooking, setShowBooking] = useState(false);
  
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<UrgencyLevel>('low');
  const [reason, setReason] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const clientApps = appointments.filter(a => a.clientId === currentUser?.id);
  const upcomingApps = clientApps.filter(a => ['pending', 'approved'].includes(a.status));

  const availableSlots = useMemo(() => {
    return appointments.filter(a => a.status === 'available' && a.date >= todayStr)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [appointments, todayStr]);

  const handleBook = () => {
    if (!currentUser || !selectedSlotId) return;
    
    setAppointments(prev => prev.map(app => {
      if (app.id === selectedSlotId) {
        return {
          ...app,
          clientId: currentUser.id,
          clientName: currentUser.name,
          status: 'pending',
          urgency,
          reason,
          symptoms: selectedSymptoms,
        };
      }
      return app;
    }));

    addNotification(currentUser.id, "Solicitud Enviada", "Hemos recibido tu solicitud de cita.", "status_change");
    addNotification('admin_root', "Nueva Cita Solicitada", `${currentUser.name} ha solicitado un turno.`, "status_change");

    setShowBooking(false);
    setStep(1); setSelectedSymptoms([]); setSelectedSlotId(null);
  };

  const handleCancelAppointment = (app: Appointment) => {
    if (!canPatientManageAppointment(app.date, app.startTime)) {
      alert("Lo sentimos, no puedes cancelar con menos de 48 horas de antelación por este medio. Llámanos para asistencia.");
      return;
    }

    if (confirm("¿Seguro que deseas cancelar tu cita?")) {
      setAppointments(prev => prev.map(a => a.id === app.id ? { ...a, status: 'available', clientId: undefined, clientName: undefined } : a));
      addNotification(currentUser!.id, "Cita Cancelada", "Tu cita ha sido liberada.", "status_change");
      addNotification('admin_root', "Cita Cancelada por Paciente", `${currentUser?.name} canceló su cita del ${app.date}.`, "status_change");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Hola, {currentUser?.name.split(' ')[0]}</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Gestiona tu salud dental</p>
        </div>
        <button onClick={() => setShowBooking(true)} className="bg-sky-500 text-white px-10 py-5 rounded-[2.5rem] shadow-xl font-black uppercase text-xs flex items-center gap-3"><Plus size={20} /> Agendar Turno</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3"><CalendarIcon size={20} className="text-sky-500" /> Mis Citas</h3>
            {upcomingApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingApps.map(app => {
                  const isLocked = !canPatientManageAppointment(app.date, app.startTime);
                  return (
                    <div key={app.id} className="bg-white p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-2 h-full ${app.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{app.date}</p>
                      <h4 className="font-black text-slate-800 text-lg mb-4">{app.startTime} - {app.endTime}</h4>
                      <div className="flex justify-between items-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{app.status === 'approved' ? 'Confirmada' : 'En espera'}</span>
                        {!isLocked && (
                          <button onClick={() => handleCancelAppointment(app)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                        )}
                      </div>
                      {isLocked && <div className="mt-4 text-[8px] font-black text-rose-500 uppercase flex items-center gap-2 bg-rose-50 p-2 rounded-xl"><Clock size={12} /> Bloqueado (Regla 48h)</div>}
                    </div>
                  );
                })}
              </div>
            ) : <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center text-slate-300 font-black uppercase text-[10px]">Sin citas próximas</div>}
          </section>

          <section className="bg-sky-50 p-8 rounded-[2.5rem] border border-sky-100 flex gap-6 items-start">
            <div className="bg-white p-3 rounded-2xl text-sky-500 shadow-sm"><Info size={24}/></div>
            <div>
              <h4 className="font-black text-sky-900 uppercase text-[10px] tracking-widest mb-2">Recordatorio</h4>
              <p className="text-xs text-sky-700/70 font-bold leading-relaxed">Los cambios o cancelaciones deben realizarse con **48 horas** de antelación para permitir que otros pacientes usen el espacio.</p>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm"><h3 className="font-black text-slate-800 mb-6 flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-500" /> Garantía Deluxe</h3><p className="text-xs text-slate-400 font-medium">Cada cita es una prioridad para nosotros. Contamos con tecnología de vanguardia para tu sonrisa.</p></div>
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm"><h3 className="font-black text-slate-800 mb-4 flex items-center gap-3"><AlertCircle size={20} className="text-sky-500" /> Tu Perfil</h3><p className="text-xs font-bold text-slate-500">{currentUser?.email}</p></div>
        </div>
      </div>

      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Configura tu Cita</h3>
              <button onClick={() => setShowBooking(false)} className="text-slate-400"><XCircle size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              {step === 1 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SYMPTOMS.map(s => (
                    <button key={s.id} onClick={() => setSelectedSymptoms(prev => prev.includes(s.label) ? prev.filter(x => x !== s.label) : [...prev, s.label])} className={`p-4 rounded-[1.8rem] border text-center transition-all ${selectedSymptoms.includes(s.label) ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <div className="text-[9px] font-black uppercase">{s.label}</div>
                    </button>
                  ))}
                </div>
              )}
              {step === 2 && (
                <div className="space-y-3">
                  {availableSlots.map(slot => (
                    <button key={slot.id} onClick={() => setSelectedSlotId(slot.id)} className={`w-full p-6 rounded-[2rem] border flex justify-between transition-all ${selectedSlotId === slot.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-transparent'}`}>
                      <div className="text-left"><p className="text-[10px] font-black uppercase opacity-60">{slot.date}</p><p className="text-lg font-black">{slot.startTime}</p></div>
                      {selectedSlotId === slot.id && <Check size={24} className="text-sky-400" />}
                    </button>
                  ))}
                </div>
              )}
              {step === 3 && (
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="¿Algo que debamos saber?" className="w-full px-8 py-6 rounded-[2rem] border focus:outline-none min-h-[150px] font-bold text-slate-800" />
              )}
            </div>
            <div className="px-10 py-8 border-t border-slate-100 flex justify-between items-center">
              <button disabled={step === 1} onClick={() => setStep(prev => (prev - 1) as any)} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 disabled:opacity-0">Atrás</button>
              {step < 3 ? (
                <button onClick={() => setStep(prev => (prev + 1) as any)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px]">Siguiente</button>
              ) : (
                <button onClick={handleBook} className="bg-sky-500 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl">Confirmar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

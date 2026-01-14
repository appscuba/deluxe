
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Appointment, UrgencyLevel } from '../types';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Check,
  XCircle,
  Stethoscope,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';

const SYMPTOMS = [
  { id: 'pain', label: 'Dolor Agudo', icon: '⚡' },
  { id: 'sensitivity', label: 'Sensibilidad', icon: '❄️' },
  { id: 'bleeding', label: 'Sangrado', icon: '🩸' },
  { id: 'broken', label: 'Diente Roto', icon: '🦷' },
  { id: 'checkup', label: 'Revisión General', icon: '🔍' },
];

const IMPROVEMENTS = [
  { id: 'whitening', label: 'Dientes más blancos', icon: '✨' },
  { id: 'alignment', label: 'Mejor alineación', icon: '📏' },
  { id: 'breath', label: 'Mejor aliento', icon: '🍃' },
  { id: 'strength', label: 'Mayor fuerza', icon: '💪' },
];

export const ClientView: React.FC = () => {
  const { currentUser, appointments, treatments, setAppointments, addNotification } = useAppContext();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showBooking, setShowBooking] = useState(false);
  
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<UrgencyLevel>('low');
  const [reason, setReason] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Available slots created by admin
  const availableSlots = useMemo(() => {
    return appointments.filter(a => a.status === 'available' && a.date >= todayStr)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [appointments, todayStr]);

  const clientApps = appointments.filter(a => a.clientId === currentUser?.id);
  const upcomingApps = clientApps.filter(a => ['pending', 'approved'].includes(a.status));

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleImprovement = (id: string) => {
    setSelectedImprovements(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

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
          improvements: selectedImprovements,
        };
      }
      return app;
    }));

    addNotification(currentUser.id, "Cita Solicitada", "Tu solicitud está siendo revisada por el equipo médico.", "status_change");
    setShowBooking(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1); setSelectedSymptoms([]); setSelectedImprovements([]); setSelectedSlotId(null); setReason(''); setUrgency('low');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Bienvenido, {currentUser?.name.split(' ')[0]}</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Personaliza tu experiencia dental</p>
        </div>
        <button 
          onClick={() => setShowBooking(true)}
          className="flex items-center justify-center space-x-3 bg-sky-500 hover:bg-sky-600 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl shadow-sky-200 transition-all font-black uppercase text-xs tracking-widest active:scale-95"
        >
          <Plus size={20} />
          <span>Agendar Consulta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
              <CalendarIcon size={20} className="text-sky-500" /> Mis Citas Próximas
            </h3>
            {upcomingApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingApps.map(app => (
                  <div key={app.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-100 transition-all">
                    <div className={`absolute top-0 right-0 w-2 h-full ${app.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{app.date}</p>
                        <h4 className="font-black text-slate-800 text-lg">{app.startTime} - {app.endTime}</h4>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {app.status === 'approved' ? 'Confirmada' : 'En espera'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {app.symptoms?.map(s => (
                        <span key={s} className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-bold uppercase">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center space-y-5">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200"><CalendarIcon size={40} /></div>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">¿Listo para mejorar tu sonrisa?</p>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-800 mb-6">Tratamientos Populares</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {treatments.slice(0, 4).map(t => (
                <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center group">
                  <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Sparkles size={20} /></div>
                  <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{t.name}</h4>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-500" /> Garantía Deluxe
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">En Deluxe Dental Care, cada cita es personalizada. Nuestros expertos evaluarán tu caso y te darán la mejor opción clínica basada en tus síntomas y objetivos.</p>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-sky-500" /> Tu Perfil
            </h3>
            <div className="space-y-2 text-xs font-bold text-slate-500">
              <p>Email: {currentUser?.email}</p>
              <p>Teléfono: {currentUser?.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Configura tu Cita</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Paso {step} de 3</p>
              </div>
              <button onClick={() => setShowBooking(false)} className="text-slate-400 hover:text-slate-600 p-2"><XCircle size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 hide-scrollbar">
              {step === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">¿Qué síntomas tienes?</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SYMPTOMS.map(s => (
                        <button key={s.id} onClick={() => toggleSymptom(s.label)} className={`p-4 rounded-[1.8rem] border text-center transition-all ${selectedSymptoms.includes(s.label) ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-100' : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'}`}>
                          <div className="text-2xl mb-2">{s.icon}</div>
                          <div className="text-[9px] font-black uppercase tracking-widest">{s.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">¿Qué te gustaría mejorar?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {IMPROVEMENTS.map(i => (
                        <button key={i.id} onClick={() => toggleImprovement(i.label)} className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all ${selectedImprovements.includes(i.label) ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100' : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'}`}>
                          <div className="text-xl">{i.icon}</div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-left">{i.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Elige un horario disponible</label>
                  <div className="grid grid-cols-1 gap-3">
                    {availableSlots.length > 0 ? availableSlots.map(slot => (
                      <button key={slot.id} onClick={() => setSelectedSlotId(slot.id)} className={`w-full p-6 rounded-[2rem] border flex items-center justify-between transition-all ${selectedSlotId === slot.id ? 'bg-slate-900 text-white border-slate-900 shadow-2xl' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div className="flex items-center space-x-6">
                          <div className={`p-3 rounded-2xl ${selectedSlotId === slot.id ? 'bg-white/10' : 'bg-white shadow-sm'}`}><CalendarIcon size={20} className={selectedSlotId === slot.id ? 'text-sky-400' : 'text-sky-500'} /></div>
                          <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{slot.date}</p>
                            <p className="text-lg font-black">{slot.startTime} - {slot.endTime}</p>
                          </div>
                        </div>
                        <Check size={24} className={selectedSlotId === slot.id ? 'text-sky-400' : 'text-slate-200'} />
                      </button>
                    )) : (
                      <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400">No hay turnos disponibles creados por administración</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas adicionales o urgencia</label>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {(['low', 'medium', 'high'] as UrgencyLevel[]).map(lvl => (
                        <button key={lvl} onClick={() => setUrgency(lvl)} className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${urgency === lvl ? 'bg-rose-500 text-white border-rose-500 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent'}`}>{lvl === 'low' ? 'Baja' : lvl === 'medium' ? 'Media' : 'Alta'}</button>
                      ))}
                    </div>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="¿Algún detalle que debamos saber antes de tu llegada?" className="w-full px-8 py-6 rounded-[2rem] border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-500/10 min-h-[150px] font-bold text-slate-800" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button disabled={step === 1} onClick={() => setStep(prev => prev - 1 as any)} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 disabled:opacity-0">Anterior</button>
              {step < 3 ? (
                <button disabled={(step === 1 && selectedSymptoms.length === 0) || (step === 2 && !selectedSlotId)} onClick={() => setStep(prev => prev + 1 as any)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2">Continuar <ChevronRight size={16} /></button>
              ) : (
                <button onClick={handleBook} className="bg-sky-500 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-sky-200">Confirmar Cita</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

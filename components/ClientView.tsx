
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Treatment, Appointment, UrgencyLevel } from '../types';
import { generateAvailableSlots, addMinutes } from '../utils/helpers';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  MessageSquare, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Check,
  // Fix: Added missing XCircle icon import
  XCircle
} from 'lucide-react';
import { getDentalAdvice } from '../services/geminiService';

export const ClientView: React.FC = () => {
  const { currentUser, appointments, treatments, setAppointments, addNotification, availability } = useAppContext();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showBooking, setShowBooking] = useState(false);
  
  // Form State
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('low');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  // AI State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const clientAppointments = appointments.filter(a => a.clientId === currentUser?.id);
  const upcomingAppointments = clientAppointments.filter(a => a.status === 'approved' || a.status === 'pending');

  const availableSlots = selectedTreatment && selectedDate 
    ? generateAvailableSlots(selectedDate, selectedTreatment, availability, appointments)
    : [];

  const handleBook = () => {
    if (!currentUser || !selectedTreatment || !selectedDate || !selectedTime) return;

    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: currentUser.id,
      clientName: currentUser.name,
      treatmentId: selectedTreatment.id,
      date: selectedDate,
      startTime: selectedTime,
      endTime: addMinutes(selectedTime, selectedTreatment.durationMinutes),
      status: 'pending',
      urgency,
      reason,
      notes,
      createdAt: new Date().toISOString(),
    };

    setAppointments(prev => [newAppointment, ...prev]);
    addNotification(currentUser.id, "Cita Solicitada", "Tu cita está pendiente de aprobación por la administración.", "status_change");
    
    // Reset and Close
    setShowBooking(false);
    setStep(1);
    setSelectedTreatment(null);
    setSelectedDate('');
    setSelectedTime('');
    setReason('');
    setNotes('');
  };

  const askGemini = async () => {
    if (!aiQuestion) return;
    setLoadingAi(true);
    const response = await getDentalAdvice(aiQuestion);
    setAiResponse(response || '');
    setLoadingAi(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Hola, {currentUser?.name.split(' ')[0]} 👋</h2>
          <p className="text-slate-500 mt-1">¿Cómo podemos ayudarte hoy con tu sonrisa?</p>
        </div>
        <button 
          onClick={() => setShowBooking(true)}
          className="flex items-center justify-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-sky-100 transition-all font-bold text-lg"
        >
          <Plus size={24} />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Appointments & History */}
        <div className="lg:col-span-2 space-y-8">
          
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarIcon size={20} className="text-sky-500" />
              Tus Próximas Citas
            </h3>
            {upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppointments.map(app => {
                  const treatment = treatments.find(t => t.id === app.treatmentId);
                  return (
                    <div key={app.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-1 h-full ${app.status === 'approved' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                          app.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {app.status === 'approved' ? 'Confirmada' : 'Pendiente'}
                        </span>
                        <p className="text-xs text-slate-400 font-medium">{app.date}</p>
                      </div>
                      <h4 className="font-bold text-slate-800 truncate">{treatment?.name}</h4>
                      <div className="flex items-center space-x-2 text-slate-500 mt-2">
                        <Clock size={14} />
                        <span className="text-sm">{app.startTime} ({treatment?.durationMinutes} min)</span>
                      </div>
                      <div className="mt-6 flex gap-2">
                        <button className="flex-1 text-xs font-bold py-2 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 transition-colors">Ver Detalles</button>
                        {app.status === 'pending' && <button className="flex-1 text-xs font-bold py-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Cancelar</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <CalendarIcon size={32} />
                </div>
                <p className="text-slate-400 font-medium">No tienes citas agendadas aún.</p>
                <button onClick={() => setShowBooking(true)} className="text-sky-500 font-bold hover:underline">Empieza aquí</button>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Servicios Disponibles</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {treatments.map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all group cursor-pointer" onClick={() => { setShowBooking(true); setSelectedTreatment(t); setStep(2); }}>
                  <div className="w-10 h-10 bg-slate-50 group-hover:bg-sky-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 mb-4 transition-colors">
                    <Sparkles size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{t.name}</h4>
                  <p className="text-xs text-slate-400 mb-2 truncate">{t.description}</p>
                  <p className="text-sky-500 font-bold text-sm">${t.price}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: AI Assistant & Promotion */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-sky-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Plus size={100} />
            </div>
            <h3 className="text-xl font-bold mb-2">Asistente Dental IA</h3>
            <p className="text-sky-100 text-sm mb-6 leading-relaxed">¿Dudas sobre un tratamiento o dolor? Nuestra IA te ayuda mientras esperas.</p>
            
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="¿Cómo cuido mi ortodoncia?" 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white/20 placeholder:text-sky-200"
                />
                <button 
                  onClick={askGemini}
                  disabled={loadingAi}
                  className="absolute right-2 top-2 p-1.5 bg-white text-sky-600 rounded-lg shadow-lg disabled:opacity-50"
                >
                  {loadingAi ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-600 border-t-transparent" /> : <ArrowRight size={18} />}
                </button>
              </div>
              
              {aiResponse && (
                <div className="bg-white/10 rounded-xl p-4 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2">
                  <p>{aiResponse}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              Información Importante
            </h3>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="flex gap-2">
                <Check size={16} className="text-green-500 shrink-0" />
                <span>Las cancelaciones deben hacerse 24h antes.</span>
              </li>
              <li className="flex gap-2">
                <Check size={16} className="text-green-500 shrink-0" />
                <span>Favor de llegar 10 minutos antes de su cita.</span>
              </li>
              <li className="flex gap-2">
                <Check size={16} className="text-green-500 shrink-0" />
                <span>Estacionamiento gratuito para pacientes.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Booking Modal / Stepper */}
      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Agendar Cita</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase ml-2 tracking-wider">Paso {step} de 3</span>
                </div>
              </div>
              <button onClick={() => setShowBooking(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
              
              {/* Step 1: Form & Urgency */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">¿Cuál es el motivo de tu consulta?</label>
                    <textarea 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ej: Dolor en molar superior derecho..." 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Nivel de Urgencia</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['low', 'medium', 'high'] as UrgencyLevel[]).map(lvl => (
                        <button 
                          key={lvl}
                          onClick={() => setUrgency(lvl)}
                          className={`py-3 rounded-xl text-xs font-bold uppercase transition-all border ${
                            urgency === lvl 
                              ? lvl === 'high' ? 'bg-red-50 text-red-600 border-red-200 ring-2 ring-red-500/10' :
                                lvl === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200 ring-2 ring-amber-500/10' :
                                'bg-sky-50 text-sky-600 border-sky-200 ring-2 ring-sky-500/10'
                              : 'bg-slate-50 text-slate-400 border-transparent'
                          }`}
                        >
                          {lvl === 'low' ? 'General' : lvl === 'medium' ? 'Importante' : 'Urgente'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Notas Adicionales (Opcional)</label>
                    <input 
                      type="text" 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Alergias, medicamentos, etc." 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Select Treatment */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <h4 className="text-sm font-bold text-slate-700">Selecciona el tratamiento deseado</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {treatments.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTreatment(t)}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          selectedTreatment?.id === t.id ? 'border-sky-500 bg-sky-50 shadow-md ring-2 ring-sky-500/10' : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-800">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.durationMinutes} minutos de duración</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sky-600">${t.price}</p>
                          {selectedTreatment?.id === t.id && <Check size={18} className="ml-auto mt-1 text-sky-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Calendar & Time Slots */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-slate-700">Selecciona el día</label>
                      <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                      <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                        <p className="text-xs text-sky-700 font-medium">Atendemos de Lunes a Viernes, de 09:00 a 18:00.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-slate-700">Horarios Disponibles</label>
                      {!selectedDate ? (
                        <div className="text-center py-10 text-slate-400 italic text-sm">Selecciona una fecha primero</div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                          {availableSlots.map(time => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                                selectedTime === time 
                                  ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-100' 
                                  : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-red-400 text-sm font-medium">No hay horarios disponibles para este día. Intenta con otra fecha.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button 
                disabled={step === 1}
                onClick={() => setStep(prev => (prev - 1) as any)}
                className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
              >
                Atrás
              </button>
              
              {step < 3 ? (
                <button 
                  disabled={(step === 1 && !reason) || (step === 2 && !selectedTreatment)}
                  onClick={() => setStep(prev => (prev + 1) as any)}
                  className="bg-slate-800 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  Continuar
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  disabled={!selectedDate || !selectedTime}
                  onClick={handleBook}
                  className="bg-sky-500 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-sky-200 hover:bg-sky-600 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  Confirmar Cita
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

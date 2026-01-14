
import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { ClientView } from './components/ClientView';
import { AdminView } from './components/AdminView';
import { PlusCircle, User as UserIcon, Lock, Mail, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { User } from './types';

const AuthScreen: React.FC = () => {
  const { setCurrentUser, allUsers, setAllUsers } = useAppContext();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const ROOT_EMAIL = 'appscuba@gmail.com';
    const ROOT_PASS = 'Asd9310*';

    const normalizedEmail = formData.email.trim().toLowerCase();

    if (authMode === 'login') {
      // 1. Validar Super Admin
      if (normalizedEmail === ROOT_EMAIL && formData.password === ROOT_PASS) {
        setCurrentUser({
          id: 'admin_root',
          name: 'Super Admin',
          email: ROOT_EMAIL,
          phone: '000000000',
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        return;
      }

      // 2. Validar contra la Base de Datos Local (allUsers)
      // Buscamos directamente en el estado que ya está sincronizado con localStorage
      const userFound = allUsers.find(u => 
        u.email.toLowerCase() === normalizedEmail && 
        u.password === formData.password
      );

      if (userFound) {
        setCurrentUser(userFound);
        return;
      }

      setError('Credenciales incorrectas. Si te acabas de registrar, verifica tus datos.');
    } else {
      // REGISTRO
      if (allUsers.some(u => u.email.toLowerCase() === normalizedEmail) || normalizedEmail === ROOT_EMAIL) {
        setError('Este correo ya está en uso.');
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: normalizedEmail,
        phone: formData.phone,
        password: formData.password,
        role: 'client',
        createdAt: new Date().toISOString()
      };
      
      // Actualizamos estado (el useEffect en AppContext se encarga de guardar en localStorage)
      setAllUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-500 text-white rounded-[2.5rem] shadow-2xl shadow-sky-200 mb-2 transform rotate-3">
            <PlusCircle size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Deluxe Dental</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Sistema de Gestión Pro</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl mb-8 border border-slate-200/50">
            <button 
              onClick={() => { setAuthMode('login'); setError(''); }}
              className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setError(''); }}
              className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              Nuevo Paciente
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" placeholder="Nombre completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 font-bold focus:outline-none focus:border-sky-500" />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input required type="email" placeholder="Correo electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 font-bold focus:outline-none focus:border-sky-500" />
            </div>

            {authMode === 'register' && (
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="tel" placeholder="WhatsApp / Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 font-bold focus:outline-none focus:border-sky-500" />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input required type="password" placeholder="Contraseña" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 font-bold focus:outline-none focus:border-sky-500" />
            </div>

            <button type="submit" className="w-full py-5 rounded-[1.8rem] font-black bg-sky-500 text-white shadow-xl shadow-sky-100 hover:bg-sky-600 transition-all flex items-center justify-center gap-3 mt-6">
              {authMode === 'register' ? 'Crear mi cuenta' : 'Acceder al sistema'}
              <ArrowRight size={20} />
            </button>
          </form>

          <p className="mt-8 text-center text-[9px] text-slate-300 font-black uppercase tracking-widest">
            Deluxe Dental Care © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { currentUser } = useAppContext();
  return currentUser ? (
    <Layout>
      {currentUser.role === 'admin' ? <AdminView /> : <ClientView />}
    </Layout>
  ) : <AuthScreen />;
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

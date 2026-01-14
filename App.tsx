
import React, { useState } from 'react';
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
    
    const DEFAULT_ADMIN_EMAIL = 'appscuba@gmail.com';
    const DEFAULT_ADMIN_PASS = 'Asd9310*';

    if (authMode === 'login') {
      // Root Admin Login
      if (formData.email === DEFAULT_ADMIN_EMAIL && formData.password === DEFAULT_ADMIN_PASS) {
        setCurrentUser({
          id: 'admin_root',
          name: 'Admin Principal',
          email: formData.email,
          phone: '000000000',
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        return;
      }

      // Dynamic User Login (Clients or other Admins)
      const existingUser = allUsers.find(u => u.email === formData.email);
      if (existingUser) {
        // Nota: En una app real validaríamos el password aquí
        setCurrentUser(existingUser);
        return;
      }

      setError('Usuario no encontrado o credenciales incorrectas.');
    } else {
      // Registration logic
      const emailExists = allUsers.some(u => u.email === formData.email) || formData.email === DEFAULT_ADMIN_EMAIL;
      if (emailExists) {
        setError('Este correo ya está registrado.');
        return;
      }

      if (!formData.phone || formData.phone.length < 7) {
        setError('Por favor, ingresa un número de teléfono válido.');
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'client',
        createdAt: new Date().toISOString()
      };
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
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Deluxe Dental</h1>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-2">Professional Care</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl mb-8 border border-slate-200/50 overflow-hidden">
            <button 
              onClick={() => { setAuthMode('login'); setError(''); }}
              className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              Acceso
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setError(''); }}
              className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              Registro
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {authMode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-slate-800"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-slate-800"
                />
              </div>
            </div>

            {authMode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono (Obligatorio)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+54 9 11 0000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-slate-800"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-slate-800"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 rounded-[1.8rem] font-black shadow-2xl transition-all flex items-center justify-center gap-3 mt-8 active:scale-95 bg-sky-500 text-white shadow-sky-200 hover:bg-sky-600"
            >
              {authMode === 'register' ? 'Registrarme ahora' : 'Iniciar Sesión'}
              <ArrowRight size={20} />
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            Care for your smile © 2026
          </p>
        </div>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { currentUser } = useAppContext();
  if (!currentUser) return <AuthScreen />;
  return (
    <Layout>
      {currentUser.role === 'admin' ? <AdminView /> : <ClientView />}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

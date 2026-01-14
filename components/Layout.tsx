
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Calendar, 
  LayoutDashboard, 
  Settings, 
  Users, 
  LogOut, 
  Bell, 
  PlusCircle,
  Menu,
  X,
  User as UserIcon,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser, notifications, setNotifications, activeTab, setActiveTab } = useAppContext();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const isAdmin = currentUser.role === 'admin';
  const myNotifications = notifications.filter(n => n.userId === currentUser.id || (isAdmin && n.userId === 'admin_root'));
  const unreadCount = myNotifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => 
      (n.userId === currentUser.id || (isAdmin && n.userId === 'admin_root')) ? { ...n, read: true } : n
    ));
  };

  const NavItem = ({ icon: Icon, label }: any) => {
    const isActive = activeTab === label;
    return (
      <button 
        onClick={() => {
          setActiveTab(label);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 ${
          isActive ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-sky-400' : ''} />
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] w-[80%] max-w-[300px] bg-white transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0 lg:w-72
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-3">
              <div className="bg-sky-500 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-100">
                <PlusCircle size={24} />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter">Deluxe</h1>
            </div>
            <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {isAdmin ? (
              <>
                <NavItem icon={LayoutDashboard} label="Dashboard" />
                <NavItem icon={Calendar} label="Calendario" />
                <NavItem icon={BarChart3} label="Analíticas" />
                <NavItem icon={Users} label="Pacientes" />
                <NavItem icon={ShieldCheck} label="Equipo" />
                <NavItem icon={Settings} label="Ajustes" />
              </>
            ) : (
              <>
                <NavItem icon={LayoutDashboard} label="Inicio" />
                <NavItem icon={Calendar} label="Mis Reservas" />
                <NavItem icon={UserIcon} label="Mi Perfil" />
                <NavItem icon={Settings} label="Ajustes" />
              </>
            )}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-50">
            <button 
              onClick={() => setCurrentUser(null)}
              className="w-full flex items-center space-x-3 px-5 py-4 text-slate-400 hover:text-rose-500 transition-all rounded-2xl hover:bg-rose-50"
            >
              <LogOut size={20} />
              <span className="font-bold text-sm">Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-50 flex items-center justify-between px-6 shrink-0 z-40">
          <button 
            className="lg:hidden p-3 bg-slate-50 text-slate-900 rounded-2xl hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 flex justify-end items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => {
                  setNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) markAllAsRead();
                }}
                className={`relative p-3 rounded-2xl transition-colors ${isNotifOpen ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Center Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-[110] animate-in slide-in-from-top-4 duration-300">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notificaciones</h4>
                    <button onClick={() => setNotifOpen(false)} className="text-slate-300 hover:text-slate-900"><X size={16}/></button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto hide-scrollbar p-2">
                    {myNotifications.length > 0 ? (
                      myNotifications.map(n => (
                        <div key={n.id} className={`p-4 rounded-2xl mb-1 transition-colors ${n.read ? 'opacity-60' : 'bg-sky-50/50'}`}>
                          <div className="flex gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'status_change' ? 'bg-sky-500' : 'bg-amber-500'}`}></div>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 leading-tight">{n.title}</p>
                              <p className="text-[10px] text-slate-500 mt-1 font-medium">{n.message}</p>
                              <p className="text-[8px] text-slate-300 font-bold uppercase mt-2">{new Date(n.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-300">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Bandeja vacía</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 bg-slate-50 p-1.5 pr-4 rounded-[1.5rem] border border-slate-100">
               <div className="w-10 h-10 bg-sky-500 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-sky-100">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-black text-slate-900 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{isAdmin ? 'Admin' : 'Paciente'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-10 hide-scrollbar bg-slate-50/50">
          {children}
        </div>
      </main>
    </div>
  );
};

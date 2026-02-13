
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, User as UserIcon, Calendar, Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { User, UserRole, AppNotification } from '../types';
import { MENU_ITEMS, ROLE_LABELS } from '../constants';
import { supabase } from '../services/supabaseMock';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const location = useLocation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const loadNotifications = async () => {
      const data = await supabase.getNotifications(user.id);
      setNotifications(data);
    };

    loadNotifications();
    const unsubscribe = supabase.subscribe(loadNotifications);
    return unsubscribe;
  }, [user.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await supabase.markNotificationAsRead(id);
  };

  const filteredMenu = MENU_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">N</div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Sistema Gestion</h1>
              <p className="text-xs text-slate-400">Tamer Industrial S.A.</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
        {/* Header */}
        <header className="h-16 bg-slate-800/50 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 text-slate-400">
            <Calendar size={18} />
            <span className="text-sm capitalize">{today}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] font-bold flex items-center justify-center rounded-full text-white ring-2 ring-slate-800">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h4 className="font-bold text-sm">Notificaciones</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center text-slate-600 italic text-sm">No hay alertas</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-4 border-b border-slate-700 flex gap-3 transition-colors ${n.isRead ? 'opacity-60' : 'bg-blue-600/5'}`}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <div className={`mt-1 p-2 rounded-lg ${
                            n.type === 'success' ? 'bg-green-500/20 text-green-500' :
                            n.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                            n.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                          }`}>
                            {n.type === 'success' ? <CheckCircle2 size={16} /> : 
                             n.type === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                          </div>
                          <div className="flex-1">
                            <h5 className="text-xs font-bold text-slate-200">{n.title}</h5>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-600 mt-2 block">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!n.isRead && <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 bg-slate-900/30 border-t border-slate-700 text-center">
                      <button className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 w-full">
                        <CheckCheck size={14} /> Marcar todo como leído
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold">{user.fullName}</p>
              <p className="text-xs text-blue-400 font-medium">{ROLE_LABELS[user.role]}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-600">
              <UserIcon size={20} />
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

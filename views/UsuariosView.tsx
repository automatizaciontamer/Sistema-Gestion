
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseMock';
import { User, UserRole } from '../types';
import { UserPlus, Edit2, Trash2, Shield, Power, Loader2, X, Check, Lock, User as UserIcon, RefreshCw, Search } from 'lucide-react';

const UsuariosView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await supabase.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingUser?.username || !editingUser?.fullName || (!editingUser.id && !editingUser.password)) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    await supabase.saveUser(editingUser as any);
    setShowModal(false);
    loadUsers();
  };

  const toggleStatus = async (u: User) => {
    await supabase.saveUser({ ...u, isActive: !u.isActive });
    loadUsers();
  };

  const performDelete = async (id: string) => {
    if (!id || deletingId) return;
    setDeletingId(id);
    try {
      await supabase.deleteUser(id);
      setConfirmingId(null);
      await loadUsers();
    } catch (err) {
      alert("Error al eliminar el usuario");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && users.length === 0) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight">GESTIÓN DE USUARIOS</h2>
          <p className="text-slate-400">Administración de perfiles y seguridad del sistema NexoSync</p>
        </div>
        <div className="flex gap-4">
          <button onClick={loadUsers} className="p-3 text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => { setEditingUser({ role: UserRole.PROYECTO, isActive: true, needsPasswordChange: true }); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-blue-600/20 font-bold transition-all active:scale-95"
          >
            <UserPlus size={20} /> Registrar Usuario
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, usuario o rol..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsers.map(u => (
          <div key={u.id} className={`bg-slate-800 border rounded-3xl p-6 transition-all hover:shadow-2xl hover:border-slate-500 flex flex-col ${u.isActive ? 'border-slate-700' : 'border-red-900/50 grayscale opacity-60'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-500 text-xl font-black">
                {u.fullName.charAt(0)}
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                u.role === UserRole.ADMIN ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}>
                {u.role}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-0.5">{u.fullName}</h3>
            <p className="text-slate-500 text-sm font-mono mb-8">@{u.username}</p>
            
            <div className="mt-auto flex gap-2 relative">
              <button 
                onClick={() => { setEditingUser(u); setShowModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-all text-slate-300"
              >
                <Edit2 size={14} /> Editar
              </button>
              <button 
                onClick={() => toggleStatus(u)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  u.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-600 hover:text-white'
                }`}
              >
                <Power size={14} /> {u.isActive ? 'Baja' : 'Alta'}
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setConfirmingId(u.id)} 
                  disabled={deletingId === u.id}
                  className="p-2.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  {deletingId === u.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
                
                {confirmingId === u.id && (
                  <div className="absolute bottom-full right-0 mb-2 bg-slate-900 border border-red-500/50 p-2 rounded-xl shadow-2xl flex items-center gap-2 z-20 animate-in zoom-in-95">
                    <p className="text-[9px] text-white font-black uppercase px-2 whitespace-nowrap">¿Confirmar?</p>
                    <button 
                      onClick={() => performDelete(u.id)} 
                      className="bg-red-600 p-1 rounded-lg text-white hover:bg-red-500"
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => setConfirmingId(null)} 
                      className="bg-slate-700 p-1 rounded-lg text-white hover:bg-slate-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
              <h3 className="text-xl font-bold">{editingUser?.id ? 'Editar Perfil' : 'Nuevo Usuario'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-slate-600" size={18} />
                    <input 
                      type="text" 
                      value={editingUser?.fullName || ''}
                      onChange={e => setEditingUser({ ...editingUser!, fullName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre de Usuario</label>
                  <input 
                    type="text" 
                    value={editingUser?.username || ''}
                    onChange={e => setEditingUser({ ...editingUser!, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="usuario.erp"
                  />
                </div>

                {!editingUser?.id && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contraseña Inicial</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-slate-600" size={18} />
                      <input 
                        type="password" 
                        value={editingUser?.password || ''}
                        onChange={e => setEditingUser({ ...editingUser!, password: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rol del Sistema</label>
                  <select 
                    value={editingUser?.role}
                    onChange={e => setEditingUser({ ...editingUser!, role: e.target.value as UserRole })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  >
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-900/50 border-t border-slate-700 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-slate-700 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-all">Cancelar</button>
              <button onClick={handleSave} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"><Check size={18} /> {editingUser?.id ? 'Actualizar' : 'Registrar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosView;

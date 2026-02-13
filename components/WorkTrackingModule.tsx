
import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Check, X, Loader2, History, User as UserIcon, Send, ClipboardList, AlertCircle, CheckCheck, EyeOff, Filter, BookOpenCheck, Square, CheckSquare, ChevronDown, ChevronUp, Maximize2, ShieldCheck, Clock, UserCheck } from 'lucide-react';
import { supabase } from '../services/supabaseMock';
import { User, WorkTracking, TrackingLog, OrdTrabajo, UserRole } from '../types';
import { ROLE_LABELS } from '../constants';

interface Props {
  user: User;
}

const ALL_ROLES = Object.values(UserRole);

const WorkTrackingModule: React.FC<Props> = ({ user }) => {
  const [trackings, setTrackings] = useState<WorkTracking[]>([]);
  const [ots, setOts] = useState<OrdTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [otsLoading, setOtsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [otSearch, setOtSearch] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<WorkTracking | null>(null);
  const [newLogMessage, setNewLogMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    const data = await supabase.getWorkTrackings();
    setTrackings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = supabase.subscribe(loadData);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const timer = setTimeout(async () => {
      setOtsLoading(true);
      const data = await supabase.getOTs(otSearch);
      setOts(data);
      setOtsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [otSearch, showModal]);

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const handleCreateTracking = async (ot: OrdTrabajo) => {
    const alreadyExists = trackings.some(t => t.id_trabajo.toString().trim().toLowerCase() === ot.id.toString().trim().toLowerCase());
    if (alreadyExists) {
      setDuplicateError(`La OT ${ot.id} ya tiene un seguimiento activo.`);
      return;
    }

    setDuplicateError(null);
    const newWt: WorkTracking = {
      id: Math.random().toString(36).substr(2, 9),
      id_trabajo: ot.id,
      of: ot.ofabricaciones,
      descripcion_trabajo: ot.descripcion,
      logs: [{
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        message: `Inició seguimiento de trabajo desde el sector ${user.role}`,
        timestamp: new Date().toISOString(),
        readBy: [{ userId: user.id, role: user.role, userName: user.fullName, timestamp: new Date().toISOString() }]
      }],
      created_at: new Date().toISOString()
    };

    await supabase.saveWorkTracking(newWt);
    setShowModal(false);
    setOtSearch('');
    loadData();
  };

  const handleAddLog = async () => {
    if (!selectedTracking || !newLogMessage.trim()) return;

    const newLog: TrackingLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      message: newLogMessage.trim(),
      timestamp: new Date().toISOString(),
      readBy: [{ userId: user.id, role: user.role, userName: user.fullName, timestamp: new Date().toISOString() }]
    };

    const updated = {
      ...selectedTracking,
      logs: [newLog, ...selectedTracking.logs]
    };

    await supabase.saveWorkTracking(updated);
    setSelectedTracking(updated);
    setNewLogMessage('');
    loadData();
  };

  const markLogAsRead = async (logId: string) => {
    if (!selectedTracking) return;

    const updatedLogs = selectedTracking.logs.map(log => {
      if (log.id === logId) {
        const alreadyRead = log.readBy?.some(r => r.userId === user.id);
        if (alreadyRead) return log;
        return {
          ...log,
          readBy: [...(log.readBy || []), { 
            userId: user.id, 
            role: user.role, 
            userName: user.fullName, 
            timestamp: new Date().toISOString() 
          }]
        };
      }
      return log;
    });

    const updated = { ...selectedTracking, logs: updatedLogs };
    await supabase.saveWorkTracking(updated);
    setSelectedTracking(updated);
    loadData();
  };

  const markAllAsRead = async (wt: WorkTracking) => {
    const updatedLogs = wt.logs.map(log => {
      const alreadyRead = log.readBy?.some(r => r.userId === user.id);
      if (alreadyRead) return log;
      return {
        ...log,
        readBy: [...(log.readBy || []), { 
          userId: user.id, 
          role: user.role, 
          userName: user.fullName, 
          timestamp: new Date().toISOString() 
        }]
      };
    });

    const updated = { ...wt, logs: updatedLogs };
    await supabase.saveWorkTracking(updated);
    if (selectedTracking?.id === wt.id) setSelectedTracking(updated);
    loadData();
  };

  const isTrackingUnread = (wt: WorkTracking) => {
    return wt.logs.some(log => !log.readBy?.some(r => r.userId === user.id));
  };

  const filtered = trackings.filter(t => {
    const matchesSearch = t.id_trabajo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (t.of || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterMode === 'UNREAD') return matchesSearch && isTrackingUnread(t);
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pt-10 border-t border-slate-800">
      {/* Header con Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <ClipboardList className="text-blue-500" size={28} /> Seguimiento y Bitácora
          </h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Checklist de Lectura Obligatorio por Sector</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-1 rounded-2xl border border-slate-700 flex">
            <button 
              onClick={() => setFilterMode('ALL')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${filterMode === 'ALL' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Filter size={14} /> Todas las OTs
            </button>
            <button 
              onClick={() => setFilterMode('UNREAD')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all relative ${filterMode === 'UNREAD' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <EyeOff size={14} /> Sin Leer
              {trackings.filter(isTrackingUnread).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-slate-800">
                  {trackings.filter(isTrackingUnread).length}
                </span>
              )}
            </button>
          </div>
          <button 
            onClick={() => { setShowModal(true); setDuplicateError(null); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Plus size={18} /> Iniciar Seguimiento
          </button>
        </div>
      </div>

      {/* Tabla Principal de OTs */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 bg-slate-950/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-3 text-slate-600" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar por OT o OF..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-sm pl-12 pr-4 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 text-slate-500 uppercase font-black text-[10px] tracking-widest">
              <tr>
                <th className="px-8 py-5">Prioridad / Estado</th>
                <th className="px-8 py-5">Identificador OT</th>
                <th className="px-8 py-5">Proyecto / OF</th>
                <th className="px-8 py-5">Última Novedad</th>
                <th className="px-8 py-5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(t => {
                const unread = isTrackingUnread(t);
                return (
                  <tr key={t.id} className={`hover:bg-slate-800/40 transition-colors ${unread ? 'bg-blue-600/[0.04]' : ''}`}>
                    <td className="px-8 py-5">
                      {unread ? (
                        <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] animate-pulse">
                          <AlertCircle size={16} /> NOVEDADES PENDIENTES
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-[10px]">
                          <CheckCheck size={16} /> AL DÍA
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 font-mono font-black text-slate-200 text-lg">{t.id_trabajo}</td>
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-300 text-xs">{t.of || 'S/OF'}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs uppercase font-bold">{t.descripcion_trabajo}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                          {t.logs[0]?.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-300">@{t.logs[0]?.userName}</p>
                          <p className="text-[9px] text-slate-600 uppercase font-mono">{new Date(t.logs[0]?.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => setSelectedTracking(t)} 
                        className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] transition-all flex items-center gap-2 mx-auto ${
                          unread ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <History size={16} /> Abrir Bitácora
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Bitácora Detallada (Log Viewer) */}
      {selectedTracking && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center text-blue-500">
                  <ClipboardList size={32} />
                </div>
                <div>
                  <h4 className="font-black text-4xl uppercase tracking-tighter text-white">{selectedTracking.id_trabajo}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="bg-slate-800 text-blue-400 text-[10px] px-3 py-1 rounded-full font-black border border-blue-500/20">{selectedTracking.of}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase truncate max-w-md">{selectedTracking.descripcion_trabajo}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => markAllAsRead(selectedTracking)}
                  className="bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase border border-slate-700 transition-all flex items-center gap-2"
                >
                  <BookOpenCheck size={18} /> Todo Leído
                </button>
                <button onClick={() => setSelectedTracking(null)} className="p-4 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-2xl transition-all border border-slate-700">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Feed de Mensajes - Versión Optimizada Compacta */}
            <div className="p-8 flex-1 overflow-y-auto space-y-4 flex flex-col bg-slate-900/40">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-center mb-4">Cronología de Eventos</p>
              
              {[...selectedTracking.logs].reverse().map((log) => {
                const isReadByMe = log.readBy?.some(r => r.userId === user.id);
                const isMyLog = log.userId === user.id;
                const isExpanded = expandedLogs.has(log.id);

                return (
                  <div key={log.id} className="flex flex-col animate-in fade-in slide-in-from-top-2">
                    {/* Row Compacto */}
                    <div 
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                        !isReadByMe && !isMyLog 
                        ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/5' 
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => toggleLogExpansion(log.id)}
                    >
                      {/* Avatar Mini */}
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[10px] font-black transition-all ${
                        !isReadByMe && !isMyLog ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        {log.userName.charAt(0)}
                      </div>

                      {/* Info Sector */}
                      <div className="w-24 shrink-0">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                           log.userRole === UserRole.ADMIN ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                          {log.userRole}
                        </span>
                      </div>

                      {/* Mensaje Corto */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!isReadByMe && !isMyLog ? 'text-slate-100 font-bold' : 'text-slate-400 font-medium'}`}>
                          {log.message}
                        </p>
                      </div>

                      {/* Timestamp & Icons */}
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[10px] text-slate-600 font-mono hidden sm:block">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {/* Indicador de lectura rápido */}
                        {isReadByMe || isMyLog ? (
                          <CheckCheck size={16} className="text-emerald-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-blue-500 animate-pulse" />
                        )}

                        <button className="text-slate-500 group-hover:text-white transition-colors">
                          {isExpanded ? <ChevronUp size={20} /> : <Maximize2 size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Detalle Extendido (Acordeón) */}
                    {isExpanded && (
                      <div className="mx-6 p-6 bg-slate-800/50 border-x border-b border-slate-800 rounded-b-3xl space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start">
                           <div className="space-y-1">
                              <p className="text-xs font-black text-slate-200 uppercase">Enviado por {log.userName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                           </div>
                           <div className="flex gap-2">
                             {!isMyLog && !isReadByMe && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); markLogAsRead(log.id); }}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all flex items-center gap-2 shadow-xl shadow-blue-600/20"
                                >
                                  <Check size={14} /> Confirmar Lectura
                                </button>
                             )}
                             {(isReadByMe || isMyLog) && (
                                <span className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                  <CheckCheck size={16} /> Validado
                                </span>
                             )}
                           </div>
                        </div>

                        <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-6 rounded-2xl border border-slate-800 shadow-inner font-medium italic">
                          {log.message}
                        </p>

                        {/* Checklist por sector en el detalle */}
                        <div className="pt-4 border-t border-slate-700/30">
                          <p className="text-[9px] font-black text-slate-600 uppercase mb-4 tracking-widest flex items-center gap-2">
                            <CheckCheck size={12} /> Firmas de recepción por Sector:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                            {ALL_ROLES.map(role => {
                              const hasRead = log.readBy?.some(r => r.role === role);
                              return (
                                <div 
                                  key={role} 
                                  className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl border text-[8px] font-black uppercase transition-all ${
                                    hasRead 
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-inner' 
                                    : 'bg-slate-900 border-slate-800 text-slate-700 opacity-30'
                                  }`}
                                >
                                  {hasRead ? <CheckCheck size={12} /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-700" />}
                                  {role}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Auditoría de Lectura Detallada (Lista Desplegable Nombre + Sector) */}
                        <div className="pt-6 mt-4 border-t border-blue-500/20">
                          <details className="group/audit">
                            <summary className="list-none cursor-pointer flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400">
                               <UserCheck size={16} />
                               Historial de Lecturas ({log.readBy?.length || 0})
                               <ChevronDown size={14} className="group-open/audit:rotate-180 transition-transform" />
                            </summary>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 animate-in fade-in">
                              {log.readBy?.map((reader, rIdx) => (
                                <div key={rIdx} className="bg-slate-900/60 border border-slate-700/50 p-3 rounded-xl flex justify-between items-center group/reader transition-all hover:bg-slate-800 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 font-black text-[10px]">
                                       {reader.userName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black text-slate-100 uppercase">{reader.userName || 'Usuario'}</p>
                                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-wider">{ROLE_LABELS[reader.role as UserRole]}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-1.5 text-slate-500 justify-end">
                                       <Clock size={10} />
                                       <p className="text-[8px] font-mono">{new Date(reader.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <p className="text-[8px] font-mono text-slate-600">{new Date(reader.timestamp).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              ))}
                              {(!log.readBy || log.readBy.length === 0) && (
                                <p className="text-[10px] text-slate-600 italic uppercase font-black py-4">Nadie ha confirmado la lectura todavía</p>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Panel de Escritura */}
            <div className="p-8 border-t border-slate-800 bg-slate-950/60">
              <div className="relative group">
                <textarea 
                  value={newLogMessage}
                  onChange={(e) => setNewLogMessage(e.target.value)}
                  placeholder="Registre avances, problemas técnicos o requerimientos aquí..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] p-6 pr-32 text-base text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none h-32 shadow-inner placeholder:text-slate-700"
                />
                <button 
                  onClick={handleAddLog}
                  disabled={!newLogMessage.trim()}
                  className="absolute right-6 bottom-6 p-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl shadow-2xl shadow-blue-600/30 transition-all active:scale-90 disabled:opacity-10"
                >
                  <Send size={28} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva OT */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur flex items-center justify-center z-[120] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h4 className="font-black text-xl uppercase tracking-tight">Vincular OT a Seguimiento</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              {duplicateError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-black uppercase animate-in shake">
                  <AlertCircle size={20} /> {duplicateError}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-4 top-4 text-slate-600" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar OT..." 
                  value={otSearch}
                  onChange={(e) => { setOtSearch(e.target.value); setDuplicateError(null); }}
                  className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="bg-slate-950 rounded-2xl border border-slate-800 h-80 overflow-y-auto divide-y divide-slate-900 shadow-inner">
                {otsLoading ? (
                  <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
                ) : (
                  ots.map(ot => (
                    <div 
                      key={ot.id} 
                      onClick={() => handleCreateTracking(ot)}
                      className="p-5 hover:bg-blue-600/10 cursor-pointer flex justify-between items-center group transition-all"
                    >
                      <div>
                        <p className="font-mono font-black text-blue-400 text-sm">{ot.id}</p>
                        <p className="text-[10px] text-slate-500 group-hover:text-slate-300 font-black mt-1 uppercase">{ot.descripcion}</p>
                      </div>
                      <Plus size={20} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkTrackingModule;


import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseMock';
import { WorkTracking, User, UserRole, TrackingLog } from '../types';
import { 
  ClipboardList, 
  ShieldCheck, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  User as UserIcon,
  Activity,
  UserCheck,
  FileText
} from 'lucide-react';
import { ROLE_LABELS } from '../constants';

interface Props {
  user: User;
}

const AdminBitacoraView: React.FC<Props> = ({ user }) => {
  const [trackings, setTrackings] = useState<WorkTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOt, setExpandedOt] = useState<string | null>(null);

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

  const getReadStats = (wt: WorkTracking) => {
    const totalLogs = wt.logs.length;
    const totalRequiredReadings = totalLogs * 7; 
    const actualReadings = wt.logs.reduce((acc, log) => acc + (log.readBy?.length || 0), 0);
    const percentage = totalRequiredReadings > 0 ? (actualReadings / totalRequiredReadings) * 100 : 0;
    return { totalLogs, actualReadings, percentage };
  };

  const filtered = trackings.filter(t => 
    t.id_trabajo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.of || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-[2rem] shadow-2xl shadow-blue-500/20 border border-blue-400/20">
            <ShieldCheck size={36} />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Auditoría Maestra</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" /> Control Trazable de Bitácoras Sectoriales
            </p>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-8 shadow-inner">
           <div className="text-center border-r border-slate-800 pr-8">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-1">OTs Activas</p>
              <p className="text-2xl font-black text-white">{trackings.length}</p>
           </div>
           <div className="text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Lecturas Totales</p>
              <p className="text-2xl font-black text-blue-500">
                {trackings.reduce((acc, wt) => acc + wt.logs.reduce((lacc, log) => lacc + (log.readBy?.length || 0), 0), 0)}
              </p>
           </div>
        </div>
      </div>

      {/* Barra de Búsqueda Industrial */}
      <div className="relative group">
        <Search className="absolute left-6 top-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={24} />
        <input 
          type="text" 
          placeholder="Rastrear OT, OF o descripción de proyecto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-[2rem] pl-16 pr-8 py-5 text-lg text-white font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-xl placeholder:text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filtered.map(wt => {
          const stats = getReadStats(wt);
          const isExpanded = expandedOt === wt.id;
          
          return (
            <div key={wt.id} className={`bg-slate-900/60 border transition-all rounded-[2.5rem] overflow-hidden ${isExpanded ? 'border-blue-500/40 shadow-2xl scale-[1.01]' : 'border-slate-800 hover:border-slate-700'}`}>
              {/* Header de OT en Auditoría */}
              <div 
                className="p-8 cursor-pointer flex flex-wrap md:flex-nowrap items-center gap-8 hover:bg-slate-800/40 transition-colors"
                onClick={() => setExpandedOt(isExpanded ? null : wt.id)}
              >
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 font-black text-2xl shadow-inner">
                  {wt.id_trabajo.substring(0, 2)}
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-4 mb-1">
                    <h4 className="text-2xl font-black text-white tracking-tight">{wt.id_trabajo}</h4>
                    <span className="bg-blue-600/10 text-blue-400 text-[10px] px-3 py-1 rounded-full border border-blue-500/20 font-black uppercase tracking-widest">{wt.of || 'SIN OF'}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase truncate max-w-md">{wt.descripcion_trabajo}</p>
                </div>

                {/* Barra de Progreso de Lecturas */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-slate-500">Nivel de Validación Global</span>
                    <span className={stats.percentage === 100 ? 'text-emerald-500' : 'text-blue-500'}>{Math.round(stats.percentage)}%</span>
                  </div>
                  <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700" 
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                   <p className="text-[10px] text-slate-500 font-black uppercase">Último Mensaje</p>
                   <p className="text-xs font-bold text-slate-300">{new Date(wt.logs[0]?.timestamp).toLocaleDateString()}</p>
                </div>

                <div className={`p-4 rounded-2xl transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}>
                   {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                </div>
              </div>

              {/* Detalle de Auditoría Expandido */}
              {isExpanded && (
                <div className="p-8 bg-slate-950/60 border-t border-slate-800 space-y-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3">
                      <FileText size={16} /> Registro Histórico de Confirmaciones
                    </h5>
                    <p className="text-[9px] text-slate-600 font-black uppercase">Mostrando {wt.logs.length} entradas de bitácora</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {wt.logs.map(log => (
                      <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all group/log shadow-xl">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          {/* Emisor del Mensaje */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                               <UserIcon size={24} />
                            </div>
                            <div>
                               <div className="flex items-center gap-3">
                                 <p className="text-sm font-black text-white uppercase tracking-tight">{log.userName}</p>
                                 <span className="bg-slate-800 text-slate-400 text-[8px] px-2 py-0.5 rounded-md border border-slate-700 font-black uppercase">{log.userRole}</span>
                               </div>
                               <p className="text-[10px] text-slate-600 font-mono mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Grid de Sectores (Firma rápida) */}
                          <div className="flex gap-1.5 self-center">
                            {Object.values(UserRole).map(role => {
                              const hasRead = log.readBy?.some(r => r.role === role);
                              return (
                                <div 
                                  key={role} 
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black border transition-all ${
                                    hasRead ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 shadow-sm' : 'bg-slate-950 text-slate-800 border-slate-800'
                                  }`}
                                  title={`${ROLE_LABELS[role]}: ${hasRead ? 'VISTO' : 'PENDIENTE'}`}
                                >
                                  {role.charAt(0)}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Contenido del Mensaje */}
                        <div className="mt-6 p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 shadow-inner">
                           <p className="text-sm text-slate-300 font-medium leading-relaxed italic">"{log.message}"</p>
                        </div>

                        {/* DESPLEGABLE DE LECTORES (NUEVO) */}
                        <div className="mt-6 border-t border-slate-800 pt-4">
                          <details className="group/readers">
                            <summary className="list-none cursor-pointer flex items-center gap-3 text-[10px] font-black text-blue-500 uppercase hover:text-blue-400 transition-colors tracking-widest">
                               <UserCheck size={16} />
                               Lista de Lectura Detallada ({log.readBy?.length || 0})
                               <ChevronDown size={14} className="group-open/readers:rotate-180 transition-transform ml-auto" />
                            </summary>
                            
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in zoom-in-95 duration-200">
                              {log.readBy?.map((reader, rIdx) => (
                                <div key={rIdx} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 group/reader hover:border-blue-500/30 transition-all">
                                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 group-hover/reader:text-blue-500 transition-colors font-black text-xs">
                                     {reader.userName?.charAt(0) || 'U'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-200 uppercase truncate">{reader.userName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                       <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                          reader.role === UserRole.ADMIN ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                                       }`}>
                                          {reader.role}
                                       </span>
                                       <span className="text-[9px] text-slate-600 font-mono">{new Date(reader.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(!log.readBy || log.readBy.length === 0) && (
                                <div className="col-span-full py-6 text-center text-[10px] text-slate-700 font-black uppercase italic border-2 border-dashed border-slate-800 rounded-2xl">
                                  Nadie ha confirmado la lectura de este registro
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-700">
            <AlertCircle size={80} strokeWidth={1} className="mb-6 opacity-20" />
            <h3 className="text-2xl font-black uppercase tracking-widest opacity-30">Sin resultados de auditoría</h3>
            <p className="text-sm font-medium opacity-20 mt-2">Verifique los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBitacoraView;

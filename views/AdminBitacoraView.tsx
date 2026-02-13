
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseMock.ts';
import { WorkTracking, User, UserRole, TrackingLog } from '../types.ts';
import { 
  ShieldCheck, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  User as UserIcon,
  Activity,
  UserCheck,
  FileText,
  Clock
} from 'lucide-react';
import { ROLE_LABELS } from '../constants.tsx';

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
          <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem] shadow-2xl shadow-blue-500/20 border border-blue-400/20">
            <ShieldCheck size={36} />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Auditoría Maestra</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" /> Trazabilidad de Lectura por Usuario y Sector
            </p>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-8 shadow-inner">
           <div className="text-center border-r border-slate-800 pr-8">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-1">OTs Activas</p>
              <p className="text-2xl font-black text-white">{trackings.length}</p>
           </div>
           <div className="text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Lecturas</p>
              <p className="text-2xl font-black text-blue-500">
                {trackings.reduce((acc, wt) => acc + wt.logs.reduce((lacc, log) => lacc + (log.readBy?.length || 0), 0), 0)}
              </p>
           </div>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={24} />
        <input 
          type="text" 
          placeholder="Rastrear OT, OF o descripción..."
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

                <div className="w-full md:w-64 flex flex-col gap-2">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-slate-500">Validación Global</span>
                    <span className={stats.percentage === 100 ? 'text-emerald-500' : 'text-blue-500'}>{Math.round(stats.percentage)}%</span>
                  </div>
                  <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-2xl transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}>
                   {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-8 bg-slate-950/60 border-t border-slate-800 space-y-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3">
                      <FileText size={16} /> Registro de Firmas Digitales
                    </h5>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {wt.logs.map(log => (
                      <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                               <UserIcon size={24} />
                            </div>
                            <div>
                               <div className="flex items-center gap-3">
                                 <p className="text-sm font-black text-white uppercase tracking-tight">{log.userName}</p>
                                 <span className="bg-blue-500/10 text-blue-400 text-[8px] px-2 py-0.5 rounded-md border border-blue-500/20 font-black uppercase">{ROLE_LABELS[log.userRole]}</span>
                               </div>
                               <p className="text-[10px] text-slate-600 font-mono mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex gap-1.5 self-center">
                            {Object.values(UserRole).map(role => {
                              const hasRead = log.readBy?.some(r => r.role === role);
                              return (
                                <div 
                                  key={role} 
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black border transition-all ${
                                    hasRead ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 shadow-sm' : 'bg-slate-950 text-slate-800 border-slate-800'
                                  }`}
                                  title={`${ROLE_LABELS[role]}: ${hasRead ? 'VALIDADO' : 'PENDIENTE'}`}
                                >
                                  {role.charAt(0)}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-5 p-5 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                           <p className="text-sm text-slate-300 font-medium italic">"{log.message}"</p>
                        </div>

                        <div className="mt-6 border-t border-slate-800/50 pt-4">
                          <details className="group/readers">
                            <summary className="list-none cursor-pointer flex items-center gap-3 text-[10px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors tracking-widest">
                               <UserCheck size={18} />
                               Historial Detallado ({log.readBy?.length || 0})
                               <ChevronDown size={14} className="group-open/readers:rotate-180 transition-transform ml-auto" />
                            </summary>
                            
                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
                              {log.readBy?.map((reader, rIdx) => (
                                <div key={rIdx} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 group/reader hover:border-blue-500/40 transition-all">
                                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover/reader:text-blue-400 transition-colors font-black text-sm uppercase">
                                     {reader.userName?.charAt(0) || 'U'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-100 uppercase truncate">{reader.userName}</p>
                                    <div className="flex flex-col gap-1 mt-1">
                                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md w-fit border ${
                                          reader.role === UserRole.ADMIN ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                       }`}>
                                          {ROLE_LABELS[reader.role as UserRole]}
                                       </span>
                                       <div className="flex items-center gap-1.5 text-slate-600 text-[9px] font-mono">
                                          <Clock size={10} />
                                          {new Date(reader.timestamp).toLocaleString()}
                                       </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
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
      </div>
    </div>
  );
};

export default AdminBitacoraView;

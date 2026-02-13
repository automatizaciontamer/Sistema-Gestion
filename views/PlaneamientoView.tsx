
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseMock';
import { Quotation, QuoteStatus, User, UserRole } from '../types';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Lock } from 'lucide-react';
import WorkTrackingModule from '../components/WorkTrackingModule';

interface Props {
  user: User;
}

const PlaneamientoView: React.FC<Props> = ({ user }) => {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  // Business Rule: Visibility check for quotes
  const canSeeQuotes = [UserRole.ADMIN, UserRole.AUTOMATIZACION, UserRole.COMPRAS, UserRole.PROYECTO].includes(user.role);

  const statuses = Object.values(QuoteStatus);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setLoading(true);
    if (canSeeQuotes) {
      const data = await supabase.getQuotes();
      setQuotes(data);
    }
    setLoading(false);
  };

  const updateStatus = async (quoteId: string, newStatus: QuoteStatus) => {
    const q = quotes.find(item => item.id === quoteId);
    if (q) {
      await supabase.saveQuote({ ...q, estado: newStatus });
      loadQuotes();
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-full flex flex-col space-y-12 pb-20">
      <div>
        <h2 className="text-2xl font-bold">Planeamiento de Producción</h2>
        <p className="text-slate-400">Control de flujo de trabajo y estados de cotización</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-6">
        {canSeeQuotes ? (
          <div className="flex gap-4 min-w-max h-[500px]">
            {statuses.map(status => {
              const filtered = quotes.filter(q => q.estado === status);
              return (
                <div key={status} className="w-80 flex flex-col bg-slate-900/40 rounded-2xl border border-slate-800">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{status}</h3>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">{filtered.length}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {filtered.map(q => (
                      <div key={q.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[10px] font-mono text-blue-400">{q.of}</p>
                          <p className="text-[10px] text-slate-500">{q.fecha}</p>
                        </div>
                        <h4 className="font-bold text-sm mb-1 leading-tight">{q.cliente}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-4">{q.titulo}</p>
                        
                        <div className="flex items-center justify-between border-t border-slate-700 pt-3">
                          <span className="text-xs font-bold text-slate-300">${q.total.toLocaleString()}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {status !== QuoteStatus.FINALIZADA && (
                              <button 
                                onClick={() => {
                                  const nextIdx = statuses.indexOf(status) + 1;
                                  updateStatus(q.id, statuses[nextIdx]);
                                }}
                                className="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                              >
                                <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-700 opacity-50">
                        <Clock size={32} strokeWidth={1} />
                        <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">Sin Tareas</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl text-slate-600">
            <Lock size={64} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold uppercase tracking-widest opacity-40">Kanban de Ventas Restringido</h3>
            <p className="text-sm mt-2 font-medium opacity-30">Su rol no tiene permisos para visualizar el flujo de cotizaciones</p>
          </div>
        )}
      </div>

      <WorkTrackingModule user={user} />
    </div>
  );
};

export default PlaneamientoView;

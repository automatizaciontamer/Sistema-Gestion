
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Database,
  Activity,
  RefreshCw,
  Lock
} from 'lucide-react';
import { supabase } from '../services/supabaseMock';
import { Quotation, QuoteStatus, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  user: any; // Using any to avoid complex type drilling for now
}

const Dashboard: React.FC<Props> = ({ user }) => {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [tableStats, setTableStats] = useState({
    ots: 0,
    mats: 0,
    users: 0,
    quotes: 0
  });
  const [loading, setLoading] = useState(true);

  // Business Rule: Visibility check for quotes
  const canSeeQuotes = [UserRole.ADMIN, UserRole.AUTOMATIZACION, UserRole.COMPRAS, UserRole.PROYECTO].includes(user.role);
  
  useEffect(() => {
    loadAllStats();
    const interval = setInterval(loadAllStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const [qData, counts] = await Promise.all([
        canSeeQuotes ? supabase.getQuotes() : Promise.resolve([]),
        supabase.getTableCounts()
      ]);
      setQuotes(qData || []);
      setTableStats(counts);
    } catch (e) {
      console.error("Error cargando estadísticas:", e);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = quotes.reduce((acc, q) => acc + (q.total || 0), 0);
  const activeJobs = quotes.filter(q => q.estado === QuoteStatus.EN_PRODUCCION).length;
  const approvedQuotes = quotes.filter(q => q.estado === QuoteStatus.APROBADA).length;
  const pendingQuotes = quotes.filter(q => q.estado === QuoteStatus.BORRADOR).length;

  const statusData = Object.values(QuoteStatus).map(s => ({
    name: s,
    value: quotes.filter(q => q.estado === s).length
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  const stats = [
    { label: 'Cartera Total', value: canSeeQuotes ? `$${totalValue.toLocaleString()}` : 'PRIVADO', icon: <DollarSign className="text-green-500" />, trend: 'Acumulado' },
    { label: 'OTs en Taller', value: activeJobs, icon: <Package className="text-blue-500" />, trend: 'Activas' },
    { label: 'Presupuestos', value: canSeeQuotes ? pendingQuotes : '---', icon: <Clock className="text-yellow-500" />, trend: 'Por enviar' },
    { label: 'Efectividad', value: canSeeQuotes && quotes.length > 0 ? `${Math.round((approvedQuotes / quotes.length) * 100)}%` : '---', icon: <CheckCircle className="text-purple-500" />, trend: 'Aprobación' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Dashboard de Control</h2>
          <p className="text-slate-400">Indicadores operativos y estado de base de datos en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
          <Activity size={16} className="text-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Conexión Supabase OK</span>
          <button onClick={loadAllStats} className="ml-2 p-1 hover:bg-slate-700 rounded transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-3xl shadow-lg hover:border-slate-500 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 group-hover:bg-blue-600/10 transition-colors">
                {stat.icon}
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-slate-700 text-slate-400 uppercase">
                {stat.trend}
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 p-8 rounded-3xl min-h-[450px] flex flex-col shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" /> Rendimiento de Proyectos
            </h3>
          </div>
          <div className="flex-1 w-full" style={{ minHeight: '300px', position: 'relative' }}>
            {canSeeQuotes ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 border-2 border-dashed border-slate-800 rounded-2xl">
                <Lock size={48} className="mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest opacity-40">Gráficos de ventas restringidos</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-inner">
            <h3 className="font-bold text-sm text-slate-300 mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Database size={16} className="text-blue-400" /> Registros en Sistema
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Ordenes de Trabajo', count: tableStats.ots, table: 'ord_trabajos', color: 'bg-blue-500' },
                { label: 'Materiales Stock', count: tableStats.mats, table: 'materiales', color: 'bg-emerald-500' },
                { label: 'Cotizaciones', count: canSeeQuotes ? tableStats.quotes : '---', table: 'cotizaciones', color: 'bg-purple-500' },
                { label: 'Usuarios Sistema', count: tableStats.users, table: 'usuarios', color: 'bg-orange-500' },
              ].map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${t.color}`}></div>
                    <span className="text-xs font-medium text-slate-400">{t.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">{t.count.toLocaleString()}</span>
                    <p className="text-[8px] text-slate-600 font-mono uppercase">{t.table}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
            <h3 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-widest">Actividad Reciente</h3>
            <div className="space-y-4">
              {canSeeQuotes ? (
                <>
                  {quotes.slice(0, 3).map(q => (
                    <div key={q.id} className="flex gap-3 items-start pb-4 border-b border-slate-700 last:border-0 last:pb-0">
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${q.estado === QuoteStatus.APROBADA ? 'bg-green-500' : q.estado === QuoteStatus.EN_PRODUCCION ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate text-slate-100">{q.cliente}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">{q.of}</p>
                      </div>
                    </div>
                  ))}
                  {quotes.length === 0 && <p className="text-center py-4 text-xs text-slate-600 italic">Sin registros</p>}
                </>
              ) : (
                <p className="text-center py-4 text-[10px] text-slate-600 italic uppercase font-black">Actividad de ventas privada</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

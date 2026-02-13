
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, DollarSign, Package, Loader2, Save, Edit2, Check, X, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '../services/supabaseMock';
import { Quotation, Material, QuoteStatus, QuoteItem, User } from '../types';
import WorkTrackingModule from '../components/WorkTrackingModule';

interface Props {
  user: User;
}

const ComprasView: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'quotes' | 'prices'>('quotes');
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // States for Price Editing
  const [editingMat, setEditingMat] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Quote Details Modal
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = supabase.subscribe(loadData);
    return unsubscribe;
  }, [activeTab, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'quotes') {
        const data = await supabase.getQuotes();
        setQuotes(data.filter(q => 
          q.cliente.toLowerCase().includes(search.toLowerCase()) || 
          q.of.toLowerCase().includes(search.toLowerCase())
        ));
      } else {
        const data = await supabase.getMateriales(search);
        setMaterials(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async (mat: Material) => {
    setIsSaving(true);
    try {
      await supabase.saveMaterial({ ...mat, precio: editPrice });
      setEditingMat(null);
      loadData();
    } catch (e) {
      alert("Error al actualizar precio");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Módulo de Compras</h2>
          <p className="text-slate-400">Seguimiento de costos y gestión de insumos industriales</p>
        </div>
        
        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700 w-full md:w-auto">
          <button 
            onClick={() => { setActiveTab('quotes'); setSearch(''); }}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'quotes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Cotizaciones
          </button>
          <button 
            onClick={() => { setActiveTab('prices'); setSearch(''); }}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'prices' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Lista de Precios
          </button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-700 bg-slate-900/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder={activeTab === 'quotes' ? "Buscar por cliente o OF..." : "Buscar material por código o nombre..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            />
          </div>
          {loading && <Loader2 className="animate-spin text-blue-500" />}
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {activeTab === 'quotes' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 text-[10px] uppercase font-black tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-5">Orden Fab.</th>
                  <th className="px-6 py-5">Cliente / Entidad</th>
                  <th className="px-6 py-5">Estado Actual</th>
                  <th className="px-6 py-5 text-right">Monto Estimado</th>
                  <th className="px-6 py-5 text-center">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-sm">
                {quotes.map(q => (
                  <tr key={q.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-blue-400 font-bold">{q.of}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-100">{q.cliente}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs uppercase">{q.titulo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                        q.estado === QuoteStatus.APROBADA ? 'bg-green-500/10 text-green-500' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {q.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-100">${(q.total || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedQuote(q)}
                        className="p-2 bg-slate-900 hover:bg-blue-600 hover:text-white rounded-xl border border-slate-700 transition-all text-slate-400 flex items-center gap-2 mx-auto px-4"
                      >
                        <Eye size={14} />
                        <span className="text-[10px] font-black uppercase">Ver Ítems</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 text-[10px] uppercase font-black tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-5">Código Material</th>
                  <th className="px-6 py-5">Descripción Insumo</th>
                  <th className="px-6 py-5 text-right">P. Unitario ($)</th>
                  <th className="px-6 py-5 text-right">Stock</th>
                  <th className="px-6 py-5 text-center">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-sm">
                {materials.map(m => {
                  const isEditing = editingMat === m.codigo;
                  return (
                    <tr key={m.codigo} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-emerald-400 font-bold">{m.codigo}</td>
                      <td className="px-6 py-4 font-medium text-slate-200 uppercase">{m.descripcion}</td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <input 
                              type="number" 
                              autoFocus
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-24 bg-slate-950 border border-blue-500/50 text-right px-2 py-1 rounded text-white font-black"
                            />
                          </div>
                        ) : (
                          <span className="font-black text-slate-100 text-base">${m.precio.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className={`px-2 py-0.5 rounded font-bold ${m.en_stock && m.en_stock > 0 ? 'text-slate-300' : 'text-red-500 bg-red-500/10'}`}>
                           {m.en_stock || 0}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleUpdatePrice(m)}
                                disabled={isSaving}
                                className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg shadow-green-600/20"
                              >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                              </button>
                              <button 
                                onClick={() => setEditingMat(null)}
                                className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => { setEditingMat(m.codigo); setEditPrice(m.precio); }}
                              className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl border border-blue-500/20 transition-all flex items-center gap-2 px-4 group"
                            >
                              <Edit2 size={14} className="group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase">Editar Precio</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && ((activeTab === 'quotes' && quotes.length === 0) || (activeTab === 'prices' && materials.length === 0)) && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-30">
              <TrendingUp size={64} strokeWidth={1} />
              <p className="mt-4 font-black uppercase tracking-widest">No se encontraron registros</p>
            </div>
          )}
        </div>
      </div>

      {/* Bitácora de Seguimiento */}
      <WorkTrackingModule user={user} />

      {/* Quote Details Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Desglose Técnico: {selectedQuote.of}</h3>
                <p className="text-xs text-blue-400 font-bold uppercase">{selectedQuote.cliente}</p>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Título de Proyecto</p>
                   <p className="text-sm font-bold text-slate-200">{selectedQuote.titulo}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Inversión Total</p>
                   <p className="text-xl font-black text-emerald-500">${selectedQuote.total.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-2xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/50 text-[10px] uppercase font-black text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Código</th>
                      <th className="px-6 py-4">Descripción</th>
                      <th className="px-6 py-4 text-center">Cant.</th>
                      <th className="px-6 py-4 text-right">P. Unit</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-xs">
                    {(selectedQuote.items || []).map((item: QuoteItem) => (
                      <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-blue-400">{item.materialCodigo}</td>
                        <td className="px-6 py-4 font-bold text-slate-300 uppercase">{item.descripcion}</td>
                        <td className="px-6 py-4 text-center font-black">{item.cantidad}</td>
                        <td className="px-6 py-4 text-right text-slate-400">${item.precioUnitario.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-100">${item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!selectedQuote.items || selectedQuote.items.length === 0) && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-600 italic">No hay materiales asociados a esta cotización</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex justify-end">
              <button 
                onClick={() => setSelectedQuote(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasView;

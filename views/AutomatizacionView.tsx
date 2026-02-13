
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit3, Trash2, Check, X, Loader2, Package, ShoppingCart, AlertCircle, Building2, Hash, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabaseMock';
import { Quotation, QuoteStatus, OrdTrabajo, Material, QuoteItem, UserRole, User, OrdFabricacion, Cliente } from '../types';
import WorkTrackingModule from '../components/WorkTrackingModule';

interface Props {
  user: User;
  readOnly?: boolean;
}

const AutomatizacionView: React.FC<Props> = ({ user, readOnly = false }) => {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [ots, setOts] = useState<OrdTrabajo[]>([]);
  const [mats, setMats] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [otsLoading, setOtsLoading] = useState(false);
  const [matsLoading, setMatsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedOtId, setSelectedOtId] = useState('');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Partial<Quotation> | null>(null);
  
  const [matSearch, setMatSearch] = useState('');
  const [otSearch, setOtSearch] = useState('');

  const canEdit = !readOnly && [UserRole.ADMIN, UserRole.AUTOMATIZACION].includes(user.role);

  const loadMainData = async () => {
    setLoading(true);
    try {
      const qData = await supabase.getQuotes();
      setQuotes(qData || []);
    } catch (error) {
      console.error("Error loading quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMainData();
    const unsubscribe = supabase.subscribe(loadMainData);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!showModal || isViewOnly) return;
    const timer = setTimeout(async () => {
      setOtsLoading(true);
      try {
        const data = await supabase.getOTs(otSearch);
        setOts(data || []);
      } finally {
        setOtsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [otSearch, showModal, isViewOnly]);

  useEffect(() => {
    if (!showModal || isViewOnly) return;
    const timer = setTimeout(async () => {
      setMatsLoading(true);
      try {
        const data = await supabase.getMateriales(matSearch);
        setMats(data || []);
      } finally {
        setMatsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [matSearch, showModal, isViewOnly]);

  const handleSelectOt = async (ot: OrdTrabajo) => {
    const otId = ot.id?.toString() || '';
    setSelectedOtId(otId);
    
    setOtsLoading(true);
    try {
      const [ofs, cls] = await Promise.all([
        supabase.getOFs(),
        supabase.getClientes()
      ]);
      
      const ofRecord = ofs.find(f => f.of === ot.ofabricaciones);
      const clienteRecord = cls.find(c => c.cod_cliente === ofRecord?.cod_cliente);
      
      const ofVal = ofRecord?.of || ot.ofabricaciones || 'S/OF';
      const clienteVal = clienteRecord?.nombre || 'CLIENTE EXTERNO';
      const tituloVal = `${ofVal} - ${clienteVal} - ${ot.descripcion || 'TRABAJO TÉCNICO'}`;

      setCurrentQuote(prev => ({
        ...prev,
        of: ofVal,
        cliente: clienteVal,
        titulo: tituloVal,
        id_trabajo: otId
      }));
    } catch (err) {
      console.error("Error al vincular datos de OT:", err);
    } finally {
      setOtsLoading(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedOtId) {
      alert("Por favor seleccione una Orden de Trabajo (OT)");
      return;
    }
    
    try {
      const total = quoteItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);

      const quoteData: Quotation = {
        id: currentQuote?.id || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
        id_trabajo: selectedOtId,
        of: currentQuote?.of || 'S/OF',
        cliente: currentQuote?.cliente || 'CLIENTE EXTERNO',
        titulo: currentQuote?.titulo || 'COTIZACIÓN SIN TÍTULO',
        items: quoteItems,
        total,
        fecha: currentQuote?.fecha || new Date().toISOString().split('T')[0],
        estado: (currentQuote?.estado as QuoteStatus) || QuoteStatus.BORRADOR
      };

      await supabase.saveQuote(quoteData);
      setShowModal(false);
      resetForm();
      loadMainData();
    } catch (err) {
      alert("Error al guardar la cotización.");
      console.error("Save Error:", err);
    }
  };

  const performDelete = async (id: string) => {
    if (!id || deletingId) return;

    setDeletingId(id);
    setConfirmingId(null);
    console.log("Vista: Iniciando borrado de ID:", id);

    try {
      const success = await supabase.deleteQuote(id);
      if (!success) {
        alert("ERROR: No se pudo eliminar el registro. Verifique permisos de base de datos.");
      }
    } catch (err) {
      console.error("Vista: Error crítico de red:", err);
      alert("Error de conexión al intentar borrar.");
    } finally {
      setDeletingId(null);
      await loadMainData();
    }
  };

  const resetForm = () => {
    setSelectedOtId('');
    setQuoteItems([]);
    setCurrentQuote(null);
    setMatSearch('');
    setOtSearch('');
    setOts([]);
    setMats([]);
    setIsViewOnly(false);
  };

  const addItem = (mat: Material) => {
    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      materialCodigo: mat.codigo || 'S/C',
      descripcion: mat.descripcion || 'S/D',
      cantidad: 1,
      precioUnitario: mat.precio || 0,
      subtotal: mat.precio || 0
    };
    setQuoteItems([...quoteItems, newItem]);
    setMatSearch('');
  };

  const updateItem = (id: string, qty: number) => {
    setQuoteItems(quoteItems.map(item => {
      if (item.id === id) {
        return { ...item, cantidad: qty, subtotal: qty * item.precioUnitario };
      }
      return item;
    }));
  };

  const openView = (q: Quotation) => {
    setCurrentQuote(q);
    setSelectedOtId(q.id_trabajo || '');
    setQuoteItems(q.items || []);
    setIsViewOnly(true);
    setShowModal(true);
  };

  const openEdit = (q: Quotation) => {
    setCurrentQuote(q);
    setSelectedOtId(q.id_trabajo || '');
    setQuoteItems(q.items || []);
    setIsViewOnly(false);
    setShowModal(true);
  };

  const filteredQuotes = quotes.filter(q => {
    const s = searchTerm.toLowerCase();
    return (q.cliente || '').toLowerCase().includes(s) || 
           (q.of || '').toLowerCase().includes(s) ||
           (q.titulo || '').toLowerCase().includes(s);
  });

  if (loading && quotes.length === 0) return <div className="flex h-full items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2" /> Cargando Cotizaciones...</div>;

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">{readOnly ? 'Visualizador de Proyectos' : 'Módulo de Ventas'}</h2>
          <p className="text-slate-400 text-sm">{readOnly ? 'Consulta de presupuestos aprobados' : 'Control de Cotizaciones'}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={loadMainData} className="p-2 text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          {canEdit && (
            <button 
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl"
            >
              <Plus size={20} /> Crear Nueva Cotización
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-700 bg-slate-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente, OF o título..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-5">Identificador OF</th>
                <th className="px-6 py-5">Entidad / Proyecto</th>
                <th className="px-6 py-5">Fecha</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5 text-right">Monto</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {filteredQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-blue-400 font-bold">{q.of}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-100 uppercase text-xs">{q.cliente}</p>
                    <p className="text-[11px] text-slate-500 truncate w-72 mt-1">{q.titulo}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{q.fecha}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                      q.estado === QuoteStatus.APROBADA ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>
                      {q.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-100">${(q.total || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openView(q); }} 
                        className="p-2 hover:bg-slate-600 rounded-lg text-slate-300"
                        title="Ver detalle"
                      >
                        <Eye size={16} />
                      </button>
                      {canEdit && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(q); }} 
                            className="p-2 hover:bg-slate-600 rounded-lg text-blue-400"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          
                          <div className="relative inline-block">
                             <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setConfirmingId(q.id); }} 
                                disabled={deletingId === q.id}
                                className={`p-2 rounded-lg transition-colors ${deletingId === q.id ? 'opacity-50' : 'hover:bg-red-500/20 text-red-500'}`}
                                title="Eliminar"
                              >
                                {deletingId === q.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                              </button>
                              
                              {confirmingId === q.id && (
                                <div className="absolute right-0 bottom-full mb-2 z-20 bg-slate-900 border border-red-500/50 p-2 rounded-xl shadow-2xl flex items-center gap-2 animate-in zoom-in-95 duration-150">
                                   <p className="text-[9px] text-white font-bold uppercase px-2 whitespace-nowrap">¿Seguro?</p>
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); performDelete(q.id); }}
                                      className="bg-red-600 hover:bg-red-500 text-white p-1 rounded-lg"
                                   >
                                      <Check size={14} />
                                   </button>
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); setConfirmingId(null); }}
                                      className="bg-slate-700 hover:bg-slate-600 text-white p-1 rounded-lg"
                                   >
                                      <X size={14} />
                                   </button>
                                </div>
                              )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-[2.5rem] w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-slate-700 flex justify-between items-center bg-slate-900/40">
              <h3 className="text-2xl font-black">{isViewOnly ? 'DETALLE' : 'EDITOR'} DE COTIZACIÓN</h3>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-10 flex-1">
              {!isViewOnly && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-blue-500 uppercase">1. Selección de OT</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 text-slate-600" size={16} />
                      <input 
                        type="text" 
                        placeholder="Buscar OT..."
                        value={otSearch}
                        onChange={(e) => setOtSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div className="bg-slate-900 rounded-xl border border-slate-700 h-48 overflow-y-auto">
                      <table className="w-full text-[10px]">
                        <tbody className="divide-y divide-slate-800">
                          {ots.map(ot => (
                            <tr key={ot.id} onClick={() => handleSelectOt(ot)} className={`cursor-pointer hover:bg-slate-800 ${selectedOtId === ot.id ? 'bg-blue-600/20' : ''}`}>
                              <td className="p-3 font-mono text-blue-400">{ot.id}</td>
                              <td className="p-3 truncate">{ot.descripcion}</td>
                              <td className="p-3 text-right">{selectedOtId === ot.id && <Check size={14} className="text-blue-500 ml-auto" />}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-emerald-500 uppercase">2. Inserción de Materiales</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 text-slate-600" size={16} />
                      <input 
                        type="text" 
                        placeholder="Buscar Material..."
                        value={matSearch}
                        onChange={(e) => setMatSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div className="bg-slate-900 rounded-xl border border-slate-700 h-48 overflow-y-auto">
                      <table className="w-full text-[10px]">
                        <tbody className="divide-y divide-slate-800">
                          {mats.map(m => (
                            <tr key={m.codigo} onClick={() => addItem(m)} className="cursor-pointer hover:bg-slate-800">
                              <td className="p-3 font-mono text-emerald-400">{m.codigo}</td>
                              <td className="p-3 truncate">{m.descripcion}</td>
                              <td className="p-3 text-right font-bold">${m.precio}</td>
                              <td className="p-3"><Plus size={14} className="text-blue-500" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-900/30 rounded-3xl border border-slate-700 overflow-hidden">
                <div className="p-5 bg-slate-900/60 border-b border-slate-700">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase">Desglose de Cotización</h4>
                </div>
                <div className="p-6 space-y-4">
                  {quoteItems.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="col-span-5">
                        <p className="text-[9px] text-blue-500 font-mono font-black mb-1">{item.materialCodigo}</p>
                        <p className="font-bold text-sm text-slate-100 uppercase">{item.descripcion}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[8px] text-slate-500 block mb-1">CANTIDAD</label>
                        <input 
                          type="number" 
                          readOnly={isViewOnly}
                          value={item.cantidad}
                          onChange={(e) => updateItem(item.id, Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-sm font-black"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[8px] text-slate-500 block mb-1">P. UNIT</label>
                        <p className="text-sm font-bold text-slate-300">${item.precioUnitario}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[8px] text-slate-500 block mb-1">TOTAL</label>
                        <p className="text-sm font-black text-blue-400">${item.subtotal}</p>
                      </div>
                      {!isViewOnly && (
                        <div className="col-span-1 text-right">
                          <button onClick={() => setQuoteItems(quoteItems.filter(i => i.id !== item.id))} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {quoteItems.length === 0 && <p className="text-center py-10 text-slate-600 uppercase text-xs font-black italic">Sin materiales cargados</p>}
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-700 bg-slate-900/60 flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Total Presupuestado</p>
                <p className="text-4xl font-black text-white">${quoteItems.reduce((acc, i) => acc + i.subtotal, 0).toLocaleString()}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowModal(false)} className="px-8 py-3 rounded-xl border border-slate-700 text-xs font-black uppercase">Cancelar</button>
                {!isViewOnly && (
                  <button 
                    onClick={handleCreateQuote}
                    disabled={!selectedOtId || quoteItems.length === 0}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 px-10 py-3 rounded-xl font-black text-white text-xs uppercase shadow-xl"
                  >
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bitácora de Seguimiento al final de la vista */}
      <WorkTrackingModule user={user} />
    </div>
  );
};

export default AutomatizacionView;

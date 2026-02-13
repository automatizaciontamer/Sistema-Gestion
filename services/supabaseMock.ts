
import { User, UserRole, Quotation, QuoteStatus, Cliente, OrdFabricacion, OrdTrabajo, Material, AuditEntry, AppNotification, WorkTracking } from '../types.ts';
import { supabaseClient } from '../supabaseConfig.ts';

class SupabaseService {
  private listeners: Function[] = [];

  constructor() {
    this.setupRealtime();
  }

  private setupRealtime() {
    supabaseClient
      .channel('public:any')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        this.notifyListeners();
      })
      .subscribe();
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  subscribe(callback: Function) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private mapUser(u: any): User {
    const rawRole = (u.role || '').toUpperCase();
    const validRole = Object.values(UserRole).includes(rawRole as UserRole) 
      ? (rawRole as UserRole) 
      : UserRole.PROYECTO;

    return {
      id: u.id,
      username: u.username,
      fullName: u.full_name || u.username,
      role: validRole,
      isActive: u.is_active ?? true,
      needsPasswordChange: u.needs_password_change ?? false
    };
  }

  private getVal(obj: any, keys: string[]): any {
    if (!obj) return '';
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    const objKeys = Object.keys(obj);
    for (const k of keys) {
      const foundKey = objKeys.find(ok => ok.toLowerCase() === k.toLowerCase());
      if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) return obj[foundKey];
    }
    return '';
  }

  private mapOT(raw: any): OrdTrabajo {
    const otValue = this.getVal(raw, ['ot', 'OT', 'id_trabajo', 'id', 'id_ot']);
    const ofValue = this.getVal(raw, ['ofabricacion', 'ofabricaciones', 'OFABRICACION', 'OFABRICACIONES', 'of', 'OF']);
    const descValue = this.getVal(raw, ['descripcion_ot', 'DESCRIPCION_OT', 'descripcion', 'DESCRIPCION', 'detalle']);

    return {
      id: otValue?.toString() || '',
      ofabricaciones: ofValue?.toString() || '',
      descripcion: descValue?.toString() || 'Sin Detalle'
    };
  }

  private mapOF(raw: any): OrdFabricacion {
    return {
      of: this.getVal(raw, ['of', 'OF', 'id_of']).toString(),
      cod_cliente: this.getVal(raw, ['cliente', 'cod_cliente', 'CLIENTE', 'COD_CLIENTE']).toString()
    };
  }

  private mapCliente(raw: any): Cliente {
    return {
      cod_cliente: this.getVal(raw, ['cod_cliente', 'COD_CLIENTE', 'codigo', 'cod_cliente']).toString(),
      nombre: this.getVal(raw, ['nombre', 'NOMBRE', 'razon_social', 'descripcion']).toString()
    };
  }

  private mapMaterial(raw: any): Material {
    return {
      codigo: this.getVal(raw, ['codigo', 'CODIGO', 'id_material']).toString(),
      descripcion: this.getVal(raw, ['descripcion', 'DESCRIPCION', 'nombre']).toString(),
      precio: parseFloat(this.getVal(raw, ['precio_un', 'PRECIO_UN', 'precio', 'precio_unitario']) || 0),
      en_stock: parseFloat(this.getVal(raw, ['en_stock', 'stock', 'CANTIDAD', 'cantidad']) || 0)
    };
  }

  async login(username: string, pass: string): Promise<User | null> {
    if (!username || !pass) return null;
    const cleanUser = username.trim();
    const cleanPass = pass.trim();
    try {
      const { data } = await supabaseClient
        .from('usuarios')
        .select('*')
        .ilike('username', cleanUser)
        .eq('password', cleanPass)
        .eq('is_active', true)
        .maybeSingle();

      if (data) return this.mapUser(data);
      
      if (cleanUser.toLowerCase() === 'admin' && cleanPass === '14569') {
        const { count } = await supabaseClient.from('usuarios').select('*', { count: 'exact', head: true });
        if (count === 0) {
          const { data: newUser } = await supabaseClient.from('usuarios').insert([{
            username: 'admin', 
            password: '14569', 
            full_name: 'Administrador Inicial',
            role: 'ADMIN',
            is_active: true, 
            needs_password_change: true
          }]).select().single();
          if (newUser) return this.mapUser(newUser);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async getTableCounts() {
    const tables = ['ord_trabajos', 'materiales', 'cotizaciones', 'usuarios', 'seguimiento_trabajos'];
    const results = await Promise.all(
      tables.map(t => supabaseClient.from(t).select('*', { count: 'exact', head: true }))
    );
    return {
      ots: results[0].count || 0,
      mats: results[1].count || 0,
      quotes: results[2].count || 0,
      users: results[3].count || 0,
      trackings: results[4].count || 0
    };
  }

  async getQuotes() {
    const { data } = await supabaseClient.from('cotizaciones').select('*').order('fecha', { ascending: false });
    return (data || []) as Quotation[];
  }
  
  async saveQuote(q: Quotation) {
    const { error } = await supabaseClient.from('cotizaciones').upsert({
      id: q.id, 
      id_trabajo: q.id_trabajo, 
      of: q.of, 
      cliente: q.cliente,
      titulo: q.titulo, 
      total: q.total, 
      fecha: q.fecha, 
      estado: q.estado, 
      items: q.items, 
      technical_specs: q.technicalSpecs
    });
    if (error) throw error;
    return q;
  }

  async deleteQuote(id: string): Promise<boolean> {
    if (!id) return false;
    try {
      const { data, error } = await supabaseClient
        .from('cotizaciones')
        .delete()
        .eq('id', id)
        .select();
      
      if (error) {
        console.error("Servicio: Error Supabase DELETE:", error.message);
        return false;
      }
      
      if (!data || data.length === 0) {
        console.warn("Servicio: No se encontró el registro para borrar o RLS denegado.");
        return false;
      }

      console.log("Servicio: Borrado exitoso.");
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error("Servicio: Excepción inesperada:", e);
      return false;
    }
  }

  async getWorkTrackings() {
    const { data } = await supabaseClient.from('seguimiento_trabajos').select('*').order('created_at', { ascending: false });
    return (data || []) as WorkTracking[];
  }

  async saveWorkTracking(wt: WorkTracking) {
    const { error } = await supabaseClient.from('seguimiento_trabajos').upsert({
      id: wt.id,
      id_trabajo: wt.id_trabajo,
      of: wt.of,
      cliente: wt.cliente,
      descripcion_trabajo: wt.descripcion_trabajo,
      logs: wt.logs
    });
    if (error) throw error;
    this.notifyListeners();
    return wt;
  }

  async deleteWorkTracking(id: string): Promise<boolean> {
    if (!id) return false;
    try {
      const { data, error } = await supabaseClient
        .from('seguimiento_trabajos')
        .delete()
        .eq('id', id)
        .select();
      if (error || !data || data.length === 0) return false;
      this.notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }

  async getNotifications(userId: string): Promise<AppNotification[]> {
    const { data } = await supabaseClient
      .from('notificaciones')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.ALL`)
      .order('timestamp', { ascending: false });
    return (data || []).map(n => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read,
      timestamp: n.timestamp
    })) as AppNotification[];
  }

  async markNotificationAsRead(id: string) {
    await supabaseClient.from('notificaciones').update({ is_read: true }).eq('id', id);
  }

  async getUsers() {
    const { data } = await supabaseClient.from('usuarios').select('*');
    return (data || []).map(u => this.mapUser(u));
  }

  async saveUser(u: Partial<User> & { password?: string }) {
    const payload: any = {};
    if (u.username !== undefined) payload.username = u.username;
    if (u.fullName !== undefined) payload.full_name = u.fullName;
    if (u.role !== undefined) payload.role = u.role;
    if (u.isActive !== undefined) payload.is_active = u.isActive;
    if (u.needsPasswordChange !== undefined) payload.needs_password_change = u.needsPasswordChange;
    if (u.password !== undefined) payload.password = u.password;

    if (u.id) {
      const { error } = await supabaseClient.from('usuarios').update(payload).eq('id', u.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from('usuarios').insert([payload]);
      if (error) throw error;
    }
  }

  async deleteUser(id: string) {
    const { error } = await supabaseClient.from('usuarios').delete().eq('id', id);
    if (error) throw error;
  }

  async getClientes(): Promise<Cliente[]> { 
    const { data } = await supabaseClient.from('clientes').select('*');
    return (data || []).map(row => this.mapCliente(row));
  }

  async getOFs(): Promise<OrdFabricacion[]> { 
    const { data } = await supabaseClient.from('ord_fabricaciones').select('*');
    return (data || []).map(row => this.mapOF(row));
  }

  async getOTs(search?: string) { 
    try {
      if (!search || search.trim().length === 0) {
        const { data } = await supabaseClient.from('ord_trabajos').select('*').limit(30);
        return (data || []).map(row => this.mapOT(row));
      }

      const term = `%${search.trim()}%`;
      
      try {
        const { data, error } = await supabaseClient
          .from('ord_trabajos')
          .select('*')
          .or(`ot.ilike.${term},descripcion_ot.ilike.${term},ofabricacion.ilike.${term}`)
          .limit(50);
        
        if (!error && data) return data.map(row => this.mapOT(row));
        if (error) console.warn("Reintentando búsqueda de OT por error de columna:", error.message);
      } catch (e) {}

      const { data: fallback, error: fbError } = await supabaseClient
        .from('ord_trabajos')
        .select('*')
        .or(`ot.ilike.${term},descripcion_ot.ilike.${term}`)
        .limit(50);

      if (fbError) {
        const { data: lastResort } = await supabaseClient.from('ord_trabajos').select('*').ilike('ot', term).limit(20);
        return (lastResort || []).map(row => this.mapOT(row));
      }

      return (fallback || []).map(row => this.mapOT(row));

    } catch (err) {
      console.error("Error crítico en getOTs:", err);
      return [];
    }
  }

  async getMateriales(search?: string) { 
    try {
      let query = supabaseClient.from('materiales').select('*');
      if (search && search.trim().length > 0) {
        const term = `%${search.trim()}%`;
        query = query.or(`codigo.ilike.${term},descripcion.ilike.${term}`);
      } else {
        query = query.order('codigo', { ascending: true });
      }
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []).map(row => this.mapMaterial(row));
    } catch (e) {
      console.error("Error Materiales:", e);
      return [];
    }
  }

  async saveMaterial(mat: Material) {
    const { error } = await supabaseClient.from('materiales').upsert({
      codigo: mat.codigo,
      descripcion: mat.descripcion,
      precio_un: mat.precio,
      en_stock: mat.en_stock
    });
    if (error) throw error;
    return mat;
  }
}

export const supabase = new SupabaseService();

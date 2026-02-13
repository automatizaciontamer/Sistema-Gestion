
export enum UserRole {
  ADMIN = 'ADMIN',
  AUTOMATIZACION = 'AUTOMATIZACION',
  COMPRAS = 'COMPRAS',
  PROYECTO = 'PROYECTO',
  TECNICA = 'TECNICA',
  PLANEAMIENTO = 'PLANEAMIENTO',
  TALLER = 'TALLER'
}

export enum QuoteStatus {
  BORRADOR = 'BORRADOR',
  ENVIADA = 'ENVIADA',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  EN_PRODUCCION = 'EN PRODUCCIÓN',
  FINALIZADA = 'FINALIZADA'
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  needsPasswordChange?: boolean;
}

export interface AuditEntry {
  id: string;
  recordId: string;
  userId: string;
  userName: string;
  action: 'CREACIÓN' | 'EDICIÓN' | 'ELIMINACIÓN' | 'CAMBIO_ESTADO';
  details: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: string;
}

export interface Cliente {
  cod_cliente: string;
  nombre: string;
}

export interface OrdFabricacion {
  of: string;
  cod_cliente: string;
}

export interface OrdTrabajo {
  id: string;
  ofabricaciones: string;
  descripcion: string;
}

export interface Material {
  codigo: string;
  descripcion: string;
  precio: number;
  en_stock?: number;
}

export interface QuoteItem {
  id: string;
  materialCodigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Quotation {
  id: string;
  id_trabajo: string;
  of: string;
  cliente: string;
  titulo: string;
  items: QuoteItem[];
  total: number;
  fecha: string;
  estado: QuoteStatus;
  technicalSpecs?: string;
}

export interface TrackingLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  message: string;
  timestamp: string;
  readBy?: { userId: string; role: UserRole; userName?: string; timestamp: string }[];
}

export interface WorkTracking {
  id: string;
  id_trabajo: string;
  of?: string;
  cliente?: string;
  descripcion_trabajo?: string;
  logs: TrackingLog[];
  created_at: string;
}

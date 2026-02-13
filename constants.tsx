
import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  ShoppingCart, 
  FileStack, 
  Settings2, 
  ClipboardList, 
  Wrench, 
  Users,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from './types.ts';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.AUTOMATIZACION]: 'Automatización',
  [UserRole.COMPRAS]: 'Compras',
  [UserRole.PROYECTO]: 'Proyectos',
  [UserRole.TECNICA]: 'Oficina Técnica',
  [UserRole.PLANEAMIENTO]: 'Planeamiento',
  [UserRole.TALLER]: 'Operativo Taller'
};

export const MENU_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: Object.values(UserRole) },
  { path: '/automatizacion', label: 'Automatización', icon: <Cpu size={20} />, roles: [UserRole.ADMIN, UserRole.AUTOMATIZACION] },
  { path: '/tecnica', label: 'Técnica', icon: <Settings2 size={20} />, roles: [UserRole.ADMIN, UserRole.TECNICA] },
  { path: '/compras', label: 'Compras', icon: <ShoppingCart size={20} />, roles: [UserRole.ADMIN, UserRole.COMPRAS] },
  { path: '/planeamiento', label: 'Planeamiento', icon: <ClipboardList size={20} />, roles: [UserRole.ADMIN, UserRole.PLANEAMIENTO] },
  { path: '/proyecto', label: 'Proyecto', icon: <FileStack size={20} />, roles: [UserRole.ADMIN, UserRole.PROYECTO] },
  { path: '/taller', label: 'Taller', icon: <Wrench size={20} />, roles: [UserRole.ADMIN, UserRole.TALLER] },
  { path: '/auditoria-bitacoras', label: 'Auditoría Bitácoras', icon: <ShieldCheck size={20} />, roles: [UserRole.ADMIN] },
  { path: '/usuarios', label: 'Usuarios', icon: <Users size={20} />, roles: [UserRole.ADMIN] },
];

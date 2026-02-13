
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURACIÓN DE SUPABASE
 */

const SUPABASE_URL = 'https://ykbwfgdnelsbcazvyyqz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYndmZ2RuZWxzYmNhenZ5eXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDQ5MDcsImV4cCI6MjA4NjQ4MDkwN30.hglnE5xmURZ3L7p_J8Ujvr96ceatIgV0nXff-bqc08U';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * ESTRUCTURA DE TABLAS REQUERIDA (SQL):
 * Ejecuta esto en el SQL Editor de Supabase para asegurar la compatibilidad:
 * 
 * -- 1. Tabla de Usuarios
 * CREATE TABLE usuarios (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   username TEXT UNIQUE NOT NULL,
 *   password TEXT NOT NULL,
 *   full_name TEXT,
 *   role TEXT NOT NULL, -- Valores: ADMIN, AUTOMATIZACION, COMPRAS, PROYECTO, TECNICA, PLANEAMIENTO, TALLER
 *   is_active BOOLEAN DEFAULT true,
 *   needs_password_change BOOLEAN DEFAULT false,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 2. Tabla de Cotizaciones
 * CREATE TABLE cotizaciones (
 *   id TEXT PRIMARY KEY,
 *   id_trabajo TEXT,
 *   of TEXT,
 *   cliente TEXT,
 *   titulo TEXT,
 *   total NUMERIC,
 *   fecha DATE DEFAULT CURRENT_DATE,
 *   estado TEXT,
 *   items JSONB,
 *   technical_specs TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 3. Tabla de Seguimiento de Trabajos (NUEVA)
 * CREATE TABLE seguimiento_trabajos (
 *   id TEXT PRIMARY KEY,
 *   id_trabajo TEXT NOT NULL,
 *   of TEXT,
 *   cliente TEXT,
 *   descripcion_trabajo TEXT,
 *   logs JSONB DEFAULT '[]'::jsonb,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 4. Tabla de Auditoría
 * CREATE TABLE auditoria (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   record_id TEXT,
 *   user_id TEXT,
 *   user_name TEXT,
 *   action TEXT,
 *   details TEXT,
 *   timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 5. Tabla de Notificaciones
 * CREATE TABLE notificaciones (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id TEXT, -- 'ALL' o ID de usuario
 *   title TEXT,
 *   message TEXT,
 *   type TEXT, -- info, success, warning, error
 *   is_read BOOLEAN DEFAULT false,
 *   timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 6. Tabla de Materiales
 * CREATE TABLE materiales (
 *   codigo TEXT PRIMARY KEY,
 *   descripcion TEXT,
 *   precio_un NUMERIC,
 *   en_stock NUMERIC DEFAULT 0
 * );
 */


import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types.ts';
import LoginView from './views/LoginView.tsx';
import Layout from './components/Layout.tsx';
import Dashboard from './views/Dashboard.tsx';
import AutomatizacionView from './views/AutomatizacionView.tsx';
import PlaneamientoView from './views/PlaneamientoView.tsx';
import TallerView from './views/TallerView.tsx';
import UsuariosView from './views/UsuariosView.tsx';
import TecnicaView from './views/TecnicaView.tsx';
import ComprasView from './views/ComprasView.tsx';
import AdminBitacoraView from './views/AdminBitacoraView.tsx';

const RoleGuard: React.FC<{ user: User, allowedRoles: UserRole[], children: React.ReactNode }> = ({ user, allowedRoles, children }) => {
  if (user.role === UserRole.ADMIN || allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }
  return <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('erp_session');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('erp_session');
      }
    }
    setIsReady(true);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('erp_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('erp_session');
  };

  if (!isReady) return null;

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          
          <Route path="/automatizacion" element={
            <RoleGuard user={user} allowedRoles={[UserRole.AUTOMATIZACION]}>
              <AutomatizacionView user={user} />
            </RoleGuard>
          } />

          <Route path="/compras" element={
            <RoleGuard user={user} allowedRoles={[UserRole.COMPRAS]}>
              <ComprasView user={user} />
            </RoleGuard>
          } />

          <Route path="/proyecto" element={
            <RoleGuard user={user} allowedRoles={[UserRole.PROYECTO]}>
              <AutomatizacionView user={user} readOnly={true} />
            </RoleGuard>
          } />

          <Route path="/tecnica" element={
            <RoleGuard user={user} allowedRoles={[UserRole.TECNICA]}>
              <TecnicaView user={user} />
            </RoleGuard>
          } />
          
          <Route path="/planeamiento" element={
            <RoleGuard user={user} allowedRoles={[UserRole.PLANEAMIENTO]}>
              <PlaneamientoView user={user} />
            </RoleGuard>
          } />

          <Route path="/taller" element={
            <RoleGuard user={user} allowedRoles={[UserRole.TALLER]}>
              <TallerView user={user} />
            </RoleGuard>
          } />

          <Route path="/auditoria-bitacoras" element={
            <RoleGuard user={user} allowedRoles={[UserRole.ADMIN]}>
              <AdminBitacoraView user={user} />
            </RoleGuard>
          } />
          
          <Route path="/usuarios" element={
            <RoleGuard user={user} allowedRoles={[UserRole.ADMIN]}>
              <UsuariosView />
            </RoleGuard>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;

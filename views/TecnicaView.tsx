
import React from 'react';
import { User } from '../types';
import { Settings2 } from 'lucide-react';
import WorkTrackingModule from '../components/WorkTrackingModule';

interface Props {
  user: User;
}

const TecnicaView: React.FC<Props> = ({ user }) => {
  return (
    <div className="space-y-12 animate-in fade-in pb-20">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
          <Settings2 size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight">OFICINA TÉCNICA</h2>
          <p className="text-slate-400">Documentación y seguimiento técnico de Ordenes de Trabajo</p>
        </div>
      </div>

      {/* Solo se deja el módulo de bitácora sectorial */}
      <WorkTrackingModule user={user} />
    </div>
  );
};

export default TecnicaView;

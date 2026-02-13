
import React from 'react';
import { User } from '../types';
import { HardHat } from 'lucide-react';
import WorkTrackingModule from '../components/WorkTrackingModule';

interface Props {
  user: User;
}

const TallerView: React.FC<Props> = ({ user }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl border border-yellow-500/20">
          <HardHat size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight">VISTA OPERATIVA TALLER</h2>
          <p className="text-slate-400 text-lg">Gestión de fabricación y control de novedades por OT</p>
        </div>
      </div>

      {/* Taller ahora se centra únicamente en la Bitácora de Seguimiento */}
      <WorkTrackingModule user={user} />
    </div>
  );
};

export default TallerView;

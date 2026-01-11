import React from 'react';
import { Info, Activity, ChevronRight, X, Heart, Mountain, Waves, Bike, Footprints } from 'lucide-react';

// Selector de iconos según el deporte de Strava
const SportIcon = ({ type, size = 20 }) => {
  switch (type) {
    case 'Swim': return <Waves size={size} />;
    case 'Ride': return <Bike size={size} />;
    case 'Run': return <Footprints size={size} />;
    default: return <Activity size={size} />;
  }
};

export const ActivityRow = ({ act, onClick }) => (
  <div onClick={onClick} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer group shadow-sm">
    <div className="flex items-center gap-4">
      <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <SportIcon type={act.sport_type} />
      </div>
      <div>
        <h4 className="font-bold text-sm text-slate-800">{act.name}</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
          {(act.distance_m / 1000).toFixed(1)} km • {act.day}
        </p>
      </div>
    </div>
    <div className="text-right">
      <div className="text-sm font-black text-slate-700 italic">{act.tss?.toFixed(0)} TSS</div>
      <div className="text-[9px] font-bold text-slate-300 uppercase">{act.sport_type}</div>
    </div>
  </div>
);

// Métrica dentro del modal (maneja valores nulos de forma elegante)
export const ModalDataPoint = ({ label, value, unit = "" }) => (
  <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
    <span className="text-slate-400 font-medium">{label}</span>
    <span className="font-bold text-slate-800">
      {value !== null && value !== undefined ? `${value}${unit}` : "--"}
    </span>
  </div>
);

// Los demás componentes (MetricCard) se mantienen igual...
export const MetricCard = ({ title, value, color, info }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group">
    <div className="flex justify-between items-start mb-1">
      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{title}</p>
      <div className="relative group/tooltip">
        <Info size={14} className="text-slate-300 cursor-help" />
        <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-all z-[100] shadow-xl">
          {info}
        </div>
      </div>
    </div>
    <div className={`text-3xl font-black ${color}`}>{value}</div>
  </div>
);
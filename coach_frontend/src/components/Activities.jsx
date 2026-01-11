import React from 'react';
import { X } from 'lucide-react';

const ActivitiesTable = ({ activities, onActivityClick }) => {
  return (
    <div className="animate-in slide-in-from-bottom-2 duration-500">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Historial de Actividades</h1>
        <p className="text-slate-400 text-sm font-medium">Resultados de los últimos 7 días</p>
      </header>
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100 tracking-widest">
              <tr>
                <th className="px-6 py-5">Sesión / Deporte</th>
                <th className="px-6 py-5 text-center">Distancia</th>
                <th className="px-6 py-5 text-center">TSS</th>
                <th className="px-6 py-5 text-center">IF</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((act) => (
                <tr 
                  key={act.id} 
                  onClick={() => onActivityClick(act)} 
                  className="hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {act.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      {act.day} • {act.sport_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                    {(act.distance_m / 1000).toFixed(1)} km
                  </td>
                  <td className="px-6 py-4 text-center font-black text-blue-600 italic">
                    {act.tss?.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">
                    {act.if_value?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                      <X size={14} className="rotate-45" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {activities.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-slate-400 font-medium italic">No hay actividades para mostrar en este rango.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesTable;
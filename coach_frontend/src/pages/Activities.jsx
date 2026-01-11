import React, { useState, useEffect } from 'react';
import { X, Activity, Loader2, ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { athleteService } from '../services/api';


const ActivitiesPage = ({ onActivityClick }) => {
  const [activities, setActivities] = useState([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [ATHLETE_ID] = useState(localStorage.getItem('athlete_id') || 0); // ID de atleta fijo para pruebas
  

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const offset = page * limit;
        
        // Ajustado para pasar los parámetros correctamente al servicio
        // athleteId, limit, offset
        const data = await athleteService.getActivities(ATHLETE_ID, limit, true, offset);
        console.log("Historial cargado:", data);
        
        setActivities(data);
        // Si la respuesta trae menos elementos que el límite, no hay más páginas
        setHasMore(data.length === limit);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [limit, page]);

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(0);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER CON FILTROS Y PAGINACIÓN */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic">Historial</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            Explora tus sesiones pasadas
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-slate-100">
            <ListFilter size={14} className="text-slate-400" />
            <select 
              value={limit}
              onChange={handleLimitChange}
              className="text-[10px] font-black text-blue-600 bg-transparent focus:outline-none cursor-pointer uppercase tracking-tighter"
            >
              <option value={10}>10 por pág</option>
              <option value={20}>20 por pág</option>
              <option value={50}>50 por pág</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0 || loading}
              className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-slate-600"
            >
              <ChevronLeft size={18} />
            </button>
            
            <span className="text-[10px] font-black text-slate-400 px-2 min-w-[80px] text-center uppercase tracking-widest">
              Página {page + 1}
            </span>
            
            <button 
              onClick={() => setPage(prev => prev + 1)}
              disabled={!hasMore || loading}
              className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-slate-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>
      
      {/* TABLA DE ACTIVIDADES */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100 tracking-widest">
              <tr>
                <th className="px-8 py-5">Sesión / Fecha</th>
                <th className="px-6 py-5 text-center">Distancia</th>
                <th className="px-6 py-5 text-center">Esfuerzo (TSS)</th>
                <th className="px-6 py-5 text-center">Intensidad (IF)</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <tr 
                    key={act.id} 
                    onClick={() => onActivityClick(act)} 
                    className="hover:bg-slate-50/80 cursor-pointer group transition-all"
                  >
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {act.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        {act.day} • <span className="text-blue-400/80">{act.sport_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-bold text-slate-600">
                        {(act.distance_m / 1000).toFixed(1)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 ml-1 uppercase">km</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-block px-3 py-1 rounded-lg bg-blue-50/50">
                        <span className="font-black text-blue-600 italic">
                          {act.tss?.toFixed(0) || '0'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center text-xs font-bold text-slate-400">
                      {act.if_value?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-0 rotate-45">
                        <X size={14} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : !loading && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <Activity size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No se encontraron actividades</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER MÓVIL */}
      <div className="mt-8 flex justify-center lg:hidden pb-10">
        <div className="bg-white border border-slate-200 rounded-2xl flex items-center p-1 shadow-md">
            <button 
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0 || loading}
              className="px-6 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-20 text-slate-600"
            >
              Anterior
            </button>
            <div className="w-px h-6 bg-slate-100 mx-2" />
            <button 
              onClick={() => setPage(prev => prev + 1)}
              disabled={!hasMore || loading}
              className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-blue-600 disabled:opacity-20"
            >
              Siguiente
            </button>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesPage;
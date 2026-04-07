import React from 'react';
import { Link } from 'react-router-dom';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { MetricCard, ActivityRow } from '../components/Dashboard';
import { stravaAuthService } from '../services/api';

const DashboardPage = ({ metrics, history, activities, onActivityClick, refreshData, isSyncing }) => {
  
  // --- LÓGICA DE FILTRADO SEMANA ACTUAL (Lunes a Domingo) ---
  const getWeeklyStats = () => {
    const now = new Date();
    // Ajuste para que el Lunes sea el día 1 (JS: Domingo=0, Lunes=1...)
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    // Filtramos actividades desde el lunes a las 00:00 hasta ahora
    const currentWeekActivities = activities.filter(act => {
      const actDate = new Date(act.start_date);
      return actDate >= startOfWeek;
    });

    // Calculamos totales
    return currentWeekActivities.reduce((acc, act) => ({
      dist: acc.dist + (act.distance_m || 0),
      time: acc.time + (act.moving_time_s || 0),
      work: acc.work + (act.kilojoules || 0),
      tss: acc.tss + (act.tss || 0),
      elev: acc.elev + (act.total_elevation_gain_m || act.total_elevation_gain || 0)
    }), { dist: 0, time: 0, work: 0, tss: 0, elev: 0 });
  };

  const weeklyStats = getWeeklyStats();

  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    const date = new Date(tickItem);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const handleConnect = () => {
    // Redirige al usuario a la página de autorización de Strava
    window.location.href = stravaAuthService.getConnectUrl();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">Hola, Dídac</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 italic">
            Sincronizado: {metrics?.updated_at ? new Date(metrics.updated_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--/--/-- --:--'}
          </p>
        </div>

        <div className="flex justify-end items-center gap-3">
          {/* Botón Sincronizar (Blanco/Azul) */}
          <button
            onClick={refreshData}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all border
              ${isSyncing 
                ? 'bg-slate-100 text-slate-400 border-slate-200' 
                : 'bg-white text-blue-600 border-slate-200 hover:bg-blue-50 active:scale-95 shadow-sm'}`}
          >
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isSyncing ? 'Procesando...' : 'Sincronizar con Strava'}
          </button>

          {/* Botón Conectar Strava (Naranja) */}
          <button 
            type="button" 
            onClick={handleConnect}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all bg-[#FC6100] text-white hover:bg-[#E35600] active:scale-95 shadow-sm shadow-orange-100"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM9.257 12.138l2.084-4.115h3.066L9.257 0 4.107 10.172h3.065l2.085 1.966z"/>
            </svg>
            Vincular Strava
          </button>
        </div>
      </header>

      {/* MÉTRICAS SUPERIORES */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Fitness (CTL)" value={metrics?.ctl?.toFixed(1)} color="text-blue-600" info="Tu nivel de forma a largo plazo (6 semanas)." />
        <MetricCard title="Fatiga (ATL)" value={metrics?.atl?.toFixed(1)} color="text-orange-500" info="Cansancio acumulado en los últimos 7 días." />
        <MetricCard title="Forma (TSB)" value={metrics?.tsb?.toFixed(1)} color={metrics?.tsb >= 0 ? "text-emerald-500" : "text-red-500"} info="Equilibrio entre forma y fatiga." />
        <MetricCard title="TSS Hoy" value={metrics?.tss?.toFixed(0)} color="text-purple-600" info="Puntuación de esfuerzo de hoy." />
      </div>

      {/* RESUMEN SEMANAL DINÁMICO */}
      <div className="bg-white rounded-[32px] border border-slate-200 p-6 mb-8 shadow-sm">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3 self-start xl:self-auto min-w-[140px]">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volumen</h4>
              <p className="text-sm font-black text-slate-900 uppercase italic">Esta Semana</p>
            </div>
          </div>

          <div className="hidden xl:block h-10 w-px bg-slate-100" />

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 w-full flex-1 xl:px-8">
            <div className="text-center xl:text-left">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Distancia</p>
              <p className="text-2xl font-black text-slate-900">
                {(weeklyStats.dist / 1000).toFixed(1)}
                <span className="text-[10px] ml-1 text-slate-400 font-bold">KM</span>
              </p>
            </div>

            <div className="text-center xl:text-left border-l border-slate-50 xl:border-none">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tiempo</p>
              <p className="text-2xl font-black text-slate-900">
                {Math.floor(weeklyStats.time / 3600)}
                <span className="text-[10px] text-slate-400 font-bold mx-0.5">H</span>
                {Math.floor((weeklyStats.time % 3600) / 60)}
                <span className="text-[10px] text-slate-400 font-bold ml-0.5">M</span>
              </p>
            </div>

            <div className="text-center xl:text-left border-t border-slate-50 md:border-none pt-4 md:pt-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trabajo</p>
              <p className="text-2xl font-black text-orange-500">
                {weeklyStats.work.toFixed(0)}
                <span className="text-[10px] ml-1 text-slate-400 font-bold">KJ</span>
              </p>
            </div>

            <div className="text-center xl:text-left border-t border-slate-50 md:border-l pt-4 md:pt-0 md:pl-6 xl:border-none xl:pl-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Carga (TSS)</p>
              <p className="text-2xl font-black text-blue-600">
                {weeklyStats.tss.toFixed(0)}
              </p>
            </div>

            <div className="text-center xl:text-left border-t border-slate-50 md:border-l pt-4 md:pt-0 md:pl-6 xl:border-none xl:pl-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Desnivel</p>
              <p className="text-2xl font-black text-slate-900">
                {weeklyStats.elev.toFixed(0)}
                <span className="text-[10px] ml-1 text-slate-400 font-bold">M</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN GRÁFICO Y LISTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600"/> Rendimiento (7D)
            </h3>
            <div className="flex gap-4 text-[8px] font-black uppercase tracking-widest bg-slate-50 p-2 rounded-lg px-3 border border-slate-100">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full"/> CTL</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-orange-400 rounded-full"/> ATL</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"/> TSB</span>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  tickFormatter={formatXAxis}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                />
                <Area type="monotone" dataKey="tsb" stroke="#10b981" fillOpacity={0.05} fill="#10b981" strokeWidth={1} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="ctl" stroke="#2563eb" strokeWidth={4} fillOpacity={0.08} fill="#2563eb" />
                <Line type="monotone" dataKey="atl" stroke="#fb923c" strokeWidth={2} dot={{ r: 3, fill: '#fb923c', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sesiones Recientes</h2>
            <Link to="/activities" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Ver Historial</Link>
          </div>
          <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
            {activities.length > 0 ? (
              activities.map(act => (
                <ActivityRow key={act.id} act={act} onClick={() => onActivityClick(act)} />
              ))
            ) : (
              <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                <p className="text-slate-300 text-xs font-bold uppercase italic">Sin datos recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
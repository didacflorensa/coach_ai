import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Activity, User, Zap, X, 
  Loader2, RefreshCw, Calendar, Trash2, LogOut 
} from 'lucide-react';

// Hooks y Servicios
import { useAthleteData } from './hooks/useAthleteData';
import { athleteService, authService } from './services/api';

// Páginas
import DashboardPage from './pages/Dashboard';
import ActivitiesPage from './pages/Activities';
import ProfilePage from './pages/Profile';
import CalendarPage from './pages/Calendar'; 
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// Componentes Reutilizables
import { ModalDataPoint } from './components/Dashboard';

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedAct, setSelectedAct] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // 1. Verificación de sesión inicial
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Hook de datos: El ID se pasa dinámicamente
  const { metrics, history, activities, loading, refreshData } = useAthleteData(user?.athlete_id || null);
  
  // Disparar carga cuando el usuario entra o cambia
  useEffect(() => {
    if (user?.athlete_id) {
      refreshData(true);
    }
  }, [user?.athlete_id, refreshData]);

  // --- LÓGICA DE TIEMPO INTELIGENTE ---
  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return "0s";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.round(totalSeconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs > 0 ? secs + 's' : ''}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setSelectedAct(null);
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm('¿Eliminar actividad? Esta acción no se puede deshacer.')) {
      try {
        setIsSyncing(true);
        setSyncStatus('Eliminando...');
        await athleteService.deleteActivity(user.athlete_id, activityId);
        await refreshData(true);
        setSelectedAct(null);
        setIsSyncing(false);
      } catch (err) {
        console.error(err);
        alert("No se pudo eliminar.");
        setIsSyncing(false);
      }
    }
  };

  const handleGlobalSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('Importando de Strava...');
      await athleteService.importActivities(user.athlete_id);
      setSyncStatus('Recalculando...');
      await athleteService.rebuildMetrics(user.athlete_id);
      await refreshData(true);
      setSyncStatus('¡Listo!');
      setTimeout(() => setIsSyncing(false), 1500);
    } catch (err) {
      console.error(err);
      alert("Error en la sincronización.");
      setIsSyncing(false);
    }
  };

  // Pantalla de carga de autenticación inicial
  if (authLoading) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={(u) => setUser(u)} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // --- FLUJO DE NO AUTENTICADO ---
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={(u) => setUser(u)} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // --- FLUJO AUTENTICADO ---
  const activeLink = "bg-blue-600 text-white shadow-lg shadow-blue-100";
  const inactiveLink = "text-slate-400 hover:bg-slate-50 font-medium";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans">
      
      {/* OVERLAY DE SINCRONIZACIÓN */}
      {isSyncing && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 text-center max-w-xs w-full animate-in zoom-in-95 duration-200">
            <RefreshCw size={48} className="animate-spin text-blue-600" />
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{syncStatus}</p>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col p-6 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 mb-10 px-2 font-bold text-xl text-blue-600 uppercase tracking-tighter">
          <Zap size={24} fill="currentColor" /> StravaMetrics
        </Link>
        <nav className="space-y-2 flex-1">
          <NavLink to="/" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? activeLink : inactiveLink}`}>
            <LayoutDashboard size={20}/> <span className="text-sm font-bold">Dashboard</span>
          </NavLink>
          <NavLink to="/activities" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? activeLink : inactiveLink}`}>
            <Activity size={20}/> <span className="text-sm font-bold">Actividades</span>
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? activeLink : inactiveLink}`}>
            <Calendar size={20}/> <span className="text-sm font-bold">Calendario</span>
          </NavLink>
        </nav>
        <div className="pt-6 border-t border-slate-100 mt-auto space-y-2">
          <NavLink to="/profile" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? activeLink : inactiveLink}`}>
            <User size={20}/> <span className="text-sm font-bold">Mi Perfil</span>
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 transition-all font-bold text-sm">
            <LogOut size={20}/> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 pb-24 max-w-8xl mx-auto w-full">
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardPage 
                key={user.athlete_id} // Forzamos re-render al cambiar de usuario
                metrics={metrics} 
                history={history} 
                activities={activities} 
                onActivityClick={setSelectedAct} 
                refreshData={handleGlobalSync} 
                isSyncing={isSyncing} 
              />
            } 
          />
          <Route path="/activities" element={<ActivitiesPage onActivityClick={setSelectedAct} />} />
          <Route path="/calendar" element={<CalendarPage activities={activities} onActivityClick={setSelectedAct} />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* NAV MÓVIL */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 flex justify-around py-4 z-50 px-6">
        <NavLink to="/" className={({ isActive }) => isActive ? 'text-blue-600' : 'text-slate-400'}><LayoutDashboard size={24} /></NavLink>
        <NavLink to="/activities" className={({ isActive }) => isActive ? 'text-blue-600' : 'text-slate-400'}><Activity size={24} /></NavLink>
        <NavLink to="/calendar" className={({ isActive }) => isActive ? 'text-blue-600' : 'text-slate-400'}><Calendar size={24} /></NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'text-blue-600' : 'text-slate-400'}><User size={24} /></NavLink>
      </nav>

      {/* MODAL GLOBAL DE ACTIVIDAD */}
      {selectedAct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedAct(null)} />
             <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                   <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedAct.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {selectedAct.day || new Date(selectedAct.start_date).toLocaleDateString()} • {selectedAct.sport_type}
                      </p>
                   </div>
                   <div className="flex gap-2">
                    <button onClick={() => handleDeleteActivity(selectedAct.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                      <Trash2 size={20} />
                    </button>
                    <button onClick={() => setSelectedAct(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                   {/* Grid de métricas en el modal */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-center">
                         <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">TSS</p>
                         <p className="text-2xl font-black text-blue-600">{selectedAct.tss?.toFixed(1) || '0'}</p>
                      </div>
                      <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-center">
                         <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">IF</p>
                         <p className="text-2xl font-black text-purple-600">{selectedAct.if_value?.toFixed(2) || '0'}</p>
                      </div>
                      <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 text-center">
                         <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">NP (Watts)</p>
                         <p className="text-2xl font-black text-orange-600">{selectedAct.weighted_average_watts || '--'}</p>
                      </div>
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center">
                         <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">EF</p>
                         <p className="text-2xl font-black text-emerald-600">{selectedAct.ef?.toFixed(2) || '0'}</p>
                      </div>
                   </div>

                    <div className="grid md:grid-cols-2 gap-x-16 gap-y-4">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-b pb-1">Esfuerzo</h4>
                        <ModalDataPoint label="Pulsaciones Medias" value={selectedAct.average_heartrate?.toFixed(0)} unit=" bpm"/>
                        <ModalDataPoint label="Pulsaciones Máximas" value={selectedAct.max_heartrate} unit=" bpm" />
                        <ModalDataPoint label="Potencia Media" value={selectedAct.average_watts?.toFixed(0)} unit=" w" />
                        <ModalDataPoint label="Gasto Energético" value={selectedAct.kilojoules?.toFixed(0)} unit=" kj" />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-b pb-1">Sesión</h4>
                        <ModalDataPoint label="Distancia" value={(selectedAct.distance_m / 1000).toFixed(1)} unit=" km" />
                        <ModalDataPoint label="Duración" value={formatDuration(selectedAct.moving_time_s)} unit="" />
                        <ModalDataPoint
                          label="Ritmo"
                          value={(() => {
                            if (!selectedAct.distance_m) return "0:00";
                            const pace = (selectedAct.moving_time_s / selectedAct.distance_m) * (1000 / 60);
                            const minutes = Math.floor(pace);
                            const seconds = Math.round((pace - minutes) * 60);
                            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                          })()}
                          unit=" min/km"
                        />
                        <ModalDataPoint label="Velocidad Media" value={(selectedAct.average_speed * 3.6).toFixed(1)} unit=" km/h" />
                      </div>
                    </div>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
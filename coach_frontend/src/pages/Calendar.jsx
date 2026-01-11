import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Loader2, Plus, X, Save, Trophy, Clock, MapPin, Activity } from 'lucide-react';
import { athleteService } from '../services/api';

const ATHLETE_ID = 41916723;

const CalendarPage = ({ onActivityClick }) => {
  const [activities, setActivities] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);
  const [issubmitting, setIsSubmitting] = useState(false);
  
  const today = new Date();

  const generate16DigitId = () => Math.floor(1e15 + Math.random() * 9e15).toString();

  // --- LÓGICA DE TIEMPO REUTILIZABLE ---
  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return "0s";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs > 0 ? secs + 's' : ''}`;
    }
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')} min`;
    }
    return `${secs}s`;
  };

  const initialFormState = {
    name: "Bicicleta",
    strava_activity_id: generate16DigitId(),
    sport_type: "Ride",
    start_date: new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T'),
    timezone: "Europe/Madrid",
    distance_m: 0,
    moving_time_s: 0,
    elapsed_time_s: 0,
    total_elevation_gain_m: 0,
    average_speed: 0,
    max_speed: 0,
    average_cadence: 0,
    average_temp: 0,
    average_watts: 0,
    max_watts: 0,
    weighted_average_watts: 0,
    kilojoules: 0,
    average_heartrate: 0,
    max_heartrate: 0,
    elev_high: 0,
    elev_low: 0,
    suffer_score: 0,
    trainer: false
  };

  const [formData, setFormData] = useState(initialFormState);

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [actData, raceData] = await Promise.all([
        athleteService.getActivities(ATHLETE_ID, 300, true, 0),
        athleteService.getRaces(ATHLETE_ID)
      ]);
      setActivities(actData);
      setRaces(raceData);
    } catch (error) {
      console.error("Error cargando calendario:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalData = { ...formData, start_date: new Date(formData.start_date).toISOString() };
      await athleteService.createActivity(ATHLETE_ID, finalData);
      setShowForm(false);
      setFormData(initialFormState);
      loadData();
    } catch (error) {
      alert("Error al crear actividad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const firstDayIndex = (startOfMonth.getDay() + 6) % 7;
  const daysInMonth = endOfMonth.getDate();

  const calendarData = [...activities, ...races.map(r => ({...r, isRace: true}))].reduce((acc, item) => {
    const dateStr = item.race_date || (item.start_date ? item.start_date.split('T')[0] : null);
    if (dateStr) {
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(item);
    }
    return acc;
  }, {});

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push({ day: null, currentMonth: false });
  for (let i = 1; i <= daysInMonth; i++) {
    const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
    const dateStr = formatLocalDate(dateObj);
    days.push({
      day: i, dateStr, isToday: dateObj.toDateString() === today.toDateString(),
      currentMonth: true, items: calendarData[dateStr] || []
    });
  }

  const changeMonth = (offset) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-8xl mx-auto pb-20 text-slate-900">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight">Calendario</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic">Entrenamientos y Carreras</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl shadow-lg transition-all text-[10px] font-black uppercase tracking-widest">
            <Plus size={16} strokeWidth={3} /> Nueva Actividad
          </button>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-600"><ChevronLeft size={20} /></button>
            <span className="text-[10px] font-black uppercase tracking-widest min-w-[140px] text-center">
              {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(viewDate)}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-600"><ChevronRight size={20} /></button>
          </div>
        </div>
      </header>

      {/* GRID DEL CALENDARIO */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        )}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r last:border-0">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px] md:auto-rows-[160px]">
          {days.map((d, idx) => (
            <div key={idx} className={`border-r border-b border-slate-50 p-2 relative group ${!d.currentMonth ? 'bg-slate-50/30' : 'hover:bg-blue-50/10'}`}>
              {d.day && (
                <div className="h-full flex flex-col">
                  <span className={`text-[10px] font-black mb-2 inline-flex items-center justify-center w-6 h-6 rounded-full ${d.isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-300'}`}>{d.day}</span>
                  <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                    {d.items.map((item, i) => (
                      item.isRace ? (
                        <button key={i} onClick={() => setSelectedRace(item)} className="w-full text-left p-1.5 rounded-xl bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all border-none">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Trophy size={10} className="text-white fill-white" />
                            <span className="text-[8px] font-black uppercase italic">Prioridad {item.priority}</span>
                          </div>
                          <div className="text-[10px] font-black leading-tight line-clamp-1 uppercase">{item.name}</div>
                        </button>
                      ) : (
                        <button key={i} onClick={() => onActivityClick(item)} className="w-full text-left p-1.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-blue-300 transition-all">
                          <div className="flex items-center gap-1 mb-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.tss > 100 ? 'bg-red-500' : 'bg-blue-500'}`} />
                            <span className="text-[8px] font-black text-slate-400 uppercase">{item.sport_type}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-700 leading-tight line-clamp-1">{item.name}</div>
                          {/* Aquí también aplicamos el formato en la miniatura si quisieras */}
                          <div className="text-[9px] font-medium text-slate-400">{formatDuration(item.moving_time_s)}</div>
                        </button>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LEYENDA */}
      <footer className="mt-6 flex flex-wrap gap-4">
        <div className="flex gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Carrera Objetivos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Entrenamientos</span>
          </div>
        </div>
      </footer>

      {/* MODAL DETALLES CARRERA (Formato HH:MM:SS Aplicado) */}
      {selectedRace && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedRace(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-500 p-8 text-white">
              <div className="flex justify-between items-start">
                <Trophy size={40} className="mb-4 opacity-50" />
                <button onClick={() => setSelectedRace(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20}/></button>
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">{selectedRace.name}</h2>
              <div className="flex gap-2 mt-2">
                <span className="bg-white/20 px-2 py-1 rounded-lg text-[9px] font-black uppercase">Prioridad {selectedRace.priority}</span>
                <span className="bg-white/20 px-2 py-1 rounded-lg text-[9px] font-black uppercase">{selectedRace.course_type}</span>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Distancia</p>
                  <p className="text-lg font-black text-slate-900">{(selectedRace.distance_m / 1000).toFixed(2)} km</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tiempo Objetivo</p>
                  <p className="text-lg font-black text-slate-900">
                    {formatDuration(selectedRace.goal_time_sec)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Clock size={16} className="text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-widest">{selectedRace.race_date}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO CREAR ACTIVIDAD */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 italic">Nueva Sesión</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manual Entry</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-red-500"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateActivity} className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/50 p-6 rounded-3xl border border-blue-100 mb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Nombre</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white border-0 rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Tipo</label>
                    <select value={formData.sport_type} onChange={e => setFormData({...formData, sport_type: e.target.value})} className="bg-white border-0 rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none shadow-sm cursor-pointer">
                      <option value="Ride">Ciclismo</option>
                      <option value="VirtualRide">Rodillo</option>
                      <option value="Run">Carrera</option>
                      <option value="WeightTraining">Fuerza</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Fecha</label>
                    <input type="datetime-local" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="bg-white border-0 rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" required />
                  </div>
                </div>
                {[
                  { label: "Distancia (m)", key: "distance_m" },
                  { label: "Tiempo (seg)", key: "moving_time_s" },
                  { label: "Vatios Medios", key: "average_watts" },
                  { label: "Pulsaciones", key: "average_heartrate" },
                  { label: "Desnivel (+)", key: "total_elevation_gain_m" },
                  { label: "TSS Estimado", key: "suffer_score" },
                ].map(f => (
                  <div key={f.key} className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">{f.label}</label>
                    <input type="number" value={formData[f.key]} onChange={e => setFormData({...formData, [f.key]: parseFloat(e.target.value)})} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                <button type="submit" disabled={issubmitting} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl disabled:opacity-50">
                  {issubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Guardar Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
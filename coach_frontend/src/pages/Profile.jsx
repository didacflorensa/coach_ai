import React, { useState, useEffect } from 'react';
import { User, Mail, Zap, Timer, Target, Calendar, Loader2 } from 'lucide-react';
import { athleteService } from '../services/api';

const ATHLETE_ID = 41916723;

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await athleteService.getProfile(ATHLETE_ID);
        setProfile(data);
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const formatPace = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!profile) return <div>Error al cargar el perfil</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 italic">Mi Perfil</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configuración de atleta y umbrales</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Info Personal */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 border-4 border-white shadow-md">
              <User size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-800">{profile.name} {profile.surname1}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Atleta de Resistencia</p>
            
            <div className="w-full mt-6 pt-6 border-t border-slate-50 space-y-4">
              <div className="flex items-center gap-3 text-slate-600 text-left">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="text-xs font-medium truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-left">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span className="text-xs font-medium italic">
                  Desde {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-[32px] text-white shadow-lg shadow-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <Target size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">Objetivo Semanal</h3>
            </div>
            <p className="text-4xl font-black italic">{profile.target_weekly_tss}</p>
            <p className="text-[10px] font-bold opacity-80 uppercase mt-1">Puntos TSS de carga</p>
          </div>
        </div>

        {/* COLUMNA DERECHA: Métricas de Umbral */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap size={18} className="text-blue-600" /> Umbrales de Rendimiento
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* FTP */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Potencia Funcional (FTP)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-800 italic">{profile.ftp_watts}</span>
                  <span className="text-sm font-bold text-slate-400 uppercase">Watts</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                   <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '70%'}}></div>
                </div>
              </div>

              {/* LTHR */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Umbral Lactato (LTHR)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-800 italic">{profile.lthr_bpm}</span>
                  <span className="text-sm font-bold text-slate-400 uppercase">BPM</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                   <div className="bg-orange-400 h-1.5 rounded-full" style={{width: '80%'}}></div>
                </div>
              </div>

              {/* Threshold Pace */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ritmo de Umbral</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-800 italic">
                    {formatPace(profile.threshold_pace_sec_per_km)}
                  </span>
                </div>
              </div>

              {/* Athlete ID */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Athlete ID Strava</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-mono font-bold text-slate-600">{profile.athlete_id}</span>
                </div>
              </div>
            </div>

            <div className="mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Timer size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Sincronización de umbrales</span>
               </div>
               <p className="text-xs font-bold text-slate-600">
                Última actualización: {new Date(profile.updated_at).toLocaleString()}
               </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm opacity-60">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 italic">Zona de edición</h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">La edición de métricas directas estará disponible en la próxima actualización.</p>
            <button disabled className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest cursor-not-allowed">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stravaAuthService } from '../services/api';
import { Loader2 } from 'lucide-react';

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const processed = useRef(false); // Para evitar que React 18 lo ejecute dos veces

  useEffect(() => {
    if (processed.current) return;
    
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=access_denied');
      return;
    }

    if (code) {
      processed.current = true;
      
      // Enviamos el código a tu API
      stravaAuthService.linkAccount(code)
        .then((response) => {
          // Guardamos el token de nuestra APP (JWT)
          localStorage.setItem('token', response.token); 
          // Redirigimos al Dashboard
          navigate('/');
        })
        .catch(err => {
          console.error(err);
          navigate('/login?error=link_failed');
        });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="bg-orange-50 p-6 rounded-[40px] mb-6">
        <Loader2 className="animate-spin text-[#FC6100]" size={40} />
      </div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Sincronizando con Strava</h2>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Estamos configurando tu motor de rendimiento</p>
    </div>
  );
};

export default StravaCallback;
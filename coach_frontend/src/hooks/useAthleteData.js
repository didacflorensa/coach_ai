import { useState, useEffect, useCallback } from 'react';
import { athleteService } from '../services/api';

export const useAthleteData = (athleteId) => {
  const [data, setData] = useState({
    metrics: null,
    history: [],
    activities: [],
    loading: true,
    error: null
  });

  const refreshData = useCallback(async (showLoading = false) => {
    // Si no hay ID, no intentamos la petición
    if (!athleteId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    if (showLoading) {
      setData(prev => ({ ...prev, loading: true }));
    }

    try {
      const [metrics, history, activities] = await Promise.all([
        athleteService.getLatestMetrics(athleteId),
        athleteService.getHistory(athleteId),
        athleteService.getActivities(athleteId),
      ]);

      setData({ 
        metrics, 
        history, 
        activities, 
        loading: false, 
        error: null 
      });
    } catch (err) {
      console.error("Error al cargar datos del atleta:", err);
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: "No se pudieron cargar los datos." 
      }));
    }
  }, [athleteId]);

  // Efecto principal: Disparador de carga
  useEffect(() => {
    let isMounted = true;

    if (athleteId) {
      // Si el ID existe, disparamos la carga
      refreshData(true);
    } else {
      // Si el ID desaparece (logout), reseteamos el estado
      setData({
        metrics: null,
        history: [],
        activities: [],
        loading: false,
        error: null
      });
    }

    return () => {
      isMounted = false; // Limpieza para evitar fugas de memoria
    };
  }, [athleteId, refreshData]);

  return { 
    ...data, 
    refreshData 
  };
};
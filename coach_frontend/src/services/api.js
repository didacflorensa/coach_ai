const BASE_URL = 'http://localhost:8000';

// Función auxiliar para formatear la fecha a YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// Función auxiliar para centralizar las peticiones y añadir el Token
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  // MODIFICACIÓN AQUÍ:
  if (response.status === 401) {
    // Si NO estamos en el login, limpiamos y redirigimos (sesión caducada)
    if (window.location.pathname !== '/login') {
        localStorage.clear();
        window.location.href = '/login';
        return;
    } 
    // Si SÍ estamos en el login, lanzamos el error para que el componente lo capture
    else {
        throw new Error('UNAUTHORIZED');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error en la petición');
  }

  return response.json();
};

// src/services/api.js

const request_delete = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // ... tus otros headers como Authorization
      ...options.headers,
    },
  });

  // 1. Si la respuesta es 204 (No Content), salimos sin intentar leer JSON
  if (response.status === 204) return null;

  // 2. Si no es exitosa, lanzamos error (puedes personalizar esto)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error en la petición');
  }

  // 3. Verificamos si hay contenido antes de parsear
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return null;
};

// --- SERVICIOS DE AUTENTICACIÓN (NUEVO EXPORT) ---
export const authService = {
  register: async (email, password, athleteId, name) => {
    return await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        id: parseInt(athleteId),
        name 
      }),
    });
    // No guardamos nada en localStorage aquí porque la respuesta no trae token
  },

  login: async (email, password) => {
    // Si el request falla (ej. 401), saltará directamente al 'catch' del componente Login
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data && data.access_token && data.athlete_id) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('strava_metrics_user', JSON.stringify(data));
      localStorage.setItem('athlete_id', data.athlete_id);
    }
    return data;
  },

  getCurrentUser: async () => {
    const userJson = localStorage.getItem('strava_metrics_user');
    if (!userJson) throw new Error('No hay sesión');
    return JSON.parse(userJson);
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('strava_metrics_user');
    window.location.href = '/login';
  }
};

// --- SERVICIOS DE ATLETA ---
export const athleteService = {
  // Datos para las cajas de arriba (Latest)
  getLatestMetrics: async (athleteId) => {
    return request(`/athletes/${athleteId}/daily-metrics/latest`);
  },

  // Datos para el gráfico (Historial de los últimos 7 días)
  getMetricsHistory: async (athleteId) => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const fromDay = formatDate(sevenDaysAgo);
    const toDay = formatDate(today);

    return request(`/athletes/${athleteId}/daily-metrics/?from_day=${fromDay}&to_day=${toDay}`);
  },

  // Datos para la tabla de actividades
  getActivities: async (athleteId, limit = 50, activitiesPage = false, offset = 0) => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    let fromDay = formatDate(sevenDaysAgo);
    let toDay = formatDate(today);

    if (activitiesPage) {
        fromDay = '2000-01-01'; 
    }
    
    const data = await request(`/athletes/${athleteId}/activities?from_day=${fromDay}&to_day=${toDay}&limit=${limit}&offset=${offset}`);
    return data.activities; 
  },

  importActivities: async (athleteId) => {
    return request(`/strava/${athleteId}/import-activities`, { method: 'POST' });
  },

  rebuildMetrics: async (athleteId) => {
    const today = formatDate(new Date());
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const fromDay = formatDate(lastWeek);

    return request(`/metrics/${athleteId}/rebuild?from_day=${fromDay}&to_day=${today}&force=true`, { 
      method: 'POST' 
    });
  },

  getHistory: async (athleteId) => {
    const data = await request(`/athletes/${athleteId}/metrics/ctl-atl/last-7-days`);
    return data.metrics || [];
  },

  getProfile: async (athleteId) => {
    return request(`/athletes/${athleteId}/profile`);
  },

  createActivity: async (athleteId, activityData) => {
    return request(`/athletes/${athleteId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  },

  deleteActivity: async (athleteId, activityId) => {
    return request(`/athletes/${athleteId}/activities/${activityId}`, {
      method: 'DELETE'
    });
  },

  getRaces: async (athleteId) => {
    return request(`/races?athlete_id=${athleteId}`);
  },

  createRace: async (athleteId, raceData) => {
    return await request('/races', {
      method: 'POST',
      body: JSON.stringify({
        ...raceData,
        athlete_id: athleteId // Nos aseguramos de enviar el ID del atleta
      }),
    });
  },

  deleteRace: async (raceId, athleteId) => {
  // Ahora el endpoint espera el ID en la URL y el athlete_id como Query Param
  return await request_delete(`/races/${raceId}?athlete_id=${athleteId}`, {
    method: 'DELETE',
  });
},
};
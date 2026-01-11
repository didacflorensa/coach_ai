-- users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  strava_athlete_id BIGINT UNIQUE NOT NULL,
  email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ftp_bike_w NUMERIC,     -- p.ej. 250
  ftp_run_w NUMERIC,      -- p.ej. CP/FTP 300
  run_thresh_speed REAL,  -- m/s (p.ej. 3.9)
  swim_css_speed REAL,    -- m/s (p.ej. 1.0)
  hr_rest SMALLINT, hr_max SMALLINT,
  tz TEXT DEFAULT 'Europe/Madrid',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- activities (resumen a nivel actividad)
CREATE TABLE activities (
  id BIGINT PRIMARY KEY,              -- id Strava
  user_id INTEGER REFERENCES users(id),
  start_date TIMESTAMPTZ NOT NULL,
  sport_type TEXT NOT NULL,           -- Ride/Run/Swim...
  name TEXT, distance_m REAL, moving_time_s INTEGER,
  elevation_gain_m REAL, avg_speed REAL, avg_hr REAL,
  avg_watts REAL, weighted_avg_watts REAL,
  device_watts BOOLEAN, has_heartrate BOOLEAN,
  tss REAL, tss_method TEXT,          -- calculado por nosotros
  created_at TIMESTAMPTZ DEFAULT now()
);

-- streams (opcional para cálculos finos)
CREATE TABLE activity_streams (
  activity_id BIGINT REFERENCES activities(id) ON DELETE CASCADE,
  stream_type TEXT,                   -- heartrate, watts, velocity_smooth, altitude, time
  values REAL[]                       -- array de floats
);

-- métricas diarias agregadas (para CTL/ATL)
CREATE TABLE metrics_daily (
  user_id INTEGER REFERENCES users(id),
  date DATE NOT NULL,
  tss REAL DEFAULT 0,                 -- suma TSS del día
  hours REAL DEFAULT 0,
  ctl REAL, atl REAL, tsb REAL,
  PRIMARY KEY (user_id, date)
);

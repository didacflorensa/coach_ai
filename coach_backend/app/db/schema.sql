-- =========================================
-- Tabla: athlete_tokens
-- Guarda los tokens OAuth de Strava
-- =========================================

CREATE TABLE IF NOT EXISTS athlete_tokens (
    athlete_id            BIGINT PRIMARY KEY,
    access_token          TEXT NOT NULL,
    refresh_token         TEXT NOT NULL,
    expires_at            BIGINT NOT NULL, -- epoch seconds

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athlete_tokens_expires_at
    ON athlete_tokens (expires_at);


-- =========================================
-- Tabla: activities
-- Actividades importadas desde Strava
-- =========================================

CREATE TABLE IF NOT EXISTS activities (
    id                       BIGSERIAL PRIMARY KEY,
    athlete_id               BIGINT NOT NULL,

    strava_activity_id       BIGINT NOT NULL,

    name                     TEXT NOT NULL DEFAULT '',
    sport_type               TEXT NOT NULL DEFAULT '',

    start_date               TIMESTAMPTZ NOT NULL,
    timezone                 TEXT NOT NULL DEFAULT '',

    distance_m               DOUBLE PRECISION NOT NULL DEFAULT 0,
    moving_time_s            BIGINT NOT NULL DEFAULT 0,
    elapsed_time_s           BIGINT NOT NULL DEFAULT 0,
    total_elevation_gain_m   DOUBLE PRECISION NOT NULL DEFAULT 0,

    average_heartrate        DOUBLE PRECISION,
    max_heartrate            DOUBLE PRECISION,
    average_watts            DOUBLE PRECISION,

    trainer                  BOOLEAN NOT NULL DEFAULT FALSE,

    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_activity_strava_id UNIQUE (strava_activity_id)
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_activities_athlete_id
    ON activities (athlete_id);

CREATE INDEX IF NOT EXISTS idx_activities_start_date
    ON activities (start_date);

CREATE INDEX IF NOT EXISTS idx_activities_athlete_start_date
    ON activities (athlete_id, start_date);

CREATE INDEX IF NOT EXISTS idx_activities_sport_type
    ON activities (sport_type);


CREATE TABLE IF NOT EXISTS daily_metrics (
  athlete_id   BIGINT NOT NULL,
  day          DATE   NOT NULL,

  tss          DOUBLE PRECISION NOT NULL DEFAULT 0,
  ctl          DOUBLE PRECISION NOT NULL DEFAULT 0,
  atl          DOUBLE PRECISION NOT NULL DEFAULT 0,
  tsb          DOUBLE PRECISION NOT NULL DEFAULT 0,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (athlete_id, day)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_day
  ON daily_metrics (day);

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS tss DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS tss_method TEXT,
  ADD COLUMN IF NOT EXISTS day DATE;  -- día local del atleta/actividad

CREATE INDEX IF NOT EXISTS idx_activities_athlete_day
  ON activities (athlete_id, day);


CREATE TABLE IF NOT EXISTS athlete_profile (
  athlete_id BIGINT PRIMARY KEY,

  ftp_watts DOUBLE PRECISION,
  lthr_bpm  DOUBLE PRECISION,
  threshold_pace_sec_per_km DOUBLE PRECISION,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ===== activities: métricas tipo TrainingPeaks =====
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS if_value DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS if_method TEXT,
  ADD COLUMN IF NOT EXISTS work_kj DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ef DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ef_method TEXT;

CREATE INDEX IF NOT EXISTS idx_activities_if_value ON activities (if_value);
CREATE INDEX IF NOT EXISTS idx_activities_work_kj ON activities (work_kj);
CREATE INDEX IF NOT EXISTS idx_activities_ef ON activities (ef);

-- ===== athlete_profile: objetivo semanal opcional =====
ALTER TABLE athlete_profile
  ADD COLUMN IF NOT EXISTS target_weekly_tss DOUBLE PRECISION;


ALTER TABLE daily_metrics
  ADD COLUMN IF NOT EXISTS duration_s BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS if_value DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS work_kj DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ef DOUBLE PRECISION;


ALTER TABLE activities
-- velocidades (m/s en Strava)
ADD COLUMN IF NOT EXISTS average_speed DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS max_speed DOUBLE PRECISION,

-- cadencia (rpm)
ADD COLUMN IF NOT EXISTS average_cadence DOUBLE PRECISION,

-- temperatura media (°C)
ADD COLUMN IF NOT EXISTS average_temp DOUBLE PRECISION,

-- potencia
ADD COLUMN IF NOT EXISTS max_watts DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS weighted_average_watts DOUBLE PRECISION,

-- energía
ADD COLUMN IF NOT EXISTS kilojoules DOUBLE PRECISION,

-- elevación
ADD COLUMN IF NOT EXISTS elev_high DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS elev_low DOUBLE PRECISION,

-- esfuerzo Strava
ADD COLUMN IF NOT EXISTS suffer_score DOUBLE PRECISION;





-- Necesitas citext (case-insensitive) para emails
CREATE EXTENSION IF NOT EXISTS citext;

-- 1) Usuarios de la app
CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,

    email CITEXT NOT NULL UNIQUE,
    password_hash TEXT, -- nullable si login solo con OAuth/Strava al principio

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Trigger updated_at (si ya tienes uno, reutilízalo)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_users_updated
BEFORE UPDATE ON app_users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- 2) Relación usuario-app <-> athlete_profile
CREATE TABLE app_user_athletes (
    id BIGSERIAL PRIMARY KEY,

    app_user_id BIGINT NOT NULL,
    athlete_id BIGINT NOT NULL,

    role TEXT NOT NULL DEFAULT 'athlete', -- athlete | coach | admin (si quieres)

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_app_user
      FOREIGN KEY (app_user_id)
      REFERENCES app_users (id)
      ON DELETE CASCADE,

    CONSTRAINT fk_athlete_profile
      FOREIGN KEY (athlete_id)
      REFERENCES athlete_profile (athlete_id)
      ON DELETE CASCADE,

    CONSTRAINT uq_app_user_athlete UNIQUE (app_user_id, athlete_id)
);

CREATE INDEX idx_app_user_athletes_user ON app_user_athletes (app_user_id);
CREATE INDEX idx_app_user_athletes_athlete ON app_user_athletes (athlete_id);


CREATE TABLE IF NOT EXISTS app_refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    app_user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON app_refresh_tokens(app_user_id);
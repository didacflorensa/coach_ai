from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.health import router as health_router
from app.api.routes.strava_auth import router as strava_auth_router
from app.api.routes.strava_activities import router as strava_activities_router
from app.api.routes.metrics import router as metrics_router
from app.api.routes.athlete_profile import router as athlete_profile_router
from app.api.routes.activities import router as activities_router
from app.api.routes.daily_metrics import router as daily_metrics_router
from app.api.routes.metrics_summary import router as metrics_summary_router
from app.api.routes.activity_write import router as activity_write_router
from app.api.routes.races import router as races
from app.api.routes.auth import router as auth



app = FastAPI(title="Coach AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite
        "http://127.0.0.1:5173",
        "http://192.168.1.28:5173",  # Red local
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(strava_auth_router)
app.include_router(strava_activities_router)
app.include_router(metrics_router)
app.include_router(athlete_profile_router)
app.include_router(activities_router)
app.include_router(daily_metrics_router)
app.include_router(metrics_summary_router)
#app.include_router(activity_write_router)
app.include_router(races)
app.include_router(auth)

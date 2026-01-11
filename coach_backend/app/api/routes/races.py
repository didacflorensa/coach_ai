from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db  # ajusta
from app.models.race_goal import RaceGoal  # ajusta
from app.schemas.races import RaceGoalCreate, RaceGoalOut, RaceGoalPatch  # ajusta

router = APIRouter(prefix="/races", tags=["races"])


@router.post("", response_model=RaceGoalOut, status_code=status.HTTP_201_CREATED)
def create_race(payload: RaceGoalCreate, db: Session = Depends(get_db)):
    """
    Crea una nueva race. El id lo asigna Postgres (SERIAL/IDENTITY).
    """
    race = RaceGoal(**payload.model_dump())
    db.add(race)
    db.commit()
    db.refresh(race)
    return race


@router.get("", response_model=list[RaceGoalOut])
def get_all_races(
    athlete_id: int = Query(..., description="Strava athlete id"),
    db: Session = Depends(get_db),
):
    races = db.execute(
        select(RaceGoal)
        .where(RaceGoal.athlete_id == athlete_id)
        .order_by(RaceGoal.race_date.asc())
    ).scalars().all()
    return races


@router.get("/{race_id}", response_model=RaceGoalOut)
def get_race_by_id(race_id: int, db: Session = Depends(get_db)):
    race = db.execute(select(RaceGoal).where(RaceGoal.id == race_id)).scalar_one_or_none()
    if not race:
        raise HTTPException(status_code=404, detail="race not found")
    return race


@router.patch("/{race_id}", response_model=RaceGoalOut)
def patch_race(
    race_id: int,
    payload: RaceGoalPatch,
    athlete_id: int | None = Query(None, description="(Opcional) para validar ownership"),
    db: Session = Depends(get_db),
):
    q = select(RaceGoal).where(RaceGoal.id == race_id)
    if athlete_id is not None:
        q = q.where(RaceGoal.athlete_id == athlete_id)

    race = db.execute(q).scalar_one_or_none()
    if not race:
        raise HTTPException(status_code=404, detail="race not found (or not owned by athlete)")

    patch_data = payload.model_dump(exclude_unset=True)
    for k, v in patch_data.items():
        setattr(race, k, v)

    db.commit()
    db.refresh(race)
    return race


@router.put("/{race_id}", response_model=RaceGoalOut)
def put_race_replace(
    race_id: int,
    payload: RaceGoalCreate,
    athlete_id: int | None = Query(None, description="(Opcional) para validar ownership"),
    db: Session = Depends(get_db),
):
    """
    PUT = reemplazo completo por id.
    Nota: como el payload incluye athlete_id, puedes cambiar de dueño; si no quieres, lo bloqueamos.
    """
    q = select(RaceGoal).where(RaceGoal.id == race_id)
    if athlete_id is not None:
        q = q.where(RaceGoal.athlete_id == athlete_id)

    race = db.execute(q).scalar_one_or_none()
    if not race:
        raise HTTPException(status_code=404, detail="race not found (or not owned by athlete)")

    data = payload.model_dump()
    # si NO quieres permitir cambiar athlete_id por PUT, descomenta:
    # data["athlete_id"] = race.athlete_id

    for k, v in data.items():
        setattr(race, k, v)

    db.commit()
    db.refresh(race)
    return race

@router.delete("/{race_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_race(
    race_id: int,
    athlete_id: int | None = Query(None, description="(Opcional) para validar ownership"),
    db: Session = Depends(get_db),
):
    q = select(RaceGoal).where(RaceGoal.id == race_id)
    if athlete_id is not None:
        q = q.where(RaceGoal.athlete_id == athlete_id)

    race = db.execute(q).scalar_one_or_none()
    if not race:
        raise HTTPException(status_code=404, detail="race not found (or not owned by athlete)")

    deleted_id = race.id
    
    db.delete(race)
    db.commit()
    return {"status": "success", "deleted_id": deleted_id, "message": "Race deleted successfully"}
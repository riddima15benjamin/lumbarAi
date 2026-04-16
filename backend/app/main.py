from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

from .fuzzy_logic import grade_patient_with_fuzzy_logic


class SeriesEntry(BaseModel):
    series_id: int | str | None = None
    description: str

    model_config = ConfigDict(extra="allow")


class CoordinateEntry(BaseModel):
    series_id: int | str | None = None
    instance_number: int | str | None = None
    condition: str
    level: str
    x: float | int | None = None
    y: float | int | None = None

    model_config = ConfigDict(extra="allow")


class PatientPayload(BaseModel):
    study_id: int | str
    severityScore: int | None = None
    conditions: dict[str, str] | None = None
    series: list[SeriesEntry]
    coordinates: list[CoordinateEntry]

    model_config = ConfigDict(extra="allow")


class HealthResponse(BaseModel):
    status: str


app = FastAPI(title="Lumbar AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/api/grade")
def grade_case(patient: PatientPayload) -> dict[str, Any]:
    return grade_patient_with_fuzzy_logic(patient.model_dump())

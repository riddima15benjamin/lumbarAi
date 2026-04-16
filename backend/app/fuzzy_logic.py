from __future__ import annotations

from dataclasses import dataclass
from typing import Any

LEVELS = ["l1_l2", "l2_l3", "l3_l4", "l4_l5", "l5_s1"]

CONDITIONS = [
    "spinal_canal_stenosis",
    "left_neural_foraminal_narrowing",
    "right_neural_foraminal_narrowing",
    "left_subarticular_stenosis",
    "right_subarticular_stenosis",
]

CONDITION_FAMILIES = {
    "spinal_canal_stenosis": "spinal_canal_stenosis",
    "left_neural_foraminal_narrowing": "neural_foraminal_narrowing",
    "right_neural_foraminal_narrowing": "neural_foraminal_narrowing",
    "left_subarticular_stenosis": "subarticular_stenosis",
    "right_subarticular_stenosis": "subarticular_stenosis",
}

CONDITION_LABELS = {
    "spinal_canal_stenosis": "Spinal canal stenosis",
    "left_neural_foraminal_narrowing": "Left neural foraminal narrowing",
    "right_neural_foraminal_narrowing": "Right neural foraminal narrowing",
    "left_subarticular_stenosis": "Left subarticular stenosis",
    "right_subarticular_stenosis": "Right subarticular stenosis",
}

MODALITY_WEIGHTS = {
    "spinal_canal_stenosis": {
        "sagittal t2/stir": 1.0,
        "sagittal t2": 0.9,
        "sagittal t1": 0.55,
        "axial t2": 0.45,
    },
    "left_neural_foraminal_narrowing": {
        "axial t2": 1.0,
        "sagittal t1": 0.8,
        "sagittal t2/stir": 0.7,
        "sagittal t2": 0.7,
    },
    "right_neural_foraminal_narrowing": {
        "axial t2": 1.0,
        "sagittal t1": 0.8,
        "sagittal t2/stir": 0.7,
        "sagittal t2": 0.7,
    },
    "left_subarticular_stenosis": {
        "axial t2": 1.0,
        "sagittal t2/stir": 0.6,
        "sagittal t2": 0.55,
        "sagittal t1": 0.35,
    },
    "right_subarticular_stenosis": {
        "axial t2": 1.0,
        "sagittal t2/stir": 0.6,
        "sagittal t2": 0.55,
        "sagittal t1": 0.35,
    },
}

INPUT_SETS = {
    "low": {"type": "trap", "points": [0.0, 0.0, 0.2, 0.45]},
    "medium": {"type": "tri", "points": [0.25, 0.5, 0.75]},
    "high": {"type": "trap", "points": [0.55, 0.8, 1.0, 1.0]},
}

OUTPUT_SETS = {
    "normal_mild": {"type": "trap", "points": [0.0, 0.0, 20.0, 45.0]},
    "moderate": {"type": "tri", "points": [30.0, 50.0, 70.0]},
    "severe": {"type": "trap", "points": [55.0, 75.0, 100.0, 100.0]},
}

RULE_BASE = [
    {"if": [("evidence", "high"), ("context", "high")], "then": "severe"},
    {"if": [("evidence", "high"), ("coverage", "high")], "then": "severe"},
    {"if": [("evidence", "high"), ("context", "medium")], "then": "severe"},
    {"if": [("evidence", "medium"), ("context", "high")], "then": "severe"},
    {
        "if": [("evidence", "medium"), ("context", "medium"), ("coverage", "high")],
        "then": "moderate",
    },
    {"if": [("evidence", "medium"), ("coverage", "medium")], "then": "moderate"},
    {"if": [("evidence", "medium"), ("context", "low")], "then": "moderate"},
    {"if": [("evidence", "high"), ("coverage", "low")], "then": "moderate"},
    {"if": [("context", "high"), ("coverage", "high")], "then": "moderate"},
    {"if": [("evidence", "low"), ("context", "medium")], "then": "moderate"},
    {"if": [("evidence", "low"), ("context", "low")], "then": "normal_mild"},
    {"if": [("evidence", "low"), ("coverage", "low")], "then": "normal_mild"},
    {"if": [("evidence", "low"), ("coverage", "medium")], "then": "normal_mild"},
]


@dataclass
class InferenceResult:
    score: float
    grade: str
    fuzzy_inputs: dict[str, dict[str, float]]
    rule_outputs: list[dict[str, float | str]]


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def triangular_membership(x: float, points: list[float]) -> float:
    a, b, c = points
    if x <= a or x >= c:
        return 0.0
    if x == b:
        return 1.0
    if x < b:
        return (x - a) / (b - a)
    return (c - x) / (c - b)


def trapezoidal_membership(x: float, points: list[float]) -> float:
    a, b, c, d = points
    if x <= a or x >= d:
        return 0.0
    if b <= x <= c:
        return 1.0
    if a < x < b:
        return (x - a) / (b - a)
    return (d - x) / (d - c)


def membership(x: float, set_definition: dict[str, Any]) -> float:
    if set_definition["type"] == "tri":
        return triangular_membership(x, set_definition["points"])
    return trapezoidal_membership(x, set_definition["points"])


def slugify(value: str | None) -> str:
    if not value:
        return ""
    return value.lower().replace("/", "_").replace(" ", "_")


def unique_count(values: list[str]) -> int:
    return len({value for value in values if value})


def build_coordinate_index(coordinates: list[dict[str, Any]]) -> dict[str, dict[str, list[dict[str, Any]]]]:
    exact: dict[str, list[dict[str, Any]]] = {}
    by_condition: dict[str, list[dict[str, Any]]] = {}
    by_family_and_level: dict[str, list[dict[str, Any]]] = {}

    for coordinate in coordinates:
        condition = slugify(coordinate.get("condition"))
        level = slugify(coordinate.get("level"))
        key = f"{condition}_{level}"
        family_key = f"{CONDITION_FAMILIES.get(condition, condition)}_{level}"

        exact.setdefault(key, []).append(coordinate)
        by_condition.setdefault(condition, []).append(coordinate)
        by_family_and_level.setdefault(family_key, []).append(coordinate)

    return {
        "exact": exact,
        "by_condition": by_condition,
        "by_family_and_level": by_family_and_level,
    }


def build_series_coverage(series: list[dict[str, Any]]) -> dict[str, float]:
    descriptions = [
        str(entry.get("description", "")).strip().lower()
        for entry in series
        if str(entry.get("description", "")).strip()
    ]

    coverage: dict[str, float] = {}
    for condition in CONDITIONS:
        score = 0.0
        for description in descriptions:
            for name, weight in MODALITY_WEIGHTS[condition].items():
                if name in description:
                    score = max(score, weight)
        coverage[condition] = score
    return coverage


def compute_inputs(
    target_condition: str,
    target_level: str,
    coordinate_indices: dict[str, dict[str, list[dict[str, Any]]]],
    coverage: dict[str, float],
) -> dict[str, float]:
    target_key = f"{target_condition}_{target_level}"
    exact_matches = coordinate_indices["exact"].get(target_key, [])
    condition_matches = coordinate_indices["by_condition"].get(target_condition, [])
    family_matches = coordinate_indices["by_family_and_level"].get(
        f"{CONDITION_FAMILIES[target_condition]}_{target_level}",
        [],
    )

    level_index = LEVELS.index(target_level)
    adjacent_levels = [LEVELS[index] for index in (level_index - 1, level_index + 1) if 0 <= index < len(LEVELS)]
    adjacent_match_count = sum(
        len(coordinate_indices["exact"].get(f"{target_condition}_{level}", []))
        for level in adjacent_levels
    )

    direct_evidence = clamp(len(exact_matches) / 2.0, 0.0, 1.0)
    neighborhood_support = clamp(
        (adjacent_match_count * 0.6 + max(len(family_matches) - len(exact_matches), 0) * 0.4) / 2.0,
        0.0,
        1.0,
    )
    breadth_support = clamp(
        unique_count([slugify(entry.get("level")) for entry in condition_matches]) / len(LEVELS),
        0.0,
        1.0,
    )
    context_support = clamp((neighborhood_support * 0.65) + (breadth_support * 0.35), 0.0, 1.0)

    return {
        "evidence": direct_evidence,
        "context": context_support,
        "coverage": coverage.get(target_condition, 0.0),
    }


def fuzzify_inputs(inputs: dict[str, float]) -> dict[str, dict[str, float]]:
    fuzzy_inputs: dict[str, dict[str, float]] = {}
    for variable_name, value in inputs.items():
        fuzzy_inputs[variable_name] = {
            set_name: membership(value, definition)
            for set_name, definition in INPUT_SETS.items()
        }
    return fuzzy_inputs


def evaluate_rules(fuzzy_inputs: dict[str, dict[str, float]]) -> list[dict[str, float | str]]:
    outputs: list[dict[str, float | str]] = []
    for rule in RULE_BASE:
        activation = min(fuzzy_inputs[var_name][set_name] for var_name, set_name in rule["if"])
        if activation > 0:
            outputs.append({"consequent": rule["then"], "activation": activation})
    return outputs


def aggregate_outputs(rule_outputs: list[dict[str, float | str]], samples: int = 201) -> list[dict[str, float]]:
    step = 100.0 / (samples - 1)
    aggregated: list[dict[str, float]] = []

    for index in range(samples):
        x = index * step
        mu = 0.0
        for rule in rule_outputs:
            clipped = min(float(rule["activation"]), membership(x, OUTPUT_SETS[str(rule["consequent"])]))
            mu = max(mu, clipped)
        aggregated.append({"x": x, "mu": mu})

    return aggregated


def centroid_defuzzification(aggregated: list[dict[str, float]]) -> float:
    numerator = sum(point["x"] * point["mu"] for point in aggregated)
    denominator = sum(point["mu"] for point in aggregated)
    if denominator == 0:
        return 0.0
    return numerator / denominator


def score_to_grade(score: float) -> str:
    if score >= 65:
        return "Severe"
    if score >= 40:
        return "Moderate"
    return "Normal/Mild"


def summarize_top_findings(results: list[dict[str, Any]]) -> str:
    ranked = sorted(results, key=lambda item: item["score"], reverse=True)[:3]
    ranked = [entry for entry in ranked if entry["score"] >= 40]

    if not ranked:
        return (
            "The coordinate evidence is sparse or weak across all targets, "
            "so the fuzzy system keeps the case in the Normal/Mild range."
        )

    summary = ", ".join(
        f"{CONDITION_LABELS[entry['condition']]} {entry['level'].upper().replace('_', '/')}"
        for entry in ranked
    )
    return (
        f"The strongest fuzzy activations cluster around {summary}, driven by direct coordinate "
        "evidence, neighboring-level support, and available MRI series coverage."
    )


def infer_target_severity(inputs: dict[str, float]) -> InferenceResult:
    fuzzy_inputs = fuzzify_inputs(inputs)
    rule_outputs = evaluate_rules(fuzzy_inputs)
    aggregated = aggregate_outputs(rule_outputs)
    score = centroid_defuzzification(aggregated)
    return InferenceResult(
        score=score,
        grade=score_to_grade(score),
        fuzzy_inputs=fuzzy_inputs,
        rule_outputs=rule_outputs,
    )


def grade_patient_with_fuzzy_logic(patient: dict[str, Any]) -> dict[str, Any]:
    coordinate_indices = build_coordinate_index(patient.get("coordinates", []))
    coverage = build_series_coverage(patient.get("series", []))
    grades: dict[str, str] = {}
    diagnostics: list[dict[str, Any]] = []

    for condition in CONDITIONS:
        for level in LEVELS:
            key = f"{condition}_{level}"
            inputs = compute_inputs(condition, level, coordinate_indices, coverage)
            inference = infer_target_severity(inputs)
            grades[key] = inference.grade
            diagnostics.append(
                {
                    "key": key,
                    "condition": condition,
                    "level": level,
                    "score": round(inference.score, 2),
                    "grade": inference.grade,
                    "inputs": {name: round(value, 3) for name, value in inputs.items()},
                    "activatedRules": [
                        {
                            "consequent": rule["consequent"],
                            "activation": round(float(rule["activation"]), 3),
                        }
                        for rule in inference.rule_outputs
                    ],
                }
            )

    severe_count = len([item for item in diagnostics if item["grade"] == "Severe"])
    moderate_count = len([item for item in diagnostics if item["grade"] == "Moderate"])
    explanation = (
        f"{summarize_top_findings(diagnostics)} "
        f"The Mamdani centroid defuzzifier produced {severe_count} severe and "
        f"{moderate_count} moderate target grades across the 25 lumbar findings."
    )

    return {
        "method": "mamdani-fuzzy-inference",
        "explanation": explanation,
        "grades": grades,
        "diagnostics": diagnostics,
    }

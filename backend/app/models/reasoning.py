from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum


class ReasoningStrategy(str, Enum):
    ASSOCIATION = "association"
    HYPOTHETICO = "hypothetico"
    CONSTRAINTS = "constraints"
    ARGUMENTS = "arguments"


class ReasoningStep(BaseModel):
    step_number: int
    description: str
    evidence: Optional[list[str]] = None
    supports: Optional[list[str]] = None
    opposes: Optional[list[str]] = None


class LinkedCondition(BaseModel):
    condition: str
    strength: float
    matching_findings: list[str]


class AssociationReasoning(BaseModel):
    strategy: Literal["association"]
    question_id: str
    steps: list[ReasoningStep]
    conclusion: str
    confidence: float
    correct_option: str
    key_findings: list[str]
    linked_conditions: list[LinkedCondition]


class Hypothesis(BaseModel):
    option: str
    hypothesis: str
    predictions: list[str]
    verified: bool
    falsified: bool


class HypotheticoReasoning(BaseModel):
    strategy: Literal["hypothetico"]
    question_id: str
    steps: list[ReasoningStep]
    conclusion: str
    confidence: float
    correct_option: str
    hypotheses: list[Hypothesis]


class Constraint(BaseModel):
    finding: str
    eliminates: list[str]
    reason: str


class ConstraintReasoning(BaseModel):
    strategy: Literal["constraints"]
    question_id: str
    steps: list[ReasoningStep]
    conclusion: str
    confidence: float
    correct_option: str
    constraints: list[Constraint]
    remaining_options: list[str]


class Argument(BaseModel):
    option: str
    pros: list[str]
    cons: list[str]
    net_score: int


class ArgumentReasoning(BaseModel):
    strategy: Literal["arguments"]
    question_id: str
    steps: list[ReasoningStep]
    conclusion: str
    confidence: float
    correct_option: str
    arguments: list[Argument]

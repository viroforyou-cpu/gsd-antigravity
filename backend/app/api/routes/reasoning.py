from fastapi import APIRouter, HTTPException
from typing import Union
from ...models.reasoning import (
    AssociationReasoning,
    HypotheticoReasoning,
    ConstraintReasoning,
    ArgumentReasoning,
    ReasoningStrategy,
)

router = APIRouter(prefix="/reasoning", tags=["reasoning"])

# Mock reasoning data (would come from LLM/database in production)
mock_reasoning_data = {
    "q001": {
        "association": {
            "strategy": "association",
            "question_id": "q001",
            "steps": [
                {
                    "step_number": 1,
                    "description": "Identify key clinical findings from the case presentation",
                    "evidence": ["4-month-old infant", "failure to thrive", "hepatosplenomegaly", "developmental regression", "cherry-red spot", "absent hexosaminidase A"],
                },
                {
                    "step_number": 2,
                    "description": "Map findings to potential conditions using knowledge graph",
                    "evidence": ["Tay-Sachs disease", "Niemann-Pick type A", "Gaucher disease"],
                },
                {
                    "step_number": 3,
                    "description": "Calculate association strengths based on finding-condition relationships",
                    "supports": ["B"],
                    "opposes": ["A", "C"],
                },
                {
                    "step_number": 4,
                    "description": "The finding of absent hexosaminidase A is pathognomonic for Tay-Sachs disease",
                    "supports": ["B"],
                    "evidence": ["HEXA gene mutation causes hexosaminidase A deficiency"],
                },
            ],
            "conclusion": "Tay-Sachs disease (Option B) has the strongest association with the clinical findings, particularly the pathognomonic absence of hexosaminidase A activity.",
            "confidence": 0.98,
            "correct_option": "B",
            "key_findings": ["Absent hexosaminidase A", "Cherry-red spot", "Developmental regression"],
            "linked_conditions": [
                {
                    "condition": "Tay-Sachs disease",
                    "strength": 0.98,
                    "matching_findings": ["cherry-red spot", "absent hex A", "developmental regression"],
                },
                {
                    "condition": "Niemann-Pick type A",
                    "strength": 0.45,
                    "matching_findings": ["cherry-red spot", "hepatosplenomegaly"],
                },
                {
                    "condition": "Gaucher disease",
                    "strength": 0.25,
                    "matching_findings": ["hepatosplenomegaly"],
                },
            ],
        },
        "hypothetico": {
            "strategy": "hypothetico",
            "question_id": "q001",
            "steps": [
                {"step_number": 1, "description": "Formulate hypotheses for each diagnostic option"},
                {"step_number": 2, "description": "Test each hypothesis against clinical findings"},
                {"step_number": 3, "description": "Evaluate hypothesis verification/falsification status"},
                {"step_number": 4, "description": "Select the hypothesis best supported by evidence", "supports": ["B"]},
            ],
            "conclusion": "The hypothesis of Tay-Sachs disease is verified by the finding of absent hexosaminidase A, while other hypotheses are falsified.",
            "confidence": 0.95,
            "correct_option": "B",
            "hypotheses": [
                {
                    "option": "A",
                    "hypothesis": "If Niemann-Pick type A, expect hepatosplenomegaly AND normal or elevated hexosaminidase A",
                    "predictions": ["Hepatosplenomegaly present", "Hexosaminidase A normal/elevated", "Sphingomyelinase deficiency"],
                    "verified": False,
                    "falsified": True,
                },
                {
                    "option": "B",
                    "hypothesis": "If Tay-Sachs disease, expect absent hexosaminidase A AND cherry-red spot WITHOUT hepatosplenomegaly",
                    "predictions": ["Absent hexosaminidase A", "Cherry-red spot present", "No organomegaly"],
                    "verified": True,
                    "falsified": False,
                },
                {
                    "option": "C",
                    "hypothesis": "If Gaucher disease, expect hepatosplenomegaly AND glucocerebrosidase deficiency",
                    "predictions": ["Hepatosplenomegaly", "Gaucher cells on biopsy", "Glucocerebrosidase deficient"],
                    "verified": False,
                    "falsified": True,
                },
                {
                    "option": "D",
                    "hypothesis": "If Fabry disease, expect alpha-galactosidase deficiency AND angiokeratomas",
                    "predictions": ["Angiokeratomas", "Renal involvement", "Alpha-galactosidase deficient"],
                    "verified": False,
                    "falsified": True,
                },
                {
                    "option": "E",
                    "hypothesis": "If Krabbe disease, expect galactocerebrosidase deficiency AND irritability",
                    "predictions": ["Irritability", "Spasticity", "Galactocerebrosidase deficient"],
                    "verified": False,
                    "falsified": True,
                },
            ],
        },
        "constraints": {
            "strategy": "constraints",
            "question_id": "q001",
            "steps": [
                {"step_number": 1, "description": "Identify constraints from clinical findings"},
                {"step_number": 2, "description": "Apply each constraint to eliminate incompatible options"},
                {"step_number": 3, "description": "Identify remaining viable options"},
                {"step_number": 4, "description": "Confirm final diagnosis", "supports": ["B"]},
            ],
            "conclusion": "Only Tay-Sachs disease satisfies all constraints. All other options are eliminated by the finding of absent hexosaminidase A.",
            "confidence": 0.99,
            "correct_option": "B",
            "constraints": [
                {
                    "finding": "Absent hexosaminidase A",
                    "eliminates": ["A", "C", "D", "E"],
                    "reason": "Niemann-Pick, Gaucher, Fabry, and Krabbe all have normal hexosaminidase A levels",
                },
                {
                    "finding": "Cherry-red spot",
                    "eliminates": ["C", "D", "E"],
                    "reason": "Gaucher, Fabry, and Krabbe do not typically present with cherry-red spot",
                },
                {
                    "finding": "No hepatosplenomegaly (implied by normal liver enzymes)",
                    "eliminates": ["A", "C"],
                    "reason": "Niemann-Pick and Gaucher typically present with significant organomegaly",
                },
            ],
            "remaining_options": ["B"],
        },
        "arguments": {
            "strategy": "arguments",
            "question_id": "q001",
            "steps": [
                {"step_number": 1, "description": "Construct arguments for and against each option"},
                {"step_number": 2, "description": "Weigh the strength of each argument"},
                {"step_number": 3, "description": "Calculate net argument score for each option"},
                {"step_number": 4, "description": "Select option with strongest net argument", "supports": ["B"]},
            ],
            "conclusion": "Tay-Sachs disease has the strongest net argument with definitive evidence (absent hex A) and no opposing findings.",
            "confidence": 0.97,
            "correct_option": "B",
            "arguments": [
                {"option": "A", "pros": ["Can present with cherry-red spot", "Infantile onset matches age"], "cons": ["Hepatosplenomegaly expected but not prominent", "Hexosaminidase A would be normal", "Sphingomyelinase would be deficient"], "net_score": -2},
                {"option": "B", "pros": ["Absent hexosaminidase A is diagnostic", "Cherry-red spot classic finding", "Developmental regression typical", "No organomegaly expected", "Age of onset matches perfectly"], "cons": [], "net_score": 5},
                {"option": "C", "pros": ["Can present in infancy"], "cons": ["Hepatosplenomegaly is hallmark", "Glucocerebrosidase would be deficient", "No cherry-red spot typically"], "net_score": -3},
                {"option": "D", "pros": ["X-linked lysosomal disorder"], "cons": ["Typically presents later", "Angiokeratomas expected", "Alpha-galactosidase deficient", "No cherry-red spot"], "net_score": -4},
                {"option": "E", "pros": ["Infantile neurodegenerative disorder"], "cons": ["Extreme irritability expected", "Galactocerebrosidase deficient", "No cherry-red spot typically"], "net_score": -3},
            ],
        },
    },
    "q002": {
        "association": {
            "strategy": "association",
            "question_id": "q002",
            "steps": [
                {"step_number": 1, "description": "Identify key clinical findings", "evidence": ["6-year-old boy", "progressive difficulty walking", "toe-walking", "calf pseudohypertrophy", "proximal muscle weakness", "CK 15,000 U/L"]},
                {"step_number": 2, "description": "Associate findings with muscular dystrophies", "supports": ["B"], "opposes": ["A", "C", "D", "E"]},
                {"step_number": 3, "description": "Calf pseudohypertrophy and markedly elevated CK are characteristic of Duchenne", "supports": ["B"]},
            ],
            "conclusion": "Duchenne muscular dystrophy has the strongest association given the classic triad: calf pseudohypertrophy, proximal weakness, and markedly elevated CK in a young boy.",
            "confidence": 0.96,
            "correct_option": "B",
            "key_findings": ["Calf pseudohypertrophy", "CK 15,000 U/L", "Proximal muscle weakness", "Male child"],
            "linked_conditions": [
                {"condition": "Duchenne muscular dystrophy", "strength": 0.96, "matching_findings": ["calf pseudohypertrophy", "proximal weakness", "toe-walking", "high CK", "male gender"]},
                {"condition": "Becker muscular dystrophy", "strength": 0.55, "matching_findings": ["proximal weakness", "male gender"]},
                {"condition": "Spinal muscular atrophy", "strength": 0.30, "matching_findings": ["proximal weakness"]},
            ],
        },
        "hypothetico": {
            "strategy": "hypothetico",
            "question_id": "q002",
            "steps": [
                {"step_number": 1, "description": "Formulate diagnostic hypotheses"},
                {"step_number": 2, "description": "Test hypotheses against clinical and laboratory findings"},
                {"step_number": 3, "description": "CK level of 15,000 is most consistent with Duchenne", "supports": ["B"]},
            ],
            "conclusion": "Duchenne muscular dystrophy hypothesis is verified by the combination of pseudohypertrophy, age of onset, and markedly elevated CK.",
            "confidence": 0.94,
            "correct_option": "B",
            "hypotheses": [
                {"option": "A", "hypothesis": "If SMA type 2, expect normal or mildly elevated CK and anterior horn cell signs", "predictions": ["Tongue fasciculations", "Areflexia", "CK normal/mildly elevated"], "verified": False, "falsified": True},
                {"option": "B", "hypothesis": "If DMD, expect very high CK, pseudohypertrophy, and X-linked inheritance pattern", "predictions": ["CK >10,000", "Calf pseudohypertrophy", "Gowers sign", "Male gender"], "verified": True, "falsified": False},
                {"option": "C", "hypothesis": "If Becker, expect later onset and milder course", "predictions": ["Onset after age 12", "Ambulation preserved longer", "CK elevated but lower"], "verified": False, "falsified": True},
                {"option": "D", "hypothesis": "If LGMD, expect autosomal inheritance and variable CK", "predictions": ["Autosomal inheritance", "Variable CK levels", "Equal male/female"], "verified": False, "falsified": True},
                {"option": "E", "hypothesis": "If myotonic dystrophy, expect myotonia and distal weakness", "predictions": ["Myotonia", "Distal > proximal weakness", "Cataracts", "Cardiac involvement"], "verified": False, "falsified": True},
            ],
        },
        "constraints": {
            "strategy": "constraints",
            "question_id": "q002",
            "steps": [
                {"step_number": 1, "description": "Apply constraint of markedly elevated CK (15,000 U/L)"},
                {"step_number": 2, "description": "Apply constraint of calf pseudohypertrophy"},
                {"step_number": 3, "description": "Apply constraint of age and gender"},
            ],
            "conclusion": "Only Duchenne MD satisfies all constraints: very high CK, pseudohypertrophy, and early onset in a male.",
            "confidence": 0.95,
            "correct_option": "B",
            "constraints": [
                {"finding": "CK 15,000 U/L (markedly elevated)", "eliminates": ["A", "E"], "reason": "SMA has normal/mildly elevated CK; myotonic dystrophy has mild elevation"},
                {"finding": "Calf pseudohypertrophy", "eliminates": ["A", "D", "E"], "reason": "Pseudohypertrophy is characteristic of dystrophinopathies (DMD/BMD)"},
                {"finding": "Age 6 with progressive symptoms since age 3", "eliminates": ["C"], "reason": "Becker typically has later onset (>12 years) and milder course"},
            ],
            "remaining_options": ["B"],
        },
        "arguments": {
            "strategy": "arguments",
            "question_id": "q002",
            "steps": [
                {"step_number": 1, "description": "Build argument case for each option"},
                {"step_number": 2, "description": "Weigh diagnostic criteria for dystrophinopathies"},
            ],
            "conclusion": "Duchenne MD has overwhelming support from pseudohypertrophy, CK level, age of onset, and gender.",
            "confidence": 0.95,
            "correct_option": "B",
            "arguments": [
                {"option": "A", "pros": ["Causes proximal weakness in children"], "cons": ["CK typically normal", "No pseudohypertrophy", "Tongue fasciculations expected"], "net_score": -2},
                {"option": "B", "pros": ["CK markedly elevated - classic", "Calf pseudohypertrophy - pathognomonic", "Age of onset typical", "X-linked inheritance fits male patient", "Progressive course expected"], "cons": [], "net_score": 5},
                {"option": "C", "pros": ["Same gene as DMD", "Can have pseudohypertrophy"], "cons": ["Later onset expected", "Milder CK elevation", "Better preserved ambulation"], "net_score": -1},
                {"option": "D", "pros": ["Can cause proximal weakness"], "cons": ["Autosomal inheritance", "No pseudohypertrophy typically", "Variable CK"], "net_score": -2},
                {"option": "E", "pros": ["Muscular dystrophy with weakness"], "cons": ["Distal weakness predominates", "Myotonia is hallmark", "CK only mildly elevated", "Autosomal dominant"], "net_score": -3},
            ],
        },
    },
}


ReasoningResult = Union[AssociationReasoning, HypotheticoReasoning, ConstraintReasoning, ArgumentReasoning]


@router.post("/analyze/{question_id}", response_model=list[ReasoningResult])
async def analyze_question(question_id: str):
    """Get all reasoning strategies for a question"""
    if question_id not in mock_reasoning_data:
        raise HTTPException(status_code=404, detail="No reasoning available for this question")

    data = mock_reasoning_data[question_id]
    return list(data.values())


@router.get("/{strategy}/{question_id}", response_model=ReasoningResult)
async def get_reasoning_by_strategy(question_id: str, strategy: ReasoningStrategy):
    """Get specific reasoning strategy for a question"""
    if question_id not in mock_reasoning_data:
        raise HTTPException(status_code=404, detail="No reasoning available for this question")

    data = mock_reasoning_data[question_id]
    if strategy.value not in data:
        raise HTTPException(status_code=404, detail=f"No {strategy} reasoning available for this question")

    return data[strategy.value]

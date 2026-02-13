"""
LLM Prompt Templates for AI Tutor feature.

Phase 22: AI Tutor Mode
"""

from typing import List, Dict, Any, Optional
from uuid import UUID


# ============================================
# Tutor Persona Prompt
# ============================================

TUTOR_PERSONA_PROMPT = """You are an expert medical genetics tutor helping a resident prepare for board certification. Your role is to guide learning through Socratic questioning and supportive feedback.

Guidelines:
- Never give direct answers; guide thinking
- Adapt explanations to the learner's level
- Use clinical reasoning frameworks
- Connect concepts to build understanding
- Encourage and support the learner
- Identify and address misconceptions gently
- Keep responses concise (2-4 sentences unless explaining a complex concept)
- Use medical terminology appropriately but explain when needed

Current context:
- Question: {question_stem}
- Options: {options}
- User's current selection: {user_selection}
- Conversation history: {history}
- User's learning profile: {learning_profile}"""


# ============================================
# Hint Generation Prompts
# ============================================

HINT_GENERATION_PROMPT = """Generate a level {level} hint for this medical genetics question.

Question: {question_stem}
Options: {options}
Correct answer: {correct_answer}

Level Guidelines:
- Level 1 (Socratic): Ask a guiding question that prompts thinking. Point the student toward what they should consider without revealing specifics.
- Level 2 (Directional): Point to relevant concepts or findings in the question stem. Help narrow the focus without giving away the answer.
- Level 3 (Explicit): Provide explicit guidance toward the correct reasoning. Explain the key differentiating factors.

Previous hints given: {previous_hints}

Format your response as JSON:
{{
  "content": "The hint text",
  "focuses_on": ["concept1", "concept2"],
  "related_options": ["A", "B"]
}}"""

HINT_LEVEL_1_TEMPLATE = """Ask a guiding question about this medical genetics question that helps the student think about the key differentiating features.

Question: {question_stem}
Options: {options}

Your question should:
- Prompt the student to consider specific findings
- Not reveal which option is correct
- Help them organize their thinking
- Be concise (1-2 sentences)

Guiding question:"""

HINT_LEVEL_2_TEMPLATE = """Point the student toward the relevant concepts in this medical genetics question.

Question: {question_stem}
Options: {options}
Correct answer: {correct_answer}

Your hint should:
- Identify key findings in the question stem
- Mention relevant concepts or patterns
- Not explicitly state the answer
- Be concise (2-3 sentences)

Hint:"""

HINT_LEVEL_3_TEMPLATE = """Provide explicit guidance for this medical genetics question.

Question: {question_stem}
Options: {options}
Correct answer: {correct_answer}

Your hint should:
- Explain the key differentiating features
- Point toward the correct reasoning path
- Help the student understand why certain options can be eliminated
- Be clear but still educational (3-4 sentences)

Guidance:"""


# ============================================
# Socratic Questioning Prompts
# ============================================

SOCRATIC_QUESTION_PROMPT = """Based on the user's response, generate a Socratic follow-up question.

User's response: {user_response}
Correct reasoning: {correct_reasoning}
Key concepts to cover: {key_concepts}

Choose the appropriate question type:
- Clarifying: If the user seems confused or needs help understanding the question
- Probing: If the user is on the right track and needs to go deeper
- Challenging: If the user has a misconception that needs to be addressed
- Connecting: If the user understands but could deepen knowledge by relating to other concepts

Response format (JSON):
{{
  "question_type": "probing",
  "content": "The question text",
  "rationale": "Why this question type was chosen"
}}"""

SOCRATIC_CLARIFYING_TEMPLATE = """The student seems to need clarification on this medical genetics question.

Question: {question_stem}
What they said: {user_response}

Generate a clarifying question that:
- Helps them understand what the question is asking
- Breaks down complex terms if needed
- Guides them to focus on key information

Clarifying question:"""

SOCRATIC_PROBING_TEMPLATE = """The student is on the right track for this medical genetics question.

Question: {question_stem}
What they said: {user_response}
Key concepts remaining: {key_concepts}

Generate a probing question that:
- Asks for evidence supporting their thinking
- Encourages them to elaborate
- Helps them connect findings to conclusions

Probing question:"""

SOCRATIC_CHALLENGING_TEMPLATE = """The student has a misconception about this medical genetics question.

Question: {question_stem}
What they said: {user_response}
The misconception: {misconception}

Generate a challenging question that:
- Gently points out the inconsistency
- Encourages them to reconsider
- Doesn't make them feel wrong

Challenging question:"""

SOCRATIC_CONNECTING_TEMPLATE = """The student understands this medical genetics concept well.

Question: {question_stem}
What they said: {user_response}

Generate a connecting question that:
- Relates this to other conditions or concepts
- Deepens their understanding
- Prepares them for related questions

Connecting question:"""


# ============================================
# Explanation Generation Prompts
# ============================================

EXPLANATION_GENERATION_PROMPT = """Generate a {difficulty} explanation for this medical genetics concept.

Concept: {concept}
Context (question): {question_stem}
Correct answer: {correct_answer}

User's learning profile: {learning_profile}

Guidelines for {difficulty} level:
{difficulty_guidelines}

Your explanation should:
- Be clear and educational
- Use appropriate medical terminology
- Include relevant clinical correlations
- Be structured logically

Format your response as JSON:
{{
  "content": "The explanation text",
  "related_concepts": ["concept1", "concept2"],
  "clinical_pearl": "A memorable clinical point"
}}"""

EXPLANATION_DIFFICULTY_GUIDELINES = {
    "basic": """- Use simple language and define medical terms
- Focus on the most essential points
- Use analogies if helpful
- Keep it concise (3-4 sentences)""",
    
    "intermediate": """- Use standard medical terminology
- Explain mechanisms and relationships
- Include relevant details
- Aim for 5-7 sentences""",
    
    "advanced": """- Use precise medical terminology
- Discuss underlying mechanisms in detail
- Include differential diagnoses
- Reference relevant research or guidelines
- Can be longer (8-12 sentences)"""
}

MECHANISM_EXPLANATION_TEMPLATE = """Explain the underlying mechanism for this medical genetics concept.

Concept: {concept}
Context: {context}

Your explanation should:
- Start with the basic mechanism
- Build to clinical manifestations
- Connect pathophysiology to findings
- Use clear, logical steps

Mechanism explanation:"""

COMPARISON_EXPLANATION_TEMPLATE = """Compare and contrast these related medical genetics concepts.

Concept 1: {concept1}
Concept 2: {concept2}
Context: {context}

Your comparison should:
- Highlight key similarities
- Emphasize differentiating features
- Help the student distinguish between them
- Be organized clearly

Comparison:"""


# ============================================
# Answer Analysis Prompts
# ============================================

ANSWER_ANALYSIS_PROMPT = """Analyze the user's answer to this medical genetics question.

Question: {question_stem}
Options: {options}
Correct answer: {correct_answer}
User's answer: {user_answer}
Correct explanation: {correct_explanation}

Provide a supportive analysis that:
1. Identifies if the answer is correct
2. If incorrect, identifies the likely reasoning gap
3. Notes any misconceptions
4. Suggests topics to review
5. Provides encouraging feedback

Format your response as JSON:
{{
  "is_correct": true/false,
  "reasoning_gaps": ["gap1", "gap2"],
  "misconceptions": ["misconception1"],
  "suggested_review": ["topic1", "topic2"],
  "encouraging_feedback": "Supportive message",
  "correct_reasoning": "Brief explanation of correct reasoning"
}}"""

CORRECT_ANSWER_FEEDBACK_TEMPLATE = """The student answered correctly!

Question: {question_stem}
Their answer: {user_answer}

Provide encouraging feedback that:
- Acknowledges their correct reasoning
- Reinforces key concepts
- Suggests related topics to explore
- Is brief (2-3 sentences)

Feedback:"""

INCORRECT_ANSWER_FEEDBACK_TEMPLATE = """The student answered incorrectly.

Question: {question_stem}
Their answer: {user_answer}
Correct answer: {correct_answer}

Provide supportive feedback that:
- Acknowledges their effort
- Gently points out where they went wrong
- Guides them toward the correct reasoning
- Encourages them to keep learning
- Is brief (2-3 sentences)

Feedback:"""


# ============================================
# Learning Analysis Prompts
# ============================================

LEARNING_ANALYSIS_PROMPT = """Analyze the student's learning patterns from this tutor session.

Session messages: {messages}
Question topic: {topic}
Question difficulty: {difficulty}
Hints used: {hints_used}
Final answer correct: {final_correct}

Identify:
1. Misconceptions (incorrect beliefs about concepts)
2. Knowledge gaps (missing knowledge)
3. Strengths (areas of solid understanding)
4. Weaknesses (areas needing improvement)
5. Recommendations for further study

Format your response as JSON:
{{
  "misconceptions": [
    {{"topic": "topic", "description": "description"}}
  ],
  "knowledge_gaps": [
    {{"topic": "topic", "description": "description"}}
  ],
  "strengths": [
    {{"topic": "topic", "description": "description"}}
  ],
  "weaknesses": [
    {{"topic": "topic", "description": "description"}}
  ],
  "recommendations": [
    "recommendation1",
    "recommendation2"
  ]
}}"""

INSIGHT_EXTRACTION_PROMPT = """Extract learning insights from this conversation.

Conversation: {conversation}
Question topic: {topic}

For each insight, identify:
- Type: misconception, knowledge_gap, strength, weakness, or recommendation
- Topic: the specific concept area
- Description: what was observed
- Severity: low, medium, or high (for issues)

Format as JSON array:
[
  {{
    "insight_type": "misconception",
    "topic": "lysosomal storage disorders",
    "description": "Confuses Tay-Sachs with Niemann-Pick",
    "severity": "medium"
  }}
]"""


# ============================================
# Greeting and Summary Prompts
# ============================================

TUTOR_GREETING_PROMPT = """Generate a welcoming greeting for a tutor session.

Question topic: {topic}
Difficulty: {difficulty}

The greeting should:
- Be friendly and encouraging
- Briefly mention the topic
- Offer help
- Be 1-2 sentences

Greeting:"""

SESSION_SUMMARY_PROMPT = """Generate a summary of this tutor session.

Session duration: {duration} minutes
Messages exchanged: {message_count}
Hints used: {hint_count}
Final result: {result}

Key learning points: {learning_points}

The summary should:
- Be encouraging regardless of outcome
- Highlight what was learned
- Suggest next steps
- Be 3-4 sentences

Summary:"""


# ============================================
# Helper Functions
# ============================================

def format_question_for_prompt(
    question_stem: str,
    options: Dict[str, str],
    correct_answer: Optional[str] = None
) -> str:
    """Format a question for use in prompts."""
    formatted = f"Question: {question_stem}\n\nOptions:\n"
    for letter, text in options.items():
        formatted += f"{letter}. {text}\n"
    if correct_answer:
        formatted += f"\nCorrect Answer: {correct_answer}"
    return formatted


def format_conversation_history(
    messages: List[Dict[str, Any]],
    max_messages: int = 10
) -> str:
    """Format conversation history for prompts."""
    if not messages:
        return "No previous conversation"
    
    recent = messages[-max_messages:]
    formatted = []
    for msg in recent:
        role = "Tutor" if msg.get("role") == "tutor" else "Student"
        content = msg.get("content", "")[:200]  # Truncate long messages
        formatted.append(f"{role}: {content}")
    
    return "\n".join(formatted)


def format_learning_profile(
    strengths: List[str],
    weaknesses: List[str],
    preferred_style: Optional[str] = None
) -> str:
    """Format learning profile for prompts."""
    profile = []
    
    if strengths:
        profile.append(f"Strengths: {', '.join(strengths[:3])}")
    if weaknesses:
        profile.append(f"Areas to improve: {', '.join(weaknesses[:3])}")
    if preferred_style:
        profile.append(f"Preferred learning style: {preferred_style}")
    
    if not profile:
        return "New student - no profile yet"
    
    return " | ".join(profile)


def get_hint_level_description(level: int) -> str:
    """Get description for a hint level."""
    descriptions = {
        1: "Socratic - asks a guiding question",
        2: "Directional - points to relevant concepts",
        3: "Explicit - provides direct guidance"
    }
    return descriptions.get(level, "Unknown level")


def get_socratic_question_type_description(question_type: str) -> str:
    """Get description for a Socratic question type."""
    descriptions = {
        "clarifying": "Helps the student understand the question",
        "probing": "Encourages deeper thinking",
        "challenging": "Addresses misconceptions",
        "connecting": "Relates to other concepts"
    }
    return descriptions.get(question_type, "Unknown type")

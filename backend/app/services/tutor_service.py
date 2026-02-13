"""
Tutor Service - Main orchestration for AI Tutor feature.

Phase 22: AI Tutor Mode
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4
import json
import structlog

from ..core.config import settings
from ..models.tutor import (
    TutorSession, TutorSessionCreate, TutorSessionWithMessages,
    TutorSessionSummary, TutorSessionEndRequest, TutorSessionEndResponse,
    TutorMessage, TutorMessageCreate,
    Hint, HintRequest, HintResponse,
    Explanation, ExplanationRequest, ExplanationResponse,
    AnswerAnalysis, AnswerAnalysisRequest, AnswerAnalysisResponse,
    LearningInsight, LearningInsightCreate,
    HintUsageCreate, HintUsageStats,
    UserQuestionRequest, TutorResponse,
    SocraticQuestion
)
from .tutor_repository import tutor_repository
from .tutor_prompts import (
    TUTOR_PERSONA_PROMPT,
    HINT_GENERATION_PROMPT,
    HINT_LEVEL_1_TEMPLATE,
    HINT_LEVEL_2_TEMPLATE,
    HINT_LEVEL_3_TEMPLATE,
    SOCRATIC_QUESTION_PROMPT,
    EXPLANATION_GENERATION_PROMPT,
    ANSWER_ANALYSIS_PROMPT,
    LEARNING_ANALYSIS_PROMPT,
    TUTOR_GREETING_PROMPT,
    SESSION_SUMMARY_PROMPT,
    format_question_for_prompt,
    format_conversation_history,
    format_learning_profile,
    EXPLANATION_DIFFICULTY_GUIDELINES
)
from .llm_service import llm_service

logger = structlog.get_logger()


class TutorService:
    """Main service for AI Tutor functionality."""
    
    MAX_HINTS_PER_SESSION = 3
    
    def __init__(self):
        self.repository = tutor_repository
        self._use_mock = settings.use_mock_data
    
    # ============================================
    # Session Management
    # ============================================
    
    async def start_session(
        self,
        user_id: str,
        question_id: str,
        practice_session_id: Optional[str] = None
    ) -> TutorSessionWithMessages:
        """Start a new tutor session."""
        # Create session
        session_create = TutorSessionCreate(
            question_id=UUID(question_id),
            session_id=UUID(practice_session_id) if practice_session_id else None
        )
        
        session = await self.repository.create_session(user_id, session_create)
        
        # Generate greeting message
        greeting = await self._generate_greeting(question_id)
        
        # Add greeting as first message
        greeting_message = TutorMessageCreate(
            role='tutor',
            content=greeting,
            message_type='greeting'
        )
        await self.repository.add_message(str(session.id), greeting_message)
        
        # Return session with messages
        return await self.repository.get_session_with_messages(str(session.id))  # type: ignore
    
    async def get_session(self, session_id: str) -> Optional[TutorSessionWithMessages]:
        """Get a tutor session with messages."""
        return await self.repository.get_session_with_messages(session_id)
    
    async def end_session(
        self,
        session_id: str,
        final_answer: Optional[str] = None
    ) -> TutorSessionEndResponse:
        """End a tutor session and generate summary."""
        session = await self.repository.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Analyze learning
        insights = await self._analyze_session(session_id, str(session.user_id))
        
        # End session
        ended_session = await self.repository.end_session(session_id, final_answer)
        
        # Generate summary
        summary = await self._generate_session_summary(session_id)
        
        return TutorSessionEndResponse(
            summary=summary,
            insights=insights
        )
    
    # ============================================
    # Hint Generation
    # ============================================
    
    async def get_hint(
        self,
        session_id: str,
        level: Optional[int] = None
    ) -> HintResponse:
        """Generate a hint for the current question."""
        session = await self.repository.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        if session.hint_count >= self.MAX_HINTS_PER_SESSION:
            raise ValueError("Maximum hints reached for this session")
        
        # Determine hint level
        if level is None:
            level = self._determine_hint_level(session.hint_count)
        
        # Generate hint
        hint = await self._generate_hint(
            str(session.question_id),
            level,
            session_id
        )
        
        # Track hint usage
        await self.repository.track_hint_usage(HintUsageCreate(
            user_id=session.user_id,
            question_id=session.question_id,
            session_id=session.id,
            hint_level=level
        ))
        
        # Add hint message to conversation
        hint_message = TutorMessageCreate(
            role='tutor',
            content=hint.content,
            message_type='hint'
        )
        await self.repository.add_message(session_id, hint_message)
        
        return HintResponse(
            hint=hint,
            hint_count=session.hint_count + 1,
            max_hints=self.MAX_HINTS_PER_SESSION
        )
    
    def _determine_hint_level(self, current_hint_count: int) -> int:
        """Determine the appropriate hint level."""
        # Start with level 1, progress to higher levels
        return min(current_hint_count + 1, 3)
    
    async def _generate_hint(
        self,
        question_id: str,
        level: int,
        session_id: str
    ) -> Hint:
        """Generate a hint using LLM or mock."""
        # Get previous hints for context
        messages = await self.repository.get_messages(session_id)
        previous_hints = [
            m.content for m in messages
            if m.message_type == 'hint'
        ]
        
        if self._use_mock:
            return self._get_mock_hint(level, previous_hints)
        
        try:
            # Get question data
            question = await self._get_question(question_id)
            
            # Build prompt based on level
            if level == 1:
                prompt = HINT_LEVEL_1_TEMPLATE.format(
                    question_stem=question.get('stem', ''),
                    options=json.dumps(question.get('options', {}))
                )
            elif level == 2:
                prompt = HINT_LEVEL_2_TEMPLATE.format(
                    question_stem=question.get('stem', ''),
                    options=json.dumps(question.get('options', {})),
                    correct_answer=question.get('correct_answer', '')
                )
            else:
                prompt = HINT_LEVEL_3_TEMPLATE.format(
                    question_stem=question.get('stem', ''),
                    options=json.dumps(question.get('options', {})),
                    correct_answer=question.get('correct_answer', '')
                )
            
            # Call LLM
            response = await llm_service.generate_explanation(
                {"stem": question.get('stem', '')},
                question.get('correct_answer', '')
            )
            
            # Parse response
            return Hint(
                id=uuid4(),
                level=level,
                content=response[:500] if response else "Consider the key findings in the question.",
                focuses_on=[],
                related_options=None
            )
        except Exception as e:
            logger.error(f"Error generating hint: {e}")
            return self._get_mock_hint(level, previous_hints)
    
    def _get_mock_hint(self, level: int, previous_hints: List[str]) -> Hint:
        """Get a mock hint for development."""
        mock_hints = {
            1: Hint(
                id=uuid4(),
                level=1,
                content="What findings in the question stem might help you distinguish between lysosomal storage disorders?",
                focuses_on=["lysosomal storage disorders", "differential diagnosis"],
                related_options=None
            ),
            2: Hint(
                id=uuid4(),
                level=2,
                content="The cherry-red spot is a key finding. Which lysosomal storage disorders commonly present with this finding in infancy?",
                focuses_on=["cherry-red spot", "infantile presentation"],
                related_options=["A", "B"]
            ),
            3: Hint(
                id=uuid4(),
                level=3,
                content="Tay-Sachs disease presents with cherry-red spot, developmental regression, and exaggerated startle response. The Ashkenazi Jewish heritage is a risk factor. Note the absence of hepatosplenomegaly, which would suggest Niemann-Pick instead.",
                focuses_on=["Tay-Sachs", "hexosaminidase A deficiency", "Ashkenazi Jewish"],
                related_options=["B"]
            )
        }
        return mock_hints.get(level, mock_hints[1])
    
    # ============================================
    # Question Handling
    # ============================================
    
    async def ask_question(
        self,
        session_id: str,
        user_question: str
    ) -> TutorResponse:
        """Process a user question and generate a tutor response."""
        session = await self.repository.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Add user message
        user_message = TutorMessageCreate(
            role='user',
            content=user_question,
            message_type='question'
        )
        await self.repository.add_message(session_id, user_message)
        
        # Generate response
        response_content = await self._generate_response(
            str(session.question_id),
            user_question,
            session_id
        )
        
        # Add tutor response message
        tutor_message = TutorMessageCreate(
            role='tutor',
            content=response_content,
            message_type='guidance'
        )
        saved_message = await self.repository.add_message(session_id, tutor_message)
        
        # Optionally generate Socratic follow-up
        socratic = await self._generate_socratic_followup(
            str(session.question_id),
            user_question,
            session_id
        )
        
        return TutorResponse(
            message=saved_message,
            socratic_question=socratic,
            suggested_actions=self._get_suggested_actions(session)
        )
    
    async def _generate_response(
        self,
        question_id: str,
        user_question: str,
        session_id: str
    ) -> str:
        """Generate a tutor response to a user question."""
        if self._use_mock:
            return self._get_mock_response(user_question)
        
        try:
            question = await self._get_question(question_id)
            messages = await self.repository.get_messages(session_id)
            
            # Build context
            prompt = TUTOR_PERSONA_PROMPT.format(
                question_stem=question.get('stem', ''),
                options=json.dumps(question.get('options', {})),
                user_selection='None yet',
                history=format_conversation_history([m.model_dump() for m in messages]),
                learning_profile='New student'
            )
            
            # Use LLM to generate response
            response = await llm_service.generate_explanation(
                {"stem": user_question},
                ""
            )
            
            return response if response else self._get_mock_response(user_question)
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return self._get_mock_response(user_question)
    
    def _get_mock_response(self, user_question: str) -> str:
        """Get a mock response for development."""
        question_lower = user_question.lower()
        
        if 'cherry-red' in question_lower:
            return "The cherry-red spot is an important ophthalmologic finding. It occurs when there's lipid accumulation in the retinal ganglion cells, making the macula appear red against a pale background. Can you think of which conditions commonly present with this finding?"
        
        if 'enzyme' in question_lower or 'deficiency' in question_lower:
            return "Enzyme deficiencies are key to diagnosing lysosomal storage disorders. Each disorder has a specific enzyme that's deficient. What clinical findings might help you narrow down which enzyme to consider?"
        
        if 'difference' in question_lower or 'distinguish' in question_lower:
            return "Great question! To distinguish between similar conditions, we need to look for differentiating features. What findings in the question stem might help separate these options?"
        
        return "That's a thoughtful question. Let me guide you through this. What key findings in the question stem stand out to you as most significant?"
    
    async def _generate_socratic_followup(
        self,
        question_id: str,
        user_response: str,
        session_id: str
    ) -> Optional[SocraticQuestion]:
        """Generate a Socratic follow-up question."""
        if self._use_mock:
            return SocraticQuestion(
                question_type='probing',
                content="What evidence from the question stem supports your thinking?",
                rationale="The student is on the right track and should elaborate on their reasoning."
            )
        
        # In production, this would use the LLM
        return None
    
    def _get_suggested_actions(self, session: TutorSession) -> List[str]:
        """Get suggested actions for the user."""
        actions = []
        
        if session.hint_count < self.MAX_HINTS_PER_SESSION:
            actions.append("Request a hint")
        actions.append("Ask about a specific concept")
        actions.append("Submit your answer")
        
        return actions
    
    # ============================================
    # Explanation Generation
    # ============================================
    
    async def explain_concept(
        self,
        session_id: str,
        concept: str,
        difficulty: Optional[str] = None
    ) -> ExplanationResponse:
        """Generate a personalized explanation."""
        session = await self.repository.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Determine difficulty
        if difficulty is None:
            difficulty = self._determine_explanation_difficulty(session)
        
        # Generate explanation
        explanation = await self._generate_explanation(
            str(session.question_id),
            concept,
            difficulty
        )
        
        # Add explanation message
        explanation_message = TutorMessageCreate(
            role='tutor',
            content=explanation.content,
            message_type='explanation'
        )
        await self.repository.add_message(session_id, explanation_message)
        
        return ExplanationResponse(explanation=explanation)
    
    def _determine_explanation_difficulty(self, session: TutorSession) -> str:
        """Determine appropriate explanation difficulty."""
        # Could be based on user's learning profile
        # For now, default to intermediate
        return 'intermediate'
    
    async def _generate_explanation(
        self,
        question_id: str,
        concept: str,
        difficulty: str
    ) -> Explanation:
        """Generate an explanation using LLM or mock."""
        if self._use_mock:
            return self._get_mock_explanation(concept, difficulty)
        
        try:
            question = await self._get_question(question_id)
            
            prompt = EXPLANATION_GENERATION_PROMPT.format(
                difficulty=difficulty,
                concept=concept,
                question_stem=question.get('stem', ''),
                correct_answer=question.get('correct_answer', ''),
                learning_profile='New student',
                difficulty_guidelines=EXPLANATION_DIFFICULTY_GUIDELINES.get(difficulty, '')
            )
            
            response = await llm_service.generate_explanation(
                {"stem": concept},
                ""
            )
            
            return Explanation(
                concept=concept,
                content=response if response else f"Explanation of {concept}",
                difficulty=difficulty,  # type: ignore
                related_questions=[],
                visual_aids=[]
            )
        except Exception as e:
            logger.error(f"Error generating explanation: {e}")
            return self._get_mock_explanation(concept, difficulty)
    
    def _get_mock_explanation(self, concept: str, difficulty: str) -> Explanation:
        """Get a mock explanation for development."""
        explanations = {
            'basic': Explanation(
                concept=concept,
                content=f"{concept} is a fundamental concept in medical genetics. It refers to the process by which genetic information is expressed and affects cellular function. Understanding this helps explain many clinical presentations you'll encounter.",
                difficulty='basic',
                related_questions=[],
                visual_aids=[]
            ),
            'intermediate': Explanation(
                concept=concept,
                content=f"{concept} involves multiple molecular mechanisms. At the cellular level, it affects protein synthesis and function. Clinically, this manifests as specific signs and symptoms that help with diagnosis. The pathophysiology connects the genetic basis to the clinical presentation.",
                difficulty='intermediate',
                related_questions=[],
                visual_aids=[]
            ),
            'advanced': Explanation(
                concept=concept,
                content=f"{concept} represents a complex interplay of genetic and molecular factors. The underlying mechanism involves specific enzyme deficiencies that lead to substrate accumulation. This accumulation causes cellular dysfunction through multiple pathways, including lysosomal rupture, impaired autophagy, and secondary metabolic effects. The clinical phenotype reflects the specific tissues affected and the temporal pattern of substrate accumulation.",
                difficulty='advanced',
                related_questions=[],
                visual_aids=[]
            )
        }
        return explanations.get(difficulty, explanations['intermediate'])
    
    # ============================================
    # Answer Analysis
    # ============================================
    
    async def analyze_answer(
        self,
        session_id: str,
        answer: str
    ) -> AnswerAnalysisResponse:
        """Analyze a user's answer."""
        session = await self.repository.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Get question
        question = await self._get_question(str(session.question_id))
        correct_answer = question.get('correct_answer', '')
        is_correct = answer.upper() == correct_answer.upper()
        
        # Generate analysis
        analysis = await self._generate_answer_analysis(
            question,
            answer,
            correct_answer,
            is_correct
        )
        
        # Add feedback message
        feedback_message = TutorMessageCreate(
            role='tutor',
            content=analysis.encouraging_feedback,
            message_type='feedback'
        )
        await self.repository.add_message(session_id, feedback_message)
        
        # Track insights
        if not is_correct:
            await self._track_misconception(
                str(session.user_id),
                question.get('category', ''),
                analysis.misconceptions
            )
        
        return AnswerAnalysisResponse(
            analysis=analysis,
            session_ended=False
        )
    
    async def _generate_answer_analysis(
        self,
        question: Dict[str, Any],
        user_answer: str,
        correct_answer: str,
        is_correct: bool
    ) -> AnswerAnalysis:
        """Generate analysis of the user's answer."""
        if self._use_mock:
            return self._get_mock_analysis(is_correct, user_answer, correct_answer)
        
        try:
            prompt = ANSWER_ANALYSIS_PROMPT.format(
                question_stem=question.get('stem', ''),
                options=json.dumps(question.get('options', {})),
                correct_answer=correct_answer,
                user_answer=user_answer,
                correct_explanation=question.get('explanation', '')
            )
            
            response = await llm_service.generate_explanation(
                {"stem": prompt},
                ""
            )
            
            # Parse JSON response
            try:
                data = json.loads(response) if response else {}
            except json.JSONDecodeError:
                data = {}
            
            return AnswerAnalysis(
                is_correct=is_correct,
                reasoning_gaps=data.get('reasoning_gaps', []),
                misconceptions=data.get('misconceptions', []),
                suggested_review=data.get('suggested_review', []),
                encouraging_feedback=data.get('encouraging_feedback', self._get_default_feedback(is_correct)),
                correct_reasoning=data.get('correct_reasoning') if not is_correct else None
            )
        except Exception as e:
            logger.error(f"Error analyzing answer: {e}")
            return self._get_mock_analysis(is_correct, user_answer, correct_answer)
    
    def _get_mock_analysis(
        self,
        is_correct: bool,
        user_answer: str,
        correct_answer: str
    ) -> AnswerAnalysis:
        """Get mock analysis for development."""
        if is_correct:
            return AnswerAnalysis(
                is_correct=True,
                reasoning_gaps=[],
                misconceptions=[],
                suggested_review=[],
                encouraging_feedback="Excellent work! Your reasoning demonstrates a solid understanding of the key concepts. The cherry-red spot and developmental regression correctly led you to the lysosomal storage disorder category, and you appropriately considered the demographic information.",
                correct_reasoning=None
            )
        else:
            return AnswerAnalysis(
                is_correct=False,
                reasoning_gaps=["Differentiating between lysosomal storage disorders with similar presentations"],
                misconceptions=["Confusing Tay-Sachs with Niemann-Pick based on cherry-red spot alone"],
                suggested_review=["Lysosomal storage disorders comparison", "Enzyme deficiencies and their clinical correlates"],
                encouraging_feedback="Good effort! You correctly identified the cherry-red spot as important. The key differentiator here is the absence of hepatosplenomegaly, which would suggest Niemann-Pick. Let's review the distinguishing features of these conditions.",
                correct_reasoning="Tay-Sachs disease is characterized by hexosaminidase A deficiency, causing GM2 ganglioside accumulation. Key features include cherry-red spot, developmental regression, and exaggerated startle response WITHOUT hepatosplenomegaly (which would suggest Niemann-Pick)."
            )
    
    def _get_default_feedback(self, is_correct: bool) -> str:
        """Get default feedback message."""
        if is_correct:
            return "Great job! Your answer is correct."
        return "Not quite, but good effort. Let's review the key concepts."
    
    async def _track_misconception(
        self,
        user_id: str,
        topic: str,
        misconceptions: List[str]
    ) -> None:
        """Track identified misconceptions as learning insights."""
        for misconception in misconceptions:
            # Check if this insight already exists
            existing = await self.repository.increment_insight_occurrence(
                user_id,
                'misconception',
                topic
            )
            
            if not existing:
                # Create new insight
                await self.repository.create_insight(
                    user_id,
                    LearningInsightCreate(
                        insight_type='misconception',
                        topic=topic,
                        description=misconception,
                        severity='medium'
                    )
                )
    
    # ============================================
    # Learning Analysis
    # ============================================
    
    async def _analyze_session(
        self,
        session_id: str,
        user_id: str
    ) -> List[LearningInsight]:
        """Analyze the session and generate learning insights."""
        session = await self.repository.get_session(session_id)
        messages = await self.repository.get_messages(session_id)
        
        if not session:
            return []
        
        if self._use_mock:
            return self._get_mock_insights(user_id)
        
        try:
            # Build analysis prompt
            prompt = LEARNING_ANALYSIS_PROMPT.format(
                messages=format_conversation_history([m.model_dump() for m in messages]),
                topic='Medical Genetics',
                difficulty='medium',
                hints_used=session.hint_count,
                final_correct=True  # Would need to track this
            )
            
            # Use LLM for analysis
            response = await llm_service.generate_explanation(
                {"stem": prompt},
                ""
            )
            
            # Parse and create insights
            try:
                data = json.loads(response) if response else {}
            except json.JSONDecodeError:
                data = {}
            
            insights = []
            
            # Create misconception insights
            for item in data.get('misconceptions', []):
                insight = await self.repository.create_insight(
                    user_id,
                    LearningInsightCreate(
                        insight_type='misconception',
                        topic=item.get('topic', ''),
                        description=item.get('description', ''),
                        severity='medium'
                    )
                )
                insights.append(insight)
            
            # Create knowledge gap insights
            for item in data.get('knowledge_gaps', []):
                insight = await self.repository.create_insight(
                    user_id,
                    LearningInsightCreate(
                        insight_type='knowledge_gap',
                        topic=item.get('topic', ''),
                        description=item.get('description', ''),
                        severity='medium'
                    )
                )
                insights.append(insight)
            
            return insights
        except Exception as e:
            logger.error(f"Error analyzing session: {e}")
            return self._get_mock_insights(user_id)
    
    def _get_mock_insights(self, user_id: str) -> List[LearningInsight]:
        """Get mock insights for development."""
        return [
            LearningInsight(
                id=uuid4(),
                user_id=UUID(user_id),
                insight_type='knowledge_gap',
                topic='Lysosomal Storage Disorders',
                description='Could benefit from reviewing the differentiating features of Tay-Sachs vs Niemann-Pick',
                severity='low',
                first_identified=datetime.utcnow(),
                last_updated=datetime.utcnow(),
                occurrence_count=1,
                resolved=False
            )
        ]
    
    # ============================================
    # Helper Methods
    # ============================================
    
    async def _generate_greeting(self, question_id: str) -> str:
        """Generate a greeting for a new session."""
        if self._use_mock:
            return "Hello! I'm here to help you work through this question. I'll guide you with hints and questions rather than giving you the answer directly. What aspects of this case would you like to explore first?"
        
        try:
            question = await self._get_question(question_id)
            prompt = TUTOR_GREETING_PROMPT.format(
                topic=question.get('category', 'Medical Genetics'),
                difficulty=question.get('difficulty', 'medium')
            )
            
            response = await llm_service.generate_explanation(
                {"stem": prompt},
                ""
            )
            
            return response if response else "Hello! I'm here to help you work through this question. What would you like to explore?"
        except Exception:
            return "Hello! I'm here to help you work through this question. What would you like to explore?"
    
    async def _generate_session_summary(self, session_id: str) -> TutorSessionSummary:
        """Generate a summary of the session."""
        session = await self.repository.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        duration_seconds = 0
        if session.ended_at and session.started_at:
            duration_seconds = int((session.ended_at - session.started_at).total_seconds())
        
        return TutorSessionSummary(
            id=session.id,
            question_id=session.question_id,
            started_at=session.started_at,
            ended_at=session.ended_at or datetime.utcnow(),
            duration_seconds=duration_seconds,
            hint_count=session.hint_count,
            message_count=session.message_count,
            insights_generated=len(session.learning_insights),
            key_learnings=["Reviewed lysosomal storage disorders", "Practiced differential diagnosis"]
        )
    
    async def _get_question(self, question_id: str) -> Dict[str, Any]:
        """Get question data."""
        # Import here to avoid circular dependency
        from .question_repository import question_repository
        
        question = await question_repository.get_by_id(question_id)
        if question:
            return question.model_dump()
        return {}
    
    # ============================================
    # History and Dashboard
    # ============================================
    
    async def get_history(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> tuple[List[Any], int]:
        """Get tutor session history for a user."""
        sessions = await self.repository.get_user_sessions(user_id, limit, offset)
        # Total count would need a separate query
        total_count = len(sessions)  # Simplified
        return sessions, total_count
    
    async def get_insights(
        self,
        user_id: str,
        insight_type: Optional[str] = None,
        resolved: Optional[bool] = None
    ) -> List[LearningInsight]:
        """Get learning insights for a user."""
        return await self.repository.get_user_insights(
            user_id,
            insight_type=insight_type,
            resolved=resolved
        )
    
    async def get_dashboard_stats(self, user_id: str):
        """Get dashboard statistics for a user."""
        return await self.repository.get_dashboard_stats(user_id)


# Singleton instance
tutor_service = TutorService()

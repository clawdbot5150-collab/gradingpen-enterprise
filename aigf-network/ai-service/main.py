"""
AIGFNetwork AI Service
Handles AI personality management, conversation generation, and real-time feedback.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import uvicorn
from datetime import datetime
import logging
import os
from enum import Enum

from services.personality_service import PersonalityService
from services.conversation_service import ConversationService
from services.feedback_service import FeedbackService
from services.assessment_service import AssessmentService
from models.ai_models import AIModelManager
from utils.logger import get_logger
from utils.database import DatabaseManager

# Initialize logging
logger = get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AIGFNetwork AI Service",
    description="AI-powered conversation and feedback service for social confidence training",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
personality_service = PersonalityService()
conversation_service = ConversationService()
feedback_service = FeedbackService()
assessment_service = AssessmentService()
ai_model_manager = AIModelManager()
db_manager = DatabaseManager()

# Pydantic models
class PersonalityType(str, Enum):
    EXTROVERT = "EXTROVERT"
    INTROVERT = "INTROVERT"
    EMPATH = "EMPATH"
    INTELLECTUAL = "INTELLECTUAL"
    COMEDIAN = "COMEDIAN"
    PROFESSIONAL = "PROFESSIONAL"
    CREATIVE = "CREATIVE"
    MENTOR = "MENTOR"

class MessageRequest(BaseModel):
    session_id: str
    user_message: str
    conversation_history: List[Dict[str, Any]]
    personality_id: str
    scenario_id: Optional[str] = None

class InitialMessageRequest(BaseModel):
    session_id: str
    personality_id: str
    scenario_id: Optional[str] = None
    user_profile: Optional[Dict[str, Any]] = None

class FeedbackRequest(BaseModel):
    session_id: str
    messages: List[Dict[str, Any]]
    session_type: str = "PRACTICE"
    difficulty_level: int = 1

class AssessmentRequest(BaseModel):
    user_id: str
    assessment_type: str
    conversation_data: List[Dict[str, Any]]
    session_context: Optional[Dict[str, Any]] = None

class PersonalityConfig(BaseModel):
    name: str
    display_name: str
    base_type: PersonalityType
    traits: Dict[str, float]
    communication_style: Dict[str, str]
    background: Dict[str, Any]
    system_prompt: str
    conversation_starters: List[str]

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "aigf-ai-service",
        "version": "1.0.0"
    }

# AI Conversation Endpoints
@app.post("/api/conversation/initial-message")
async def generate_initial_message(request: InitialMessageRequest):
    """Generate initial conversation message based on personality and scenario"""
    try:
        logger.info(f"Generating initial message for session {request.session_id}")
        
        personality = await personality_service.get_personality(request.personality_id)
        if not personality:
            raise HTTPException(status_code=404, detail="Personality not found")
        
        scenario = None
        if request.scenario_id:
            scenario = await personality_service.get_scenario(request.scenario_id)
        
        initial_message = await conversation_service.generate_initial_message(
            personality=personality,
            scenario=scenario,
            user_profile=request.user_profile,
            session_id=request.session_id
        )
        
        return {
            "content": initial_message["content"],
            "sentiment": initial_message.get("sentiment", "neutral"),
            "confidence": initial_message.get("confidence", 0.8),
            "topics": initial_message.get("topics", []),
            "personality_context": {
                "name": personality["display_name"],
                "type": personality["base_type"],
                "traits": personality["traits"]
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating initial message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate initial message")

@app.post("/api/conversation/response")
async def generate_response(request: MessageRequest):
    """Generate AI response to user message"""
    try:
        logger.info(f"Generating response for session {request.session_id}")
        
        personality = await personality_service.get_personality(request.personality_id)
        if not personality:
            raise HTTPException(status_code=404, detail="Personality not found")
        
        scenario = None
        if request.scenario_id:
            scenario = await personality_service.get_scenario(request.scenario_id)
        
        response = await conversation_service.generate_response(
            user_message=request.user_message,
            conversation_history=request.conversation_history,
            personality=personality,
            scenario=scenario,
            session_id=request.session_id
        )
        
        # Analyze conversation flow
        flow_analysis = await conversation_service.analyze_conversation_flow(
            request.conversation_history + [{"content": request.user_message, "sender": "USER"}]
        )
        
        return {
            "content": response["content"],
            "sentiment": response.get("sentiment", "neutral"),
            "confidence": response.get("confidence", 0.8),
            "topics": response.get("topics", []),
            "emotions": response.get("emotions", []),
            "conversation_flow": flow_analysis,
            "personality_adaptation": response.get("personality_adaptation", {})
        }
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate response")

# Feedback Endpoints
@app.post("/api/feedback/real-time")
async def generate_real_time_feedback(request: FeedbackRequest):
    """Generate real-time feedback during conversation"""
    try:
        logger.info(f"Generating real-time feedback for session {request.session_id}")
        
        feedback = await feedback_service.generate_real_time_feedback(
            session_id=request.session_id,
            messages=request.messages,
            session_type=request.session_type
        )
        
        return feedback
        
    except Exception as e:
        logger.error(f"Error generating real-time feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate real-time feedback")

@app.post("/api/feedback/comprehensive")
async def generate_comprehensive_feedback(request: FeedbackRequest):
    """Generate comprehensive post-session feedback report"""
    try:
        logger.info(f"Generating comprehensive feedback for session {request.session_id}")
        
        feedback_report = await feedback_service.generate_comprehensive_feedback(
            session_id=request.session_id,
            messages=request.messages,
            session_type=request.session_type,
            difficulty_level=request.difficulty_level
        )
        
        return feedback_report
        
    except Exception as e:
        logger.error(f"Error generating comprehensive feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate comprehensive feedback")

# Assessment Endpoints
@app.post("/api/assessment/analyze")
async def analyze_conversation_skills(request: AssessmentRequest):
    """Analyze conversation skills and provide detailed assessment"""
    try:
        logger.info(f"Analyzing conversation skills for user {request.user_id}")
        
        assessment_result = await assessment_service.analyze_skills(
            user_id=request.user_id,
            assessment_type=request.assessment_type,
            conversation_data=request.conversation_data,
            session_context=request.session_context
        )
        
        return assessment_result
        
    except Exception as e:
        logger.error(f"Error analyzing conversation skills: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze conversation skills")

@app.post("/api/assessment/baseline")
async def conduct_baseline_assessment(user_id: str, background_tasks: BackgroundTasks):
    """Conduct baseline assessment for new user"""
    try:
        logger.info(f"Conducting baseline assessment for user {user_id}")
        
        # Start background assessment process
        background_tasks.add_task(
            assessment_service.conduct_baseline_assessment,
            user_id
        )
        
        return {
            "message": "Baseline assessment started",
            "user_id": user_id,
            "status": "in_progress"
        }
        
    except Exception as e:
        logger.error(f"Error starting baseline assessment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start baseline assessment")

# Personality Management Endpoints
@app.get("/api/personalities")
async def get_all_personalities():
    """Get all available AI personalities"""
    try:
        personalities = await personality_service.get_all_personalities()
        return {"personalities": personalities}
        
    except Exception as e:
        logger.error(f"Error fetching personalities: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch personalities")

@app.get("/api/personalities/{personality_id}")
async def get_personality(personality_id: str):
    """Get specific AI personality"""
    try:
        personality = await personality_service.get_personality(personality_id)
        if not personality:
            raise HTTPException(status_code=404, detail="Personality not found")
        
        return personality
        
    except Exception as e:
        logger.error(f"Error fetching personality {personality_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch personality")

@app.post("/api/personalities")
async def create_personality(config: PersonalityConfig):
    """Create new AI personality"""
    try:
        personality = await personality_service.create_personality(config.dict())
        return {
            "message": "Personality created successfully",
            "personality": personality
        }
        
    except Exception as e:
        logger.error(f"Error creating personality: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create personality")

@app.put("/api/personalities/{personality_id}")
async def update_personality(personality_id: str, config: PersonalityConfig):
    """Update existing AI personality"""
    try:
        personality = await personality_service.update_personality(personality_id, config.dict())
        if not personality:
            raise HTTPException(status_code=404, detail="Personality not found")
        
        return {
            "message": "Personality updated successfully",
            "personality": personality
        }
        
    except Exception as e:
        logger.error(f"Error updating personality {personality_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update personality")

# Model Management Endpoints
@app.get("/api/models/status")
async def get_model_status():
    """Get status of all AI models"""
    try:
        status = await ai_model_manager.get_models_status()
        return status
        
    except Exception as e:
        logger.error(f"Error getting model status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get model status")

@app.post("/api/models/optimize")
async def optimize_model_selection(background_tasks: BackgroundTasks):
    """Optimize model selection based on performance metrics"""
    try:
        background_tasks.add_task(ai_model_manager.optimize_model_selection)
        
        return {
            "message": "Model optimization started",
            "status": "in_progress"
        }
        
    except Exception as e:
        logger.error(f"Error starting model optimization: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start model optimization")

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting AIGFNetwork AI Service...")
    
    # Initialize database connections
    await db_manager.connect()
    
    # Initialize AI models
    await ai_model_manager.initialize()
    
    # Load personalities
    await personality_service.load_personalities()
    
    logger.info("AIGFNetwork AI Service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AIGFNetwork AI Service...")
    
    # Close database connections
    await db_manager.disconnect()
    
    # Cleanup AI models
    await ai_model_manager.cleanup()
    
    logger.info("AIGFNetwork AI Service shut down successfully")

if __name__ == "__main__":
    # Run the service
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVICE_PORT", "8000")),
        reload=os.getenv("ENV") == "development",
        log_level="info"
    )
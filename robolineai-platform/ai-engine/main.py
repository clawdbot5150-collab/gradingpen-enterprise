#!/usr/bin/env python3
"""
RoboLineAI - AI Engine Service

This service provides AI-powered automation capabilities including:
- Computer Vision & OCR
- Natural Language Processing 
- Document Intelligence
- Process Mining
- Predictive Analytics
- Machine Learning Models
"""

import os
import sys
import asyncio
import uvicorn
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
from prometheus_client import generate_latest, Counter, Histogram, Gauge
import time

# Add project root to path
sys.path.append(str(Path(__file__).parent))

# Import services
from src.services.computer_vision_service import ComputerVisionService
from src.services.ocr_service import OCRService
from src.services.nlp_service import NLPService
from src.services.document_intelligence_service import DocumentIntelligenceService
from src.services.process_mining_service import ProcessMiningService
from src.services.ml_model_service import MLModelService
from src.services.automation_service import AutomationService

# Import models
from src.models.ai_models import (
    OCRRequest, OCRResponse,
    ComputerVisionRequest, ComputerVisionResponse,
    NLPRequest, NLPResponse,
    DocumentAnalysisRequest, DocumentAnalysisResponse,
    ProcessAnalysisRequest, ProcessAnalysisResponse,
    PredictionRequest, PredictionResponse,
    AutomationRequest, AutomationResponse
)

# Import utilities
from src.utils.config import settings
from src.utils.logger import setup_logger
from src.utils.auth import verify_api_key
from src.utils.metrics import setup_metrics

# Setup logging
logger = setup_logger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter('ai_engine_requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_LATENCY = Histogram('ai_engine_request_duration_seconds', 'Request latency')
ACTIVE_CONNECTIONS = Gauge('ai_engine_active_connections', 'Active connections')

# Global service instances
services = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management for the FastAPI app"""
    logger.info("Starting RoboLineAI AI Engine...")
    
    # Initialize services
    global services
    services = {
        'computer_vision': ComputerVisionService(),
        'ocr': OCRService(),
        'nlp': NLPService(),
        'document_intelligence': DocumentIntelligenceService(),
        'process_mining': ProcessMiningService(),
        'ml_models': MLModelService(),
        'automation': AutomationService(),
    }
    
    # Initialize all services
    for name, service in services.items():
        logger.info(f"Initializing {name} service...")
        try:
            await service.initialize()
            logger.info(f"✅ {name} service initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize {name} service: {e}")
            raise
    
    logger.info("🚀 AI Engine initialized successfully!")
    
    yield
    
    # Cleanup
    logger.info("Shutting down AI Engine...")
    for name, service in services.items():
        logger.info(f"Shutting down {name} service...")
        try:
            await service.shutdown()
        except Exception as e:
            logger.error(f"Error shutting down {name} service: {e}")
    
    logger.info("AI Engine shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="RoboLineAI AI Engine",
    description="AI-powered automation engine with computer vision, NLP, and machine learning capabilities",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Request middleware for metrics
@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    ACTIVE_CONNECTIONS.inc()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    REQUEST_LATENCY.observe(duration)
    ACTIVE_CONNECTIONS.dec()
    
    return response

# Health endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            name: await service.health_check() 
            for name, service in services.items()
        }
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type="text/plain")

# Computer Vision endpoints
@app.post("/api/v1/computer-vision/analyze", response_model=ComputerVisionResponse)
async def analyze_image(
    request: ComputerVisionRequest,
    api_key: str = Depends(verify_api_key)
):
    """Analyze image using computer vision models"""
    try:
        service = services['computer_vision']
        result = await service.analyze_image(
            image_data=request.image_data,
            analysis_types=request.analysis_types,
            confidence_threshold=request.confidence_threshold
        )
        return ComputerVisionResponse(**result)
    except Exception as e:
        logger.error(f"Computer vision analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/computer-vision/detect-ui-elements")
async def detect_ui_elements(
    image: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)
):
    """Detect UI elements in screenshots for RPA automation"""
    try:
        image_data = await image.read()
        service = services['computer_vision']
        result = await service.detect_ui_elements(image_data)
        return result
    except Exception as e:
        logger.error(f"UI element detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# OCR endpoints  
@app.post("/api/v1/ocr/extract-text", response_model=OCRResponse)
async def extract_text(
    request: OCRRequest,
    api_key: str = Depends(verify_api_key)
):
    """Extract text from images using OCR"""
    try:
        service = services['ocr']
        result = await service.extract_text(
            image_data=request.image_data,
            languages=request.languages,
            preprocessing=request.preprocessing,
            confidence_threshold=request.confidence_threshold
        )
        return OCRResponse(**result)
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/ocr/extract-structured-data")
async def extract_structured_data(
    image: UploadFile = File(...),
    template: str = "invoice",
    api_key: str = Depends(verify_api_key)
):
    """Extract structured data from documents (invoices, forms, etc.)"""
    try:
        image_data = await image.read()
        service = services['ocr']
        result = await service.extract_structured_data(image_data, template)
        return result
    except Exception as e:
        logger.error(f"Structured data extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NLP endpoints
@app.post("/api/v1/nlp/analyze", response_model=NLPResponse)
async def analyze_text(
    request: NLPRequest,
    api_key: str = Depends(verify_api_key)
):
    """Analyze text using NLP models"""
    try:
        service = services['nlp']
        result = await service.analyze_text(
            text=request.text,
            analysis_types=request.analysis_types,
            language=request.language
        )
        return NLPResponse(**result)
    except Exception as e:
        logger.error(f"NLP analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/nlp/classify-email")
async def classify_email(
    subject: str,
    body: str,
    attachments: list[str] = [],
    api_key: str = Depends(verify_api_key)
):
    """Classify email content and suggest automation actions"""
    try:
        service = services['nlp']
        result = await service.classify_email(subject, body, attachments)
        return result
    except Exception as e:
        logger.error(f"Email classification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Document Intelligence endpoints
@app.post("/api/v1/documents/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(
    request: DocumentAnalysisRequest,
    api_key: str = Depends(verify_api_key)
):
    """Intelligent document processing and analysis"""
    try:
        service = services['document_intelligence']
        result = await service.analyze_document(
            document_data=request.document_data,
            document_type=request.document_type,
            extract_tables=request.extract_tables,
            extract_forms=request.extract_forms
        )
        return DocumentAnalysisResponse(**result)
    except Exception as e:
        logger.error(f"Document analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/documents/extract-entities")
async def extract_document_entities(
    document: UploadFile = File(...),
    entity_types: list[str] = ["person", "organization", "location", "date", "money"],
    api_key: str = Depends(verify_api_key)
):
    """Extract named entities from documents"""
    try:
        document_data = await document.read()
        service = services['document_intelligence']
        result = await service.extract_entities(document_data, entity_types)
        return result
    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Process Mining endpoints
@app.post("/api/v1/process-mining/analyze", response_model=ProcessAnalysisResponse)
async def analyze_process(
    request: ProcessAnalysisRequest,
    api_key: str = Depends(verify_api_key)
):
    """Analyze business process from logs"""
    try:
        service = services['process_mining']
        result = await service.analyze_process(
            log_data=request.log_data,
            case_id_column=request.case_id_column,
            activity_column=request.activity_column,
            timestamp_column=request.timestamp_column
        )
        return ProcessAnalysisResponse(**result)
    except Exception as e:
        logger.error(f"Process analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/process-mining/discover-workflow")
async def discover_workflow(
    logs: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)
):
    """Discover workflow patterns from system logs"""
    try:
        log_data = await logs.read()
        service = services['process_mining']
        result = await service.discover_workflow(log_data)
        return result
    except Exception as e:
        logger.error(f"Workflow discovery failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Machine Learning endpoints
@app.post("/api/v1/ml/predict", response_model=PredictionResponse)
async def make_prediction(
    request: PredictionRequest,
    api_key: str = Depends(verify_api_key)
):
    """Make predictions using trained ML models"""
    try:
        service = services['ml_models']
        result = await service.predict(
            model_id=request.model_id,
            input_data=request.input_data,
            model_version=request.model_version
        )
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"ML prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/ml/anomaly-detection")
async def detect_anomalies(
    data: list[dict],
    model_type: str = "isolation_forest",
    api_key: str = Depends(verify_api_key)
):
    """Detect anomalies in process execution data"""
    try:
        service = services['ml_models']
        result = await service.detect_anomalies(data, model_type)
        return result
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Automation endpoints
@app.post("/api/v1/automation/execute", response_model=AutomationResponse)
async def execute_automation(
    request: AutomationRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """Execute AI-powered automation task"""
    try:
        service = services['automation']
        
        if request.async_execution:
            # Execute in background
            background_tasks.add_task(
                service.execute_automation,
                automation_type=request.automation_type,
                parameters=request.parameters,
                callback_url=request.callback_url
            )
            return AutomationResponse(
                task_id=f"task_{time.time()}",
                status="queued",
                message="Automation task queued for background execution"
            )
        else:
            # Execute synchronously
            result = await service.execute_automation(
                automation_type=request.automation_type,
                parameters=request.parameters
            )
            return AutomationResponse(**result)
            
    except Exception as e:
        logger.error(f"Automation execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/automation/status/{task_id}")
async def get_automation_status(
    task_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get status of automation task"""
    try:
        service = services['automation']
        result = await service.get_task_status(task_id)
        return result
    except Exception as e:
        logger.error(f"Failed to get task status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "timestamp": time.time()}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "timestamp": time.time()}
    )

if __name__ == "__main__":
    # Development server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        access_log=True,
        log_config=None  # Use our custom logging
    )
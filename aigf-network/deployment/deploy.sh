#!/bin/bash

# AIGFNetwork Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Configuration
PROJECT_NAME="aigf-network"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-registry.digitalocean.com}"
DOCKER_IMAGE_TAG="${DOCKER_IMAGE_TAG:-latest}"
DEPLOY_ENVIRONMENT="${DEPLOY_ENVIRONMENT:-production}"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required commands exist
    local required_commands=("docker" "docker-compose" "git" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        log_error ".env file not found. Please copy .env.example to .env and configure it."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build backend image
    log_info "Building backend image..."
    docker build \
        --target production \
        --tag "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${DOCKER_IMAGE_TAG}" \
        --tag "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest" \
        ./backend
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build \
        --target production \
        --tag "${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${DOCKER_IMAGE_TAG}" \
        --tag "${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:latest" \
        ./frontend
    
    log_success "Docker images built successfully"
}

# Push images to registry
push_images() {
    log_info "Pushing images to registry..."
    
    # Push backend image
    docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${DOCKER_IMAGE_TAG}"
    docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest"
    
    # Push frontend image
    docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${DOCKER_IMAGE_TAG}"
    docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:latest"
    
    log_success "Images pushed to registry successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if database is accessible
    if ! docker-compose exec -T postgres pg_isready -q; then
        log_error "Database is not accessible"
        exit 1
    fi
    
    # Run migrations
    docker-compose run --rm backend npm run db:migrate
    
    log_success "Database migrations completed"
}

# Health check function
health_check() {
    local service_url=$1
    local service_name=$2
    local timeout=${3:-60}
    
    log_info "Checking health of $service_name..."
    
    local count=0
    while [[ $count -lt $timeout ]]; do
        if curl -f -s "$service_url" &> /dev/null; then
            log_success "$service_name is healthy"
            return 0
        fi
        
        sleep 5
        count=$((count + 5))
        log_info "Waiting for $service_name... ($count/$timeout seconds)"
    done
    
    log_error "$service_name health check failed after $timeout seconds"
    return 1
}

# Deploy services
deploy_services() {
    log_info "Deploying services..."
    
    # Create backup of current deployment (if exists)
    if docker-compose ps | grep -q "Up"; then
        log_info "Creating backup of current deployment..."
        docker-compose config > docker-compose.backup.yml
    fi
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose pull
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose down
    
    # Start database first
    log_info "Starting database..."
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    run_migrations
    
    # Start all services
    log_info "Starting all services..."
    docker-compose --profile production up -d
    
    log_success "Services deployed"
}

# Perform health checks
perform_health_checks() {
    log_info "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if ! health_check "http://localhost:5000/health" "Backend API" 120; then
        return 1
    fi
    
    # Check frontend health
    if ! health_check "http://localhost:3000" "Frontend" 60; then
        return 1
    fi
    
    # Check database connection
    if ! docker-compose exec -T backend node -e "
        const { Pool } = require('pg');
        const pool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        pool.query('SELECT 1').then(() => {
            console.log('Database connection successful');
            process.exit(0);
        }).catch((err) => {
            console.error('Database connection failed:', err);
            process.exit(1);
        });
    "; then
        log_error "Database connection check failed"
        return 1
    fi
    
    log_success "All health checks passed"
    return 0
}

# Rollback function
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    if [[ -f "docker-compose.backup.yml" ]]; then
        # Stop current deployment
        docker-compose down
        
        # Restore previous deployment
        mv docker-compose.backup.yml docker-compose.yml
        docker-compose up -d
        
        log_info "Deployment rolled back to previous version"
    else
        log_warning "No backup found, manual intervention required"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove backup file if deployment was successful
    if [[ -f "docker-compose.backup.yml" && "$DEPLOYMENT_SUCCESS" == "true" ]]; then
        rm docker-compose.backup.yml
    fi
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting AIGFNetwork deployment..."
    log_info "Environment: $DEPLOY_ENVIRONMENT"
    log_info "Image tag: $DOCKER_IMAGE_TAG"
    
    # Check prerequisites
    check_prerequisites
    
    # Build and push images (skip in local development)
    if [[ "$DEPLOY_ENVIRONMENT" != "development" ]]; then
        build_images
        
        if [[ -n "$DOCKER_REGISTRY" ]]; then
            push_images
        fi
    fi
    
    # Deploy services
    deploy_services
    
    # Perform health checks
    if perform_health_checks; then
        export DEPLOYMENT_SUCCESS="true"
        log_success "Deployment completed successfully!"
        
        # Display useful information
        echo ""
        log_info "Service URLs:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend API: http://localhost:5000"
        echo "  API Documentation: http://localhost:5000/docs"
        echo "  Database Admin: http://localhost:8080 (dev only)"
        echo "  Redis Admin: http://localhost:8081 (dev only)"
        echo ""
        log_info "To view logs: docker-compose logs -f"
        log_info "To stop services: docker-compose down"
        
    else
        log_error "Deployment failed health checks"
        
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback_deployment
        fi
        
        exit 1
    fi
    
    # Cleanup
    cleanup
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
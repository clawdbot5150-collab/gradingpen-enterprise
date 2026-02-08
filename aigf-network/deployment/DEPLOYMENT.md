# AIGFNetwork Deployment Guide

## Overview

This guide covers deploying AIGFNetwork in various environments, from development to production.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for AI service development)
- PostgreSQL 15+ (if running without Docker)
- Redis 7+ (if running without Docker)

## Environment Variables

Create `.env` files in the root directory:

### Required Environment Variables

```bash
# API Keys (Required)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional AI Model Keys
COHERE_API_KEY=your_cohere_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Email Service (Optional - for notifications)
EMAIL_SERVICE_API_KEY=your_email_service_key_here
EMAIL_FROM_ADDRESS=noreply@aigfnetwork.com

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
POSTHOG_API_KEY=your_posthog_key_here

# External Services (Optional)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Development Setup

### 1. Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd aigf-network

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run seed

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# AI Service: http://localhost:8000
```

### 2. Local Development Setup

```bash
# Install dependencies for all services
npm run install:all

# Set up database
npm run db:setup

# Start development servers
npm run dev

# Or start services individually:
npm run dev:frontend   # Port 3000
npm run dev:backend    # Port 3001
npm run dev:ai         # Port 8000
```

## Production Deployment

### 1. Docker Compose Production

```bash
# Use production profile
docker-compose --profile production up -d

# Or with custom compose file
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Kubernetes Deployment

```bash
# Apply Kubernetes configurations
kubectl apply -f deployment/k8s/namespace.yaml
kubectl apply -f deployment/k8s/secrets.yaml
kubectl apply -f deployment/k8s/configmap.yaml
kubectl apply -f deployment/k8s/postgres.yaml
kubectl apply -f deployment/k8s/redis.yaml
kubectl apply -f deployment/k8s/backend.yaml
kubectl apply -f deployment/k8s/ai-service.yaml
kubectl apply -f deployment/k8s/frontend.yaml
kubectl apply -f deployment/k8s/ingress.yaml
```

### 3. Cloud Deployment

#### AWS ECS

```bash
# Build and push images
./scripts/build-and-push.sh

# Deploy with AWS CLI
aws ecs update-service --cluster aigf-cluster --service aigf-backend --force-new-deployment
aws ecs update-service --cluster aigf-cluster --service aigf-ai-service --force-new-deployment
```

#### Google Cloud Run

```bash
# Deploy backend
gcloud run deploy aigf-backend \
  --image gcr.io/PROJECT_ID/aigf-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy AI service
gcloud run deploy aigf-ai-service \
  --image gcr.io/PROJECT_ID/aigf-ai-service:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Database Setup

### Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run seed
```

### Backup and Restore

```bash
# Backup
./scripts/backup-database.sh

# Restore
./scripts/restore-database.sh backup-file.sql
```

## Monitoring and Observability

### Enable Monitoring Stack

```bash
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Access monitoring services:
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3002 (admin/aigf_grafana_password_2024)
```

### Application Metrics

The application exposes metrics at:
- Backend: `http://localhost:3001/metrics`
- AI Service: `http://localhost:8000/metrics`

### Health Checks

- Backend: `http://localhost:3001/health`
- AI Service: `http://localhost:8000/health`
- Frontend: `http://localhost:3000/api/health`

## Security Configuration

### SSL/TLS Setup

```bash
# Generate self-signed certificates (development)
./scripts/generate-ssl-certs.sh

# Use Let's Encrypt (production)
./scripts/setup-letsencrypt.sh your-domain.com
```

### Security Headers

NGINX configuration includes:
- HSTS headers
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Rate limiting

## Performance Optimization

### Caching Strategy

- **Redis**: Session storage, real-time data
- **CDN**: Static assets (images, fonts, JS/CSS)
- **Database**: Query result caching
- **Application**: In-memory caching for AI models

### Scaling Considerations

1. **Horizontal Scaling**: Multiple backend instances behind load balancer
2. **Database Scaling**: Read replicas for analytics queries
3. **AI Service Scaling**: GPU instances for model inference
4. **CDN**: Global content distribution

## Backup Strategy

### Automated Backups

```bash
# Set up automated backups
crontab -e

# Add backup jobs:
0 2 * * * /path/to/aigf-network/scripts/backup-database.sh
0 3 * * 0 /path/to/aigf-network/scripts/backup-full.sh
```

### Recovery Procedures

1. **Database Recovery**: Point-in-time recovery from backups
2. **Application Recovery**: Blue-green deployments
3. **Data Recovery**: User data export/import capabilities

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database status
   docker-compose ps postgres
   docker-compose logs postgres
   ```

2. **AI Service Startup Issues**
   ```bash
   # Check AI service logs
   docker-compose logs ai-service
   
   # Verify model downloads
   docker-compose exec ai-service ls -la /app/models
   ```

3. **Memory Issues**
   ```bash
   # Monitor memory usage
   docker stats
   
   # Increase memory limits in docker-compose.yml
   ```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=aigf:*
export LOG_LEVEL=debug

# Start with debug output
docker-compose up --build
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm update
   pip install --upgrade -r requirements.txt
   ```

2. **Security Updates**
   ```bash
   # Update base images
   docker-compose pull
   docker-compose up -d --build
   ```

3. **Database Maintenance**
   ```bash
   # Analyze database performance
   npm run db:analyze
   
   # Vacuum and reindex
   npm run db:maintenance
   ```

### Scheduled Maintenance

- **Weekly**: Security updates and dependency updates
- **Monthly**: Full system backup verification
- **Quarterly**: Performance review and optimization

## Support

For deployment issues:
1. Check the logs: `docker-compose logs [service-name]`
2. Verify environment variables
3. Check network connectivity between services
4. Review resource usage (CPU, memory, disk)

## Version History

- **v1.0.0**: Initial production release
- **v1.1.0**: Enhanced AI personalities and feedback system
- **v1.2.0**: Mobile app integration and offline capabilities

---

**Note**: Always test deployments in a staging environment before production deployment.
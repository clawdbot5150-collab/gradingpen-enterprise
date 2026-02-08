# Deployment Guide - Law Trust Platform

This guide covers deploying the Law Trust Platform to production with high availability, security, and compliance.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Production Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│  CDN (CloudFlare)                                               │
│  └── Next.js Frontend (Vercel/AWS)                             │
│      └── GraphQL API (Node.js + Express)                       │
│          ├── PostgreSQL (Primary Database)                     │
│          ├── Redis (Cache & Sessions)                          │
│          ├── Elasticsearch (Search & Analytics)                │
│          ├── AWS S3 (File Storage)                             │
│          └── External Services:                                │
│              ├── OpenAI (AI Analysis)                          │
│              ├── Twilio (SMS/Voice)                            │
│              ├── SendGrid (Email)                              │
│              ├── Stripe (Payments)                             │
│              └── Monitoring (DataDog/New Relic)               │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Options

### Option 1: AWS Full Stack (Recommended for Scale)

#### Infrastructure as Code (Terraform)

```hcl
# infrastructure/main.tf
provider "aws" {
  region = var.aws_region
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "law-trust-vpc"
  }
}

# ECS Cluster for Backend
resource "aws_ecs_cluster" "main" {
  name = "law-trust-cluster"

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 1
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier = "law-trust-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.large"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type         = "gp3"
  storage_encrypted    = true
  
  db_name  = "law_trust"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "law-trust-final-snapshot"
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  
  tags = {
    Name = "law-trust-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "law-trust-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "law-trust-redis"
  description               = "Redis cluster for Law Trust"
  
  node_type                 = "cache.t3.medium"
  port                      = 6379
  parameter_group_name      = "default.redis7"
  
  num_cache_clusters        = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = var.redis_auth_token
  
  tags = {
    Name = "law-trust-redis"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "law-trust-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = true
  enable_http2              = true
  enable_waf_fail_open      = false

  tags = {
    Name = "law-trust-alb"
  }
}

# S3 Bucket for File Storage
resource "aws_s3_bucket" "uploads" {
  bucket = "law-trust-uploads-${random_string.bucket_suffix.result}"

  tags = {
    Name = "law-trust-uploads"
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "law-trust-alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Law Trust CDN"
  default_root_object = "index.html"

  aliases = ["law-trust.com", "www.law-trust.com"]

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "law-trust-alb"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "CA"]
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate_validation.main.certificate_arn
    ssl_support_method  = "sni-only"
  }
}
```

#### ECS Task Definition

```json
{
  "family": "law-trust-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/law-trust-task-role",
  "containerDefinitions": [
    {
      "name": "law-trust-api",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/law-trust-backend:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/law-trust",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "4000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:law-trust/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:law-trust/redis-url"
        },
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:law-trust/openai-key"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Option 2: Vercel + PlanetScale (Quick Start)

```bash
# Deploy frontend to Vercel
npm install -g vercel
vercel --prod

# Deploy backend to Railway/Render
git push origin main
```

## 🔐 Security Configuration

### SSL/TLS Certificates

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name law-trust.com www.law-trust.com;
    
    ssl_certificate /etc/ssl/certs/law-trust.com.crt;
    ssl_certificate_key /etc/ssl/private/law-trust.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline';" always;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Variables

```bash
# Production environment variables
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://user:password@law-trust-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432/law_trust
REDIS_URL=redis://law-trust-redis.xyz.cache.amazonaws.com:6379

# External APIs
OPENAI_API_KEY=sk-xxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
SENDGRID_API_KEY=SG.xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# Security
JWT_SECRET=super-secure-jwt-secret-key-production
ENCRYPTION_KEY=32-byte-encryption-key-for-sensitive-data

# File Storage
AWS_ACCESS_KEY_ID=AKIAXXXXX
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET=law-trust-uploads

# Monitoring
DATADOG_API_KEY=xxxxx
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Feature flags
EMERGENCY_BANNER=false
MAINTENANCE_MODE=false
AI_QUALIFICATION_ENABLED=true
```

## 📊 Monitoring & Alerts

### DataDog Configuration

```yaml
# datadog.yaml
api_key: ${DATADOG_API_KEY}
site: datadoghq.com

logs_enabled: true
process_config:
  enabled: true

apm_config:
  enabled: true
  env: production

# Custom metrics
integrations:
  postgres:
    host: law-trust-db.cluster-xyz.us-east-1.rds.amazonaws.com
    port: 5432
    username: datadog
    password: ${POSTGRES_DATADOG_PASSWORD}
    
  redis:
    host: law-trust-redis.xyz.cache.amazonaws.com
    port: 6379
    
  nginx:
    nginx_status_url: http://localhost/nginx_status/
```

### Health Check Endpoints

```typescript
// health-check.ts
export const healthChecks = {
  '/health': basicHealth,
  '/health/detailed': detailedHealth,
  '/health/ready': readinessCheck,
};

async function basicHealth(req, res) {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
}

async function detailedHealth(req, res) {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkElasticsearch(),
    checkExternalAPIs(),
  ]);
  
  const health = {
    status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      redis: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      elasticsearch: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      externalAPIs: checks[3].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    },
  };
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:coverage
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Login to Amazon ECR
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push backend image
      run: |
        docker build -t law-trust-backend ./backend
        docker tag law-trust-backend:latest $ECR_REGISTRY/law-trust-backend:latest
        docker tag law-trust-backend:latest $ECR_REGISTRY/law-trust-backend:$GITHUB_SHA
        docker push $ECR_REGISTRY/law-trust-backend:latest
        docker push $ECR_REGISTRY/law-trust-backend:$GITHUB_SHA
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
    
    - name: Deploy to ECS
      run: |
        aws ecs update-service --cluster law-trust-cluster --service law-trust-api --force-new-deployment
    
    - name: Deploy frontend to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'

  notify:
    needs: [build-and-deploy]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Notify Slack
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ needs.build-and-deploy.result }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 📈 Performance Optimization

### Database Optimization

```sql
-- Create indexes for better query performance
CREATE INDEX CONCURRENTLY idx_leads_status_created ON leads(status, created_at);
CREATE INDEX CONCURRENTLY idx_leads_practice_area_location ON leads(practice_area, state, city);
CREATE INDEX CONCURRENTLY idx_leads_qualification_score ON leads(qualification_score DESC);
CREATE INDEX CONCURRENTLY idx_leads_urgency_created ON leads(urgency_level, created_at) WHERE urgency_level = 'EMERGENCY';
CREATE INDEX CONCURRENTLY idx_lawyers_location_practice ON lawyers(state, city, practice_areas);
CREATE INDEX CONCURRENTLY idx_lawyer_reviews_rating ON lawyer_reviews(lawyer_id, rating, created_at);

-- Partitioning for large tables
CREATE TABLE leads_2024 PARTITION OF leads FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE leads_2025 PARTITION OF leads FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### Redis Caching Strategy

```typescript
// cache-strategy.ts
export const cacheStrategies = {
  // Hot data - cache for 5 minutes
  activeLawyers: { ttl: 300, prefix: 'lawyers:active' },
  practiceAreas: { ttl: 300, prefix: 'practice:areas' },
  
  // Warm data - cache for 1 hour
  leadStats: { ttl: 3600, prefix: 'stats:leads' },
  lawyerProfiles: { ttl: 3600, prefix: 'lawyer:profile' },
  
  // Cold data - cache for 24 hours
  stateData: { ttl: 86400, prefix: 'geo:states' },
  practiceAreaInfo: { ttl: 86400, prefix: 'practice:info' },
};

// Implement cache-aside pattern
export async function getCachedLawyers(location: string, practiceArea: string) {
  const cacheKey = `lawyers:${location}:${practiceArea}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // If not in cache, query database
  const lawyers = await queryDatabase(location, practiceArea);
  
  // Store in cache for next time
  await redis.setex(cacheKey, 300, JSON.stringify(lawyers));
  
  return lawyers;
}
```

## 🛡️ Compliance & Legal

### HIPAA Compliance Checklist

- [x] Encrypted data at rest (AES-256)
- [x] Encrypted data in transit (TLS 1.2+)
- [x] Access controls and authentication
- [x] Audit logging for all data access
- [x] Employee training and BAA agreements
- [x] Regular security assessments
- [x] Incident response procedures
- [x] Data backup and recovery plans

### SOC 2 Type II Requirements

```typescript
// audit-logging.ts
export class AuditLogger {
  static async logUserAccess(userId: string, resource: string, action: string, ipAddress: string) {
    await auditLog.create({
      userId,
      resource,
      action,
      ipAddress,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      success: true,
    });
  }
  
  static async logDataAccess(userId: string, dataType: string, recordId: string, fields: string[]) {
    await auditLog.create({
      userId,
      dataType,
      recordId,
      fieldsAccessed: fields,
      timestamp: new Date(),
      compliance: 'HIPAA',
    });
  }
}
```

## 🚨 Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# backup-production.sh

# Database backup
pg_dump $DATABASE_URL | gzip > /backups/law-trust-$(date +%Y%m%d_%H%M%S).sql.gz

# Upload to S3
aws s3 cp /backups/law-trust-$(date +%Y%m%d_%H%M%S).sql.gz s3://law-trust-backups/database/

# Redis backup
redis-cli --rdb /backups/redis-$(date +%Y%m%d_%H%M%S).rdb
aws s3 cp /backups/redis-$(date +%Y%m%d_%H%M%S).rdb s3://law-trust-backups/redis/

# File system backup
tar -czf /backups/uploads-$(date +%Y%m%d_%H%M%S).tar.gz /app/uploads/
aws s3 cp /backups/uploads-$(date +%Y%m%d_%H%M%S).tar.gz s3://law-trust-backups/files/

# Cleanup old backups (keep 30 days)
find /backups/ -name "*.gz" -mtime +30 -delete
```

### Multi-Region Failover

```yaml
# docker-compose.failover.yml
version: '3.8'
services:
  law-trust-api:
    image: law-trust-backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${FAILOVER_DATABASE_URL}
      - REDIS_URL=${FAILOVER_REDIS_URL}
      - REGION=us-west-2
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

## 📞 Emergency Response

### 24/7 Emergency Hotline Setup

```typescript
// emergency-handler.ts
export class EmergencyHandler {
  static async handleEmergencyLead(lead: Lead) {
    // Immediately flag as emergency
    lead.urgencyLevel = UrgencyLevel.EMERGENCY;
    lead.status = LeadStatus.NEW;
    
    // Find all emergency lawyers in the area
    const emergencyLawyers = await findEmergencyLawyers(lead.state, lead.practiceArea);
    
    // Send simultaneous notifications
    const notifications = emergencyLawyers.map(lawyer => [
      this.sendEmergencySMS(lawyer, lead),
      this.makeEmergencyCall(lawyer, lead),
      this.sendEmergencyEmail(lawyer, lead),
    ]).flat();
    
    await Promise.allSettled(notifications);
    
    // Log emergency response
    await EmergencyLog.create({
      leadId: lead.id,
      practiceArea: lead.practiceArea,
      location: `${lead.city}, ${lead.state}`,
      lawyersNotified: emergencyLawyers.length,
      responseTime: new Date().toISOString(),
    });
  }
}
```

---

## 🎯 Go-Live Checklist

### Pre-Launch
- [ ] All tests passing (unit, integration, e2e)
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] HIPAA compliance verified
- [ ] SSL certificates installed
- [ ] DNS configured correctly
- [ ] CDN setup and tested
- [ ] Monitoring and alerts configured
- [ ] Backup and recovery tested
- [ ] Load testing completed
- [ ] Emergency procedures documented

### Launch Day
- [ ] Deploy backend services
- [ ] Deploy frontend application
- [ ] Verify health checks
- [ ] Test critical user flows
- [ ] Monitor error rates and performance
- [ ] Verify external integrations working
- [ ] Test emergency hotline
- [ ] Check SEO and analytics tracking
- [ ] Send launch notifications

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Review performance metrics
- [ ] Address any critical issues
- [ ] Update documentation
- [ ] Plan next iteration features

---

**Estimated Monthly Infrastructure Costs:**
- AWS (medium scale): $2,000-5,000/month
- External APIs: $1,000-3,000/month
- Monitoring/Security: $500-1,000/month
- **Total: $3,500-9,000/month**

**Expected Revenue:** $500K-10M+/month based on lead volume and pricing tier.
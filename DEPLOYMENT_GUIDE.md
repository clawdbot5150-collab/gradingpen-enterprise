# GradingPen Deployment Guide

This guide covers the complete deployment process for the GradingPen AI-powered grading platform across all components.

## Prerequisites

### Required Accounts & Services
- AWS Account (or Google Cloud Platform)
- OpenAI API Key
- Anthropic API Key (Claude)
- Domain name for production
- GitHub account for CI/CD
- Apple Developer Account (for iOS deployment)
- Google Play Console Account (for Android deployment)

### Development Environment
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- Git
- Expo CLI (for mobile development)

## Environment Configuration

### Backend Environment Variables
Create `.env` file in `gradingpen-backend/`:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
API_BASE_URL=https://api.gradingpen.com

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/gradingpen
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=gradingpen-files

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@gradingpen.com

# External Integrations
CANVAS_API_KEY=your-canvas-key
GOOGLE_CLASSROOM_CREDENTIALS=path/to/credentials.json

# Security
CORS_ORIGIN=https://app.gradingpen.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
DATADOG_API_KEY=your-datadog-key
SENTRY_DSN=your-sentry-dsn
```

### Frontend Environment Variables
Create `.env` file in `gradingpen-frontend/`:

```bash
REACT_APP_API_URL=https://api.gradingpen.com
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

### Mobile Environment Variables
Create `.env` file in `gradingpen-mobile/`:

```bash
EXPO_PUBLIC_API_URL=https://api.gradingpen.com
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_VERSION=1.0.0
```

## Database Setup

### 1. PostgreSQL Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE gradingpen;
CREATE USER gradingpen_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gradingpen TO gradingpen_user;
\q
```

### 2. Run Migrations
```bash
cd gradingpen-backend
npm install
npm run migrate
npm run seed  # Optional: seed with sample data
```

### 3. Redis Installation
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS with Homebrew
brew install redis
brew services start redis

# Test Redis connection
redis-cli ping
```

## Backend Deployment

### Option 1: AWS Deployment

#### 1. Create AWS Infrastructure
```bash
# Install AWS CLI and configure
aws configure

# Create ECS cluster
aws ecs create-cluster --cluster-name gradingpen-cluster

# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier gradingpen-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username gradingpen_user \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-12345678
```

#### 2. Docker Build & Push
```bash
cd gradingpen-backend

# Build Docker image
docker build -t gradingpen-backend .

# Tag for ECR
docker tag gradingpen-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/gradingpen-backend:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/gradingpen-backend:latest
```

#### 3. Deploy to ECS
Create `ecs-task-definition.json`:
```json
{
  "family": "gradingpen-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "gradingpen-backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/gradingpen-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/gradingpen-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster gradingpen-cluster \
  --service-name gradingpen-backend-service \
  --task-definition gradingpen-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678,subnet-87654321],securityGroups=[sg-12345678],assignPublicIp=ENABLED}"
```

### Option 2: Traditional VPS Deployment

#### 1. Server Setup (Ubuntu 20.04+)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx

# Install PostgreSQL and Redis
sudo apt install postgresql postgresql-contrib redis-server
```

#### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/your-org/gradingpen.git
cd gradingpen/gradingpen-backend

# Install dependencies
npm install --production

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start application with PM2
pm2 start src/index.js --name "gradingpen-backend"
pm2 save
pm2 startup
```

#### 3. Nginx Configuration
Create `/etc/nginx/sites-available/gradingpen`:
```nginx
server {
    listen 80;
    server_name api.gradingpen.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gradingpen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Set up SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.gradingpen.com
```

## Frontend Deployment

### Option 1: Vercel Deployment
```bash
cd gradingpen-frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Connect custom domain
```

### Option 2: AWS S3 + CloudFront
```bash
cd gradingpen-frontend

# Build production app
npm run build

# Create S3 bucket
aws s3 mb s3://gradingpen-frontend

# Upload build files
aws s3 sync build/ s3://gradingpen-frontend --delete

# Configure bucket for static website hosting
aws s3 website s3://gradingpen-frontend --index-document index.html --error-document error.html

# Create CloudFront distribution for CDN
```

### Option 3: Traditional Web Server
```bash
# Build application
cd gradingpen-frontend
npm run build

# Copy to web server
scp -r build/ user@your-server:/var/www/gradingpen

# Nginx configuration for React SPA
server {
    listen 80;
    server_name app.gradingpen.com;
    root /var/www/gradingpen;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Mobile App Deployment

### 1. Configure App Store Connect & Google Play Console

#### iOS Setup:
```bash
cd gradingpen-mobile

# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas login
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

#### Android Setup:
```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

### 2. Configure Push Notifications
```javascript
// In app.json
{
  "expo": {
    "name": "GradingPen",
    "slug": "gradingpen",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1976d2"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.gradingpen.app"
    },
    "android": {
      "package": "com.gradingpen.app",
      "permissions": ["CAMERA", "WRITE_EXTERNAL_STORAGE"]
    },
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#1976d2"
    }
  }
}
```

## CI/CD Pipeline Setup

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy GradingPen

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install backend dependencies
        run: |
          cd gradingpen-backend
          npm ci
      
      - name: Run backend tests
        run: |
          cd gradingpen-backend
          npm test
      
      - name: Install frontend dependencies
        run: |
          cd gradingpen-frontend
          npm ci
      
      - name: Run frontend tests
        run: |
          cd gradingpen-frontend
          npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: gradingpen-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd gradingpen-backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster gradingpen-cluster \
            --service gradingpen-backend-service \
            --force-new-deployment

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install and build
        run: |
          cd gradingpen-frontend
          npm ci
          npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./gradingpen-frontend
```

## Monitoring and Maintenance

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install --save newrelic
npm install --save @sentry/node

# Configure New Relic (add to package.json)
{
  "scripts": {
    "start": "node -r newrelic src/index.js"
  }
}
```

### 2. Database Maintenance
```sql
-- Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U gradingpen_user gradingpen > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://gradingpen-backups/
```

### 3. Health Checks
```javascript
// Add to backend routes
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  try {
    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).send();
  }
});
```

### 4. Log Management
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/gradingpen

/var/log/gradingpen/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 root root
    postrotate
        pm2 reload gradingpen-backend
    endscript
}
```

## Security Configuration

### 1. SSL/TLS Setup
```bash
# Let's Encrypt for automatic SSL
sudo certbot --nginx -d api.gradingpen.com -d app.gradingpen.com

# Configure SSL in Nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/api.gradingpen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.gradingpen.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
}
```

### 2. Firewall Configuration
```bash
# UFW setup
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5432  # PostgreSQL (only from app servers)
sudo ufw deny 5432 from any to any
sudo ufw allow from 10.0.0.0/8 to any port 5432
```

### 3. Environment Security
```bash
# Secure file permissions
chmod 600 .env
chown root:root .env

# Use secret management
# AWS Secrets Manager or HashiCorp Vault for production
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_grades_submission_grader ON grades(submission_id, grader_id);
CREATE INDEX CONCURRENTLY idx_assignments_course_status ON assignments(course_id, status);
CREATE INDEX CONCURRENTLY idx_submissions_assignment_student ON submissions(assignment_id, student_id);

-- Analyze and vacuum
ANALYZE;
VACUUM ANALYZE;
```

### 2. Redis Caching
```javascript
// Implement caching strategy
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache expensive queries
app.get('/api/analytics/:teacherId', async (req, res) => {
  const cacheKey = `analytics:${req.params.teacherId}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const data = await generateAnalytics(req.params.teacherId);
  await client.setex(cacheKey, 300, JSON.stringify(data)); // 5min cache
  res.json(data);
});
```

### 3. CDN Configuration
```javascript
// CloudFront configuration for static assets
{
  "Origins": [
    {
      "Id": "S3-gradingpen-frontend",
      "DomainName": "gradingpen-frontend.s3.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }
  ],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-gradingpen-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "DefaultTTL": 86400
  }
}
```

## Scaling Considerations

### 1. Auto Scaling
```bash
# Configure ECS Auto Scaling
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/gradingpen-cluster/gradingpen-backend-service \
    --min-capacity 2 \
    --max-capacity 10
```

### 2. Load Balancing
```bash
# Application Load Balancer configuration
aws elbv2 create-load-balancer \
    --name gradingpen-alb \
    --subnets subnet-12345678 subnet-87654321 \
    --security-groups sg-12345678
```

## Troubleshooting Common Issues

### 1. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Reset connections
sudo systemctl restart postgresql
```

### 2. Memory Issues
```bash
# Monitor memory usage
free -h
htop

# Adjust Node.js memory limit
node --max-old-space-size=2048 src/index.js
```

### 3. AI API Rate Limits
```javascript
// Implement exponential backoff
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.status === 429) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};
```

This deployment guide provides a comprehensive approach to getting GradingPen running in production. Adjust the configurations based on your specific requirements and infrastructure preferences.
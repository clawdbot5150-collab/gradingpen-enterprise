# AIGFNetwork Setup Guide

This guide will help you set up the complete AIGFNetwork social confidence training platform from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Development Setup](#development-setup)
6. [Production Deployment](#production-deployment)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://postgresql.org/)
- **Docker & Docker Compose** - [Download](https://docs.docker.com/get-docker/)
- **Git** - [Download](https://git-scm.com/)

### Required Services

- **OpenAI API Key** - [Get API Key](https://platform.openai.com/api-keys)
- **Email Service** (Sendgrid, SMTP, etc.) - Optional but recommended
- **Redis** (Optional, for caching) - Can use Docker

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2

## 🚀 Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-repo/aigf-network.git
cd aigf-network

# Make scripts executable
chmod +x deployment/deploy.sh
chmod +x backend/scripts/*.js
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

## ⚙️ Environment Configuration

### 1. Create Environment Files

```bash
# Copy environment template
cp .env.example .env

# Also create environment files for frontend
cp .env.example frontend/.env.local
```

### 2. Configure Environment Variables

Edit the `.env` file with your specific configuration:

#### Required Configuration

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aigf_network
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_characters

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Application URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

#### Optional Configuration

```env
# Email (recommended for production)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Redis (optional, for better performance)
REDIS_URL=redis://localhost:6379

# File Storage (optional)
STORAGE_PROVIDER=local  # or aws-s3, google-cloud, cloudinary
```

### 3. Generate Secrets

```bash
# Generate JWT secrets (Linux/macOS)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Database Setup

### Option 1: Using Docker (Recommended)

```bash
# Start database with Docker
docker-compose up -d postgres

# Wait for database to be ready
sleep 10

# Run database setup
npm run db:setup
```

### Option 2: Local PostgreSQL

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE aigf_network;
CREATE USER aigf_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE aigf_network TO aigf_user;
\q

# Run database setup
cd backend
npm run db:setup
```

### Database Setup Scripts

The database setup will:

1. Create all required tables
2. Set up indexes and triggers
3. Insert AI personalities
4. Insert practice scenarios
5. Insert badges and achievements
6. Insert mental health resources
7. Insert default challenges

## 💻 Development Setup

### Option 1: Using Docker (Easiest)

```bash
# Start all services in development mode
docker-compose --profile development up -d

# View logs
docker-compose logs -f
```

This starts:
- PostgreSQL database
- Redis cache
- Backend API
- Frontend application
- pgAdmin (database admin)
- Redis Commander (Redis admin)

### Option 2: Manual Development Setup

```bash
# Terminal 1 - Start database and Redis
docker-compose up -d postgres redis

# Terminal 2 - Start backend
cd backend
npm run dev

# Terminal 3 - Start frontend
cd frontend
npm run dev
```

### Access Development Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Database Admin**: http://localhost:8080 (admin@aigfnetwork.com / admin123)
- **Redis Admin**: http://localhost:8081 (admin / admin123)

## 🚀 Production Deployment

### Using Docker Compose (Recommended)

```bash
# Set production environment
export NODE_ENV=production
export DOCKER_IMAGE_TAG=v1.0.0

# Run deployment script
./deployment/deploy.sh
```

### Manual Production Setup

```bash
# Build production images
npm run build

# Start production services
docker-compose --profile production up -d

# Run health checks
curl -f http://localhost:5000/health
curl -f http://localhost:3000
```

### Production Services

The production deployment includes:
- **Nginx** reverse proxy
- **PostgreSQL** database
- **Redis** cache
- **Backend API**
- **Frontend application**
- **SSL termination** (configured in nginx)

## ✅ Verification & Testing

### 1. Health Checks

```bash
# Check backend health
curl http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123,
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. Database Verification

```bash
# Check database connection
docker-compose exec backend npm run db:health

# Check if tables are created
docker-compose exec postgres psql -U postgres -d aigf_network -c "\dt"
```

### 3. AI Integration Test

```bash
# Test OpenAI integration (requires API key)
curl -X POST http://localhost:5000/api/test/ai \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test message"}'
```

### 4. Frontend Test

Visit http://localhost:3000 and verify:
- [ ] Page loads without errors
- [ ] Registration form works
- [ ] Login form works
- [ ] AI personality cards display
- [ ] Practice scenarios load

### 5. Real-time Communication Test

1. Open two browser windows
2. Login to different accounts
3. Start a chat session
4. Verify real-time messages work

### 6. Run Test Suites

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down postgres
docker volume rm aigf-network_postgres_data
docker-compose up -d postgres
npm run db:setup
```

#### 2. OpenAI API Issues

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check backend logs for AI errors
docker-compose logs backend | grep -i openai
```

#### 3. Frontend Build Issues

```bash
# Clear Next.js cache
cd frontend
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### 4. Socket.IO Connection Issues

```bash
# Check WebSocket connection in browser console
# Should see: "Socket connected: true"

# Check backend WebSocket logs
docker-compose logs backend | grep -i socket
```

#### 5. Memory Issues

```bash
# Check Docker memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Recommended: 4GB+ for development, 8GB+ for production
```

### Log Locations

```bash
# Application logs
docker-compose logs [service_name]

# Database logs
docker-compose logs postgres

# Nginx logs (production)
docker-compose logs nginx

# All logs
docker-compose logs -f
```

### Performance Optimization

1. **Database**:
   ```sql
   -- Check slow queries
   SELECT query, mean_time, rows, 100.0 * shared_blks_hit /
          nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
   FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;
   ```

2. **Redis Caching**:
   ```bash
   # Check Redis memory usage
   docker-compose exec redis redis-cli info memory
   ```

3. **Frontend Performance**:
   ```bash
   # Analyze bundle size
   cd frontend
   npm run analyze
   ```

## 🔒 Security Checklist

### Development
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS in production
- [ ] Secure database with strong passwords
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets

### Production
- [ ] Enable CORS properly
- [ ] Set up rate limiting
- [ ] Configure proper firewall rules
- [ ] Use SSL certificates
- [ ] Enable database encryption
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup procedures in place

## 📊 Monitoring

### Application Monitoring

```bash
# Monitor with Prometheus/Grafana (optional)
docker-compose --profile monitoring up -d

# Access Grafana: http://localhost:3001 (admin/admin123)
# Access Prometheus: http://localhost:9090
```

### Health Monitoring Script

Create `scripts/health-check.sh`:

```bash
#!/bin/bash
# Simple health monitoring
services=("frontend:3000" "backend:5000")
for service in "${services[@]}"; do
    name=${service%:*}
    port=${service#*:}
    if curl -f -s http://localhost:$port/health > /dev/null; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is down"
    fi
done
```

## 🚀 Next Steps

After successful setup:

1. **Customize AI Personalities**: Edit database entries or add new ones
2. **Add Practice Scenarios**: Create custom scenarios for your users
3. **Configure Email Templates**: Set up welcome emails, notifications
4. **Set up Analytics**: Add Google Analytics, Mixpanel, etc.
5. **Configure Backups**: Set up automated database backups
6. **SSL Certificate**: Configure SSL for production domain
7. **Domain Setup**: Point your domain to the server
8. **Load Testing**: Test with expected user load

## 📚 Additional Resources

- [API Documentation](./api.md)
- [Frontend Architecture](./frontend.md)
- [Database Schema](./database.md)
- [AI Personalities Guide](./ai-personalities.md)
- [Deployment Guide](./deployment.md)
- [Contributing Guidelines](./contributing.md)

## 🆘 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review the logs for error messages
3. Search existing GitHub issues
4. Create a new issue with detailed information

---

**Congratulations!** 🎉 You now have a fully functional AIGFNetwork social confidence training platform!

The platform includes:
- ✅ 8 Unique AI personalities
- ✅ Multiple practice scenarios
- ✅ Real-time chat functionality
- ✅ Progress tracking and analytics
- ✅ Achievement system
- ✅ Mental health safeguards
- ✅ Premium features ready
- ✅ Mobile-responsive design
- ✅ Production-ready deployment

Start helping users build their social confidence today! 🚀
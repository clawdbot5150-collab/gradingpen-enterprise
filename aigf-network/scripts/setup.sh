#!/bin/bash

# AIGFNetwork Setup Script
# Automates the setup process for the social confidence training platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
   _____  _____ _____  ______ _   _      _                       _    
  |  __ \|_   _|  __ \|  ____| \ | |    | |                     | |   
  | |  | | | | | |  | | |__  |  \| | ___| |___      _____  _ __| | __
  | |  | | | | | |  | |  __| | . ` |/ _ \ __\ \ /\ / / _ \| '__| |/ /
  | |__| |_| |_| |__| | |    | |\  |  __/ |_ \ V  V / (_) | |  |   < 
  |_____/|_____|_____/|_|    |_| \_|\___|\__| \_/\_/ \___/|_|  |_|\_\
                                                                     
  Social Confidence Training Platform Setup
EOF
echo -e "${NC}"

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) is installed"

# Check npm
if ! command_exists npm; then
    print_error "npm is not installed"
    exit 1
fi

print_success "npm $(npm --version) is installed"

# Check Docker
if ! command_exists docker; then
    print_warning "Docker is not installed. Installing dependencies locally..."
    LOCAL_INSTALL=true
else
    print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) is installed"
fi

# Check Docker Compose
if ! command_exists docker-compose; then
    if [ "$LOCAL_INSTALL" != "true" ]; then
        print_warning "Docker Compose is not installed. Installing dependencies locally..."
        LOCAL_INSTALL=true
    fi
else
    print_success "Docker Compose $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1) is installed"
fi

# Check Python (for AI service)
if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.9+ from https://python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
print_success "Python $PYTHON_VERSION is installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    cat > .env << 'EOF'
# AI Service API Keys (Required)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional AI Model Keys
COHERE_API_KEY=your_cohere_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Database Configuration
DATABASE_URL=postgresql://aigf_user:aigf_password_2024@localhost:5432/aigf_network

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Secret (Change in production)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Email Service (Optional)
EMAIL_SERVICE_API_KEY=your_email_service_key_here
EMAIL_FROM_ADDRESS=noreply@aigfnetwork.com

# Application URLs
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000

# Development Settings
NODE_ENV=development
LOG_LEVEL=info

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
POSTHOG_API_KEY=your_posthog_key_here

# Stripe (Optional - for subscriptions)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EOF
    print_success ".env file created"
    print_warning "Please edit .env file and add your API keys!"
    echo "You can get API keys from:"
    echo "  - OpenAI: https://platform.openai.com/api-keys"
    echo "  - Anthropic: https://console.anthropic.com/"
    echo ""
fi

# Setup function for Docker environment
setup_docker() {
    print_status "Setting up Docker environment..."
    
    # Create necessary directories
    mkdir -p database/init deployment/nginx deployment/monitoring/grafana/{dashboards,datasources}
    
    # Start services
    print_status "Starting services with Docker Compose..."
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    docker-compose run --rm backend npm install
    
    print_status "Installing frontend dependencies..."
    docker-compose run --rm frontend npm install
    
    # Setup database
    print_status "Setting up database..."
    docker-compose run --rm backend npm run prisma:migrate
    docker-compose run --rm backend npm run prisma:generate
    docker-compose run --rm backend npm run seed
    
    # Start all services
    print_status "Starting all services..."
    docker-compose up -d
    
    print_success "Docker environment setup complete!"
}

# Setup function for local environment
setup_local() {
    print_status "Setting up local development environment..."
    
    # Install Node.js dependencies
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    # Setup Python environment for AI service
    print_status "Setting up Python environment for AI service..."
    cd ai-service
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    
    print_warning "Local setup complete, but you'll need to manually start PostgreSQL and Redis"
    print_status "Database setup commands:"
    echo "  cd backend"
    echo "  npm run prisma:migrate"
    echo "  npm run prisma:generate"
    echo "  npm run seed"
}

# Ask user for setup preference
echo ""
print_status "Choose setup method:"
echo "1) Docker (Recommended - includes all services)"
echo "2) Local development (Manual database setup required)"
echo "3) Skip dependency installation"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        setup_docker
        ;;
    2)
        setup_local
        ;;
    3)
        print_status "Skipping dependency installation"
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Create additional helpful scripts
print_status "Creating helper scripts..."

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
# Start AIGFNetwork development environment

echo "Starting AIGFNetwork..."

if [ -f "docker-compose.yml" ] && command -v docker-compose >/dev/null 2>&1; then
    echo "Starting with Docker Compose..."
    docker-compose up -d
    echo ""
    echo "Services started! Access at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:3001"
    echo "  AI Service: http://localhost:8000"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop services: docker-compose down"
else
    echo "Starting local development servers..."
    echo "Make sure PostgreSQL and Redis are running!"
    echo ""
    echo "Start each service in separate terminals:"
    echo "  Backend: cd backend && npm run dev"
    echo "  Frontend: cd frontend && npm run dev"
    echo "  AI Service: cd ai-service && source venv/bin/activate && python main.py"
fi
EOF

chmod +x start.sh

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash
# Stop AIGFNetwork services

echo "Stopping AIGFNetwork services..."

if [ -f "docker-compose.yml" ] && command -v docker-compose >/dev/null 2>&1; then
    docker-compose down
    echo "Docker services stopped."
else
    echo "For local development, stop each service manually (Ctrl+C in each terminal)"
fi
EOF

chmod +x stop.sh

# Create development script
cat > package.json << 'EOF'
{
  "name": "aigf-network",
  "version": "1.0.0",
  "description": "Social Confidence Training Platform",
  "scripts": {
    "install:all": "cd backend && npm install && cd ../frontend && npm install && cd ../ai-service && pip install -r requirements.txt",
    "dev": "./start.sh",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:ai": "cd ai-service && source venv/bin/activate && python main.py",
    "build": "cd backend && npm run build && cd ../frontend && npm run build",
    "test": "cd backend && npm test && cd ../frontend && npm test",
    "db:setup": "cd backend && npm run prisma:migrate && npm run prisma:generate && npm run seed",
    "db:reset": "cd backend && npm run prisma:reset",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "docker:rebuild": "docker-compose down && docker-compose up -d --build"
  },
  "keywords": ["social-skills", "dating-coach", "confidence-building", "ai-training"],
  "author": "AIGFNetwork Team",
  "license": "MIT"
}
EOF

print_success "Helper scripts created!"

# Final setup message
echo ""
print_success "🎉 AIGFNetwork setup complete!"
echo ""
print_status "Next steps:"
echo "1. Edit .env file and add your API keys"
echo "2. Start the services:"
if [ "$choice" = "1" ]; then
    echo "   ./start.sh  (or docker-compose up -d)"
else
    echo "   Start PostgreSQL and Redis servers"
    echo "   ./start.sh"
fi
echo ""
echo "3. Access the application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   AI Service: http://localhost:8000"
echo ""
print_status "Useful commands:"
echo "  ./start.sh        - Start all services"
echo "  ./stop.sh         - Stop all services"
echo "  npm run db:setup  - Setup database"
echo "  npm run test      - Run tests"
echo ""
print_status "Documentation:"
echo "  README.md          - Project overview"
echo "  IMPLEMENTATION.md  - Complete feature documentation"
echo "  deployment/DEPLOYMENT.md - Deployment guide"
echo ""

if [ ! -s ".env" ] || grep -q "your_.*_api_key_here" .env; then
    print_warning "⚠️  Don't forget to add your API keys to .env file!"
fi

print_success "Happy coding! 🚀"
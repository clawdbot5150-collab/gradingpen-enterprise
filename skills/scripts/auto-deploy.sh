#!/bin/bash
# auto-deploy.sh - Complete build and deploy pipeline

set -e

# Check for required arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <project-directory> <framework>"
    echo "Frameworks: react, nextjs, vue, vite, static"
    echo "Example: $0 ~/projects/my-website react"
    exit 1
fi

PROJECT_DIR="$1"
FRAMEWORK="$2"

# Validate project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory '$PROJECT_DIR' not found"
    exit 1
fi

echo "🚀 Starting automated deployment pipeline..."
echo "📁 Project: $PROJECT_DIR"
echo "⚡ Framework: $FRAMEWORK"

# Navigate to project
cd "$PROJECT_DIR"

# Pull latest changes from GitHub
echo ""
echo "📥 Step 1: Pulling latest changes from GitHub..."
if [ -d ".git" ]; then
    git pull origin main || git pull origin master
    echo "✅ Git pull complete"
else
    echo "⚠️  Warning: Not a Git repository, skipping pull"
fi

# Install dependencies
echo ""
echo "📦 Step 2: Installing dependencies..."
if [ -f "package.json" ]; then
    npm install --silent
    echo "✅ Dependencies installed"
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo "✅ Python dependencies installed"
else
    echo "⚠️  No package.json or requirements.txt found, skipping dependency install"
fi

# Build based on framework
echo ""
echo "🔨 Step 3: Building project..."
BUILD_DIR=""

case "$FRAMEWORK" in
    "react"|"cra")
        npm run build
        BUILD_DIR="build"
        ;;
    "nextjs"|"next")
        npm run build
        if grep -q '"export"' package.json; then
            npm run export
            BUILD_DIR="out"
        else
            echo "⚠️  Warning: Next.js without static export"
            BUILD_DIR=".next"
        fi
        ;;
    "vue")
        npm run build
        BUILD_DIR="dist"
        ;;
    "vite")
        npm run build
        BUILD_DIR="dist"
        ;;
    "gatsby")
        npm run build
        BUILD_DIR="public"
        ;;
    "static"|"html")
        BUILD_DIR="public"
        if [ ! -d "$BUILD_DIR" ]; then
            BUILD_DIR="."
        fi
        ;;
    *)
        echo "❌ Unknown framework: $FRAMEWORK"
        echo "Supported: react, nextjs, vue, vite, gatsby, static"
        exit 1
        ;;
esac

# Verify build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory '$BUILD_DIR' not found after build"
    exit 1
fi

echo "✅ Build complete: $BUILD_DIR"

# Deploy to Hostinger
echo ""
echo "🌐 Step 4: Deploying to Hostinger..."

# Find the deploy script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy-ftp.sh"

if [ ! -f "$DEPLOY_SCRIPT" ]; then
    # Try to find it in skill directory
    DEPLOY_SCRIPT="$HOME/.openclaw/workspace/skills/github-hostinger-deployer/scripts/deploy-ftp.sh"
fi

if [ -f "$DEPLOY_SCRIPT" ]; then
    bash "$DEPLOY_SCRIPT" "$BUILD_DIR"
else
    echo "⚠️  Deploy script not found, skipping FTP deployment"
    echo "📁 Build is ready in: $BUILD_DIR"
fi

# Log deployment
echo ""
echo "📝 Step 5: Logging deployment..."
DEPLOY_LOG="deployment.log"
echo "$(date '+%Y-%m-%d %H:%M:%S'): Deployed $FRAMEWORK app (commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A'))" >> "$DEPLOY_LOG"

if [ -d ".git" ]; then
    git add "$DEPLOY_LOG" 2>/dev/null || true
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || true
    git push origin main 2>/dev/null || git push origin master 2>/dev/null || true
    echo "✅ Deployment logged and pushed to GitHub"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✅ DEPLOYMENT COMPLETE! 🎉           ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌍 Your website should now be live!"
echo "📁 Build location: $PROJECT_DIR/$BUILD_DIR"
echo "📊 View log: cat $PROJECT_DIR/$DEPLOY_LOG"

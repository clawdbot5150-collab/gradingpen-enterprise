---
name: github-hostinger-deployer
description: Complete workflow tool for designing, editing, building, and deploying websites using GitHub and Hostinger together. Use when the user wants to create a website, deploy to Hostinger, manage GitHub repositories, or automate the build-deploy pipeline. Triggers on "create a website", "deploy to Hostinger", "push to GitHub", "build and deploy", or any web development tasks involving GitHub or Hostinger integration.
---

# GitHub + Hostinger Website Deployer

Automates the complete website development workflow from design to deployment using GitHub for version control and Hostinger for hosting.

## What This Skill Does

1. **Design & Generate** - Creates complete websites with modern frameworks
2. **GitHub Integration** - Commits, pushes, manages repositories
3. **Build Process** - Runs build commands (npm, webpack, etc.)
4. **Hostinger Deployment** - Deploys via FTP/SFTP or Git
5. **Continuous Deployment** - Automates the entire pipeline

## Prerequisites Setup

### GitHub Setup
```bash
# Install GitHub CLI (if not already installed)
# Linux:
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
```

### Hostinger Setup
Store credentials securely:
```bash
# Create credentials file
mkdir -p ~/.deployer
nano ~/.deployer/hostinger-credentials.json
```

**hostinger-credentials.json:**
```json
{
  "ftp": {
    "host": "ftp.yourdomain.com",
    "port": 21,
    "username": "your-username",
    "password": "your-password"
  },
  "ssh": {
    "host": "ssh.yourdomain.com",
    "port": 22,
    "username": "your-username",
    "keyPath": "/root/.ssh/hostinger_rsa"
  }
}
```

## Workflow Commands

### 1. Create New Website Project

**User says:** "Create a new portfolio website"

**Workflow:**
1. Ask for project details (name, type, framework)
2. Generate project structure
3. Initialize Git repository
4. Create GitHub repository
5. Push initial commit

**Example:**
```bash
# Create project directory
mkdir ~/projects/my-portfolio
cd ~/projects/my-portfolio

# Initialize project (React example)
npx create-react-app .
# OR for Next.js
npx create-next-app@latest .
# OR for static HTML
mkdir -p public css js

# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo
gh repo create my-portfolio --public --source=. --remote=origin --push
```

### 2. Design & Edit Website

**User says:** "Add a contact form to my website"

**Workflow:**
1. Identify project structure
2. Generate/modify necessary files
3. Test locally if possible
4. Commit changes

**Example:**
```bash
cd ~/projects/my-portfolio

# Create contact form component (React example)
cat > src/components/ContactForm.jsx << 'EOF'
import React, { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '', email: '', message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        className="w-full p-2 mb-4 border rounded"
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        className="w-full p-2 mb-4 border rounded"
      />
      <textarea
        placeholder="Message"
        value={formData.message}
        onChange={(e) => setFormData({...formData, message: e.target.value})}
        className="w-full p-2 mb-4 border rounded h-32"
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        Send Message
      </button>
    </form>
  );
}
EOF

# Commit changes
git add .
git commit -m "Add contact form component"
git push origin main
```

### 3. Build Website

**User says:** "Build my website for production"

**Workflow:**
1. Run build command based on framework
2. Verify build success
3. Prepare for deployment

**Examples by framework:**

**React/Create-React-App:**
```bash
cd ~/projects/my-portfolio
npm run build
# Output: build/ directory
```

**Next.js:**
```bash
cd ~/projects/my-portfolio
npm run build
npm run export  # For static export
# Output: out/ directory
```

**Vue:**
```bash
npm run build
# Output: dist/ directory
```

**Static HTML:**
```bash
# No build needed, just ensure files are ready
ls -la public/
```

### 4. Deploy to Hostinger

**User says:** "Deploy my website to Hostinger"

**Workflow:**
1. Build the website
2. Choose deployment method (FTP or SSH)
3. Upload files to Hostinger
4. Verify deployment

#### Method A: FTP Deployment

```bash
#!/bin/bash
# deploy-ftp.sh

# Load credentials
CREDENTIALS=$(cat ~/.deployer/hostinger-credentials.json)
FTP_HOST=$(echo $CREDENTIALS | jq -r '.ftp.host')
FTP_USER=$(echo $CREDENTIALS | jq -r '.ftp.username')
FTP_PASS=$(echo $CREDENTIALS | jq -r '.ftp.password')

# Build directory (adjust based on framework)
BUILD_DIR="build"  # or "dist" or "out" or "public"

# Install lftp if needed
command -v lftp >/dev/null 2>&1 || apt install -y lftp

# Deploy
lftp -c "
  open -u $FTP_USER,$FTP_PASS $FTP_HOST
  mirror --reverse --delete --verbose $BUILD_DIR /public_html
  bye
"

echo "✅ Deployed to Hostinger via FTP"
```

#### Method B: SSH/SFTP Deployment

```bash
#!/bin/bash
# deploy-ssh.sh

# Load credentials
CREDENTIALS=$(cat ~/.deployer/hostinger-credentials.json)
SSH_HOST=$(echo $CREDENTIALS | jq -r '.ssh.host')
SSH_USER=$(echo $CREDENTIALS | jq -r '.ssh.username')
SSH_KEY=$(echo $CREDENTIALS | jq -r '.ssh.keyPath')

# Build directory
BUILD_DIR="build"

# Deploy using rsync over SSH
rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  $BUILD_DIR/ \
  $SSH_USER@$SSH_HOST:/public_html/

echo "✅ Deployed to Hostinger via SSH"
```

#### Method C: Git-Based Deployment (Advanced)

```bash
#!/bin/bash
# deploy-git.sh

# This requires Hostinger Git integration setup
# Push to Hostinger's Git repository

# Add Hostinger as remote
git remote add hostinger ssh://user@host/~/public_html/.git

# Push
git push hostinger main

echo "✅ Deployed to Hostinger via Git"
```

### 5. Complete Build-Deploy Pipeline

**User says:** "Build and deploy my website automatically"

**Create automated deployment script:**

```bash
#!/bin/bash
# auto-deploy.sh

set -e  # Exit on error

PROJECT_DIR="$1"
FRAMEWORK="$2"  # react, nextjs, vue, static

echo "🚀 Starting automated deployment..."

# Navigate to project
cd "$PROJECT_DIR"

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "package.json" ]; then
  npm install
fi

# Build based on framework
echo "🔨 Building project..."
case "$FRAMEWORK" in
  "react")
    npm run build
    BUILD_DIR="build"
    ;;
  "nextjs")
    npm run build
    npm run export
    BUILD_DIR="out"
    ;;
  "vue")
    npm run build
    BUILD_DIR="dist"
    ;;
  "static")
    BUILD_DIR="public"
    ;;
  *)
    echo "Unknown framework: $FRAMEWORK"
    exit 1
    ;;
esac

# Deploy to Hostinger
echo "🌐 Deploying to Hostinger..."
./deploy-ftp.sh "$BUILD_DIR"

# Commit deployment log
echo "📝 Logging deployment..."
echo "$(date): Deployed version $(git rev-parse --short HEAD)" >> deployment.log
git add deployment.log
git commit -m "Deploy: $(date)"
git push origin main

echo "✅ Deployment complete!"
echo "🌍 Your website is live!"
```

**Make it executable:**
```bash
chmod +x auto-deploy.sh
```

**Usage:**
```bash
./auto-deploy.sh ~/projects/my-portfolio react
```

## Complete Workflow Example

**User request:** "Create a new landing page for my AI product, deploy it to Hostinger"

**Step-by-step execution:**

```bash
# 1. Create project
PROJECT_NAME="ai-product-landing"
mkdir ~/projects/$PROJECT_NAME
cd ~/projects/$PROJECT_NAME

# 2. Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# 3. Create landing page
cat > app/page.tsx << 'EOF'
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      <nav className="p-6 flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">AI Product</h1>
        <button className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold">
          Get Started
        </button>
      </nav>
      
      <main className="container mx-auto px-6 pt-20">
        <div className="text-center text-white">
          <h2 className="text-6xl font-bold mb-6">
            Transform Your Business with AI
          </h2>
          <p className="text-xl mb-8 opacity-90">
            The most powerful AI tool you'll ever need
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition">
            Start Free Trial
          </button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {['Fast', 'Powerful', 'Easy'].map((feature) => (
            <div key={feature} className="bg-white/10 backdrop-blur p-6 rounded-lg">
              <h3 className="text-white text-2xl font-bold mb-2">{feature}</h3>
              <p className="text-white/80">Amazing features that will blow your mind</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
EOF

# 4. Initialize Git and push to GitHub
git init
git add .
git commit -m "Initial landing page"
gh repo create $PROJECT_NAME --public --source=. --remote=origin --push

# 5. Build for production
npm run build
npm run export

# 6. Deploy to Hostinger
# Load credentials
CREDENTIALS=$(cat ~/.deployer/hostinger-credentials.json)
FTP_HOST=$(echo $CREDENTIALS | jq -r '.ftp.host')
FTP_USER=$(echo $CREDENTIALS | jq -r '.ftp.username')
FTP_PASS=$(echo $CREDENTIALS | jq -r '.ftp.password')

# Deploy via FTP
lftp -c "
  open -u $FTP_USER,$FTP_PASS $FTP_HOST
  mirror --reverse --delete --verbose out /public_html
  bye
"

echo "✅ Website deployed!"
echo "🌍 Live at: https://yourdomain.com"
```

## Advanced Features

### Environment Variables

**Create `.env` file:**
```bash
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
ANTHROPIC_API_KEY=your-key-here
STRIPE_SECRET_KEY=your-stripe-key
EOF

# Add to .gitignore
echo ".env.local" >> .gitignore
```

### GitHub Actions for Auto-Deploy

**Create `.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Hostinger
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ${{ secrets.FTP_HOST }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./build/
          server-dir: /public_html/
```

### Custom Domains on Hostinger

```bash
# SSH into Hostinger
ssh user@host

# Navigate to public_html
cd public_html

# Create .htaccess for routing
cat > .htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# Redirect to HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle React/Next.js routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF
```

## Deployment Strategies

### Strategy 1: Direct FTP (Fastest for small sites)
- Best for: Static HTML, small projects
- Speed: Fast
- Rollback: Manual

### Strategy 2: Git-based (Best for teams)
- Best for: Collaboration, version control
- Speed: Medium
- Rollback: Easy (`git revert`)

### Strategy 3: CI/CD Pipeline (Most automated)
- Best for: Professional projects
- Speed: Automated
- Rollback: Via GitHub

## Troubleshooting

### FTP Connection Issues
```bash
# Test FTP connection
lftp -u username,password ftp.yourdomain.com -e "ls; bye"
```

### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Permission Issues on Hostinger
```bash
# SSH into Hostinger and fix permissions
ssh user@host
chmod -R 755 public_html
```

## Security Best Practices

1. **Never commit credentials**
   ```bash
   echo "*.json" >> .gitignore
   echo ".env*" >> .gitignore
   ```

2. **Use SSH keys instead of passwords**
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/hostinger_rsa
   # Add public key to Hostinger
   ```

3. **Store secrets in GitHub Secrets**
   - Go to repo Settings > Secrets
   - Add FTP_HOST, FTP_USERNAME, FTP_PASSWORD

## Monitoring & Maintenance

**Check deployment status:**
```bash
# View deployment log
tail -f deployment.log

# Check last deploy
git log -1 --oneline
```

**Rollback if needed:**
```bash
# Rollback to previous commit
git revert HEAD
git push origin main
./auto-deploy.sh ~/projects/my-portfolio react
```

## Summary

This skill provides a complete website development workflow:

1. ✅ Design/generate websites
2. ✅ Manage with Git/GitHub
3. ✅ Build for production
4. ✅ Deploy to Hostinger automatically
5. ✅ Continuous deployment pipeline
6. ✅ Rollback and version control

**Next Steps:**
- Set up credentials in `~/.deployer/hostinger-credentials.json`
- Authenticate with GitHub: `gh auth login`
- Create your first project!

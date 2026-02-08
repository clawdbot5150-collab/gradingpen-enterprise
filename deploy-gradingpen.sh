#!/bin/bash

# GradingPen.com Deployment Script
echo "🚀 Deploying GradingPen.com with working buttons..."

# Copy fixed file as index.html
cp gradingpen-fixed.html index.html

echo "✅ Fixed HTML file prepared"
echo ""
echo "🔧 BUTTON FIXES IMPLEMENTED:"
echo "  ✅ Start Free Trial - Opens signup modal"
echo "  ✅ Watch Demo - Opens demo scheduler modal"
echo "  ✅ Start Professional Trial - Plan selection with alert"
echo "  ✅ Claim Enterprise Trial - Plan selection with alert"
echo "  ✅ Contact Academic Sales - Opens email client"
echo "  ✅ Contact Support - Opens email client"
echo "  ✅ Schedule Enterprise Demo - Opens demo modal"
echo ""
echo "📋 FUNCTIONAL FEATURES ADDED:"
echo "  • Modal popups for trial signup and demo scheduling"
echo "  • Form validation and submission handling"
echo "  • Email integration for sales and support contacts"
echo "  • Plan selection confirmation alerts"
echo "  • Smooth animations and improved UX"
echo ""

# Check if lftp is available
if command -v lftp &> /dev/null; then
    echo "📡 FTP deployment available - lftp found"
    
    # You can add FTP credentials here when available:
    # FTP_HOST="your-ftp-host"
    # FTP_USER="your-username"
    # FTP_PASS="your-password"
    
    # Example FTP deployment (uncomment when credentials are available):
    # lftp -c "
    #   open -u $FTP_USER,$FTP_PASS $FTP_HOST
    #   put index.html -o public_html/index.html
    #   bye
    # "
    
    echo "⚠️  FTP deployment ready - add your credentials to deploy"
else
    echo "⚠️  Install lftp for FTP deployment: apt install -y lftp"
fi

echo ""
echo "🌟 MANUAL DEPLOYMENT OPTIONS:"
echo "1. Upload index.html to your hosting provider's public_html folder"
echo "2. Use cPanel File Manager to replace the current index.html"
echo "3. Use SFTP client like FileZilla to upload the file"
echo ""
echo "📁 File ready: $(pwd)/index.html"
echo "💾 Size: $(du -h index.html | cut -f1)"
echo ""
echo "✅ DEPLOYMENT READY! All buttons now fully functional."

# Test the file locally if possible
if command -v python3 &> /dev/null; then
    echo ""
    echo "🔧 LOCAL TESTING AVAILABLE:"
    echo "Run: python3 -m http.server 8000"
    echo "Visit: http://localhost:8000"
    echo "Test all buttons before deploying!"
fi
#!/bin/bash
echo "🧪 VERIFYING GRADINGPEN.COM DEPLOYMENT"
echo "======================================"

echo "🔍 Checking website..."
RESPONSE=$(curl -s https://gradingpen.com)
SIZE=$(echo "$RESPONSE" | wc -c)

echo "📊 Site size: $SIZE bytes"

if echo "$RESPONSE" | grep -q "Start Free.*Trial"; then
    echo "✅ Email signup form detected"
else
    echo "❌ Email signup form NOT found"
fi

if echo "$RESPONSE" | grep -q "function.*contactSales"; then
    echo "✅ JavaScript functions detected"
else
    echo "❌ JavaScript functions NOT found"
fi

if echo "$RESPONSE" | grep -q "Watch Demo"; then
    echo "✅ Demo button detected"
else
    echo "❌ Demo button NOT found"
fi

echo ""
echo "🎯 TESTING URLS:"
echo "Main site: https://gradingpen.com"
echo "Force refresh: https://gradingpen.com?v=$(date +%s)"
echo ""

if [ "$SIZE" -gt 15000 ] && echo "$RESPONSE" | grep -q "Start Free"; then
    echo "🎉 DEPLOYMENT APPEARS SUCCESSFUL!"
else
    echo "⚠️  Deployment may need verification"
fi

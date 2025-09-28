#!/bin/bash

# Deployment Health Check Script
echo "🔍 Checking deployment health..."
echo "================================="

# You'll need to replace YOUR_NETLIFY_URL with your actual Netlify URL
NETLIFY_URL="https://your-app.netlify.app"

echo "📋 Pre-deployment checklist:"
echo "✅ Prisma postinstall script: $(grep -q 'postinstall.*prisma generate' package.json && echo 'FOUND' || echo 'MISSING')"
echo "✅ Build script with Prisma: $(grep -q 'build.*prisma generate' package.json && echo 'FOUND' || echo 'MISSING')"
echo "✅ Node version specified: $(grep -q 'NODE_VERSION.*18.20.8' netlify.toml && echo 'FOUND' || echo 'MISSING')"
echo "✅ .nvmrc file: $(test -f .nvmrc && echo 'FOUND' || echo 'MISSING')"
echo "✅ Dynamic API exports: $(grep -q 'dynamic.*force-dynamic' app/api/documents/route.ts && echo 'FOUND' || echo 'MISSING')"

echo ""
echo "📝 Environment variables to verify in Netlify UI:"
echo "   - NEXTAUTH_URL"
echo "   - NEXTAUTH_SECRET" 
echo "   - DATABASE_URL"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - OPENAI_API_KEY"

echo ""
echo "🚀 Once deployed, test these endpoints:"
echo "   - ${NETLIFY_URL}/ (Homepage)"
echo "   - ${NETLIFY_URL}/dashboard (Dashboard)"
echo "   - ${NETLIFY_URL}/api/auth/signin (Auth)"

echo ""
echo "🔧 If build fails, check Netlify logs for:"
echo "   - Prisma client generation errors"
echo "   - Missing environment variables"
echo "   - Node version conflicts"
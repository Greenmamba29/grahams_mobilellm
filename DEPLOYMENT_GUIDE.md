# Document Intelligence MVP - Netlify Deployment Guide

## Quick Deploy to Netlify

### 1. Connect GitHub Repository to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select repository: `Greenmamba29/grahams_mobilellm`
5. Branch: `main`
6. Build command: `npm run build`
7. Publish directory: `.next`

### 2. Configure Environment Variables

In Netlify dashboard, go to Site Settings > Environment Variables and add:

```bash
# Authentication
NEXTAUTH_URL=https://YOUR_SITE_NAME.netlify.app
NEXTAUTH_SECRET=your-random-secret-key-here

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@hostname:port/database

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI for AI Processing
OPENAI_API_KEY=sk-your-openai-api-key

# Stripe for Billing
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Optional: Node Environment
NODE_ENV=production
```

### 3. Set Up External Services

#### PostgreSQL Database
- **Recommended**: [Supabase](https://supabase.com/) (free tier available)
- **Alternative**: [Railway](https://railway.app/), [PlanetScale](https://planetscale.com/)
- Run: `npx prisma migrate deploy` after deployment

#### Supabase Storage
1. Create account at [Supabase](https://supabase.com/)
2. Create new project
3. Go to Storage > Create bucket named `documents`
4. Set bucket to public or configure RLS policies
5. Copy URL and keys to environment variables

#### OpenAI API
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add billing information for usage
3. Copy API key to environment variables

#### Stripe (Optional - for billing)
1. Create account at [Stripe](https://stripe.com/)
2. Get API keys from dashboard
3. Set up webhook endpoint: `https://your-site.netlify.app/api/webhooks/stripe`
4. Copy keys to environment variables

### 4. Deploy and Initialize Database

1. Click "Deploy site" in Netlify
2. Wait for build to complete
3. Run database migration:
   ```bash
   # In your local terminal
   npx prisma migrate deploy
   ```

### 5. Verify Deployment

Visit your Netlify site URL and check:
- ✅ Homepage loads
- ✅ Authentication works (sign up/in)
- ✅ Dashboard accessible after login
- ✅ Document upload functionality
- ✅ AI processing completes

## Troubleshooting

### Build Errors
- Check Netlify build logs
- Ensure all environment variables are set
- Verify Node version compatibility

### Database Connection Issues
- Verify DATABASE_URL format
- Check database server accessibility
- Run `npx prisma db push` if needed

### Storage Issues
- Verify Supabase bucket configuration
- Check CORS settings in Supabase
- Ensure proper RLS policies

### API Route Errors
- Check function logs in Netlify
- Verify all API keys are properly set
- Test endpoints individually

## Production Checklist

- [ ] All environment variables configured
- [ ] Database migrated and accessible
- [ ] Supabase storage bucket created
- [ ] OpenAI API key with billing set up
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring and analytics set up
- [ ] Backup strategy implemented

## Estimated Monthly Costs

- **Netlify**: $0-$19/month (Pro plan for custom domains)
- **Supabase**: $0-$25/month (database + storage)
- **OpenAI**: Variable based on usage (~$10-$50/month)
- **Stripe**: 2.9% + $0.30 per transaction

**Total**: ~$10-$94/month depending on usage and plan choices.

## Support

For deployment issues:
1. Check Netlify build logs
2. Review environment variables
3. Test individual API endpoints
4. Check external service status pages

The MVP is ready to generate revenue at $149/month per user!
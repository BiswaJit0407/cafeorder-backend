# Backend Deployment Guide for Vercel

## Prerequisites
1. Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas account for production database
3. Vercel CLI installed (optional): `npm install -g vercel`

## Environment Variables

Before deploying, you need to set up these environment variables in Vercel:

1. **MONGODB_URI** - Your MongoDB connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/restaurant_order_system`
   
2. **JWT_SECRET** - Secret key for JWT tokens
   - Example: `your_super_secret_jwt_key_here`
   
3. **PORT** - Port number (Vercel handles this automatically, but you can set it)
   - Default: `5000`

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository
4. Select the `backend` folder as the root directory
5. Add environment variables:
   - Go to "Environment Variables" section
   - Add `MONGODB_URI`
   - Add `JWT_SECRET`
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to backend directory:
   ```bash
   cd backend
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Follow the prompts and add environment variables when asked

6. For production deployment:
   ```bash
   vercel --prod
   ```

## Setting Environment Variables via CLI

```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
```

## After Deployment

1. Your backend will be available at: `https://your-project-name.vercel.app`

2. Update your frontend API URLs to point to the Vercel deployment:
   - Replace `http://localhost:5000` with your Vercel URL
   - Example: `https://your-backend.vercel.app`

3. Test your API endpoints:
   - Health check: `https://your-backend.vercel.app/api/health`
   - Menu: `https://your-backend.vercel.app/api/menu`

## Important Notes

- Vercel serverless functions have a 10-second execution timeout on the free plan
- MongoDB Atlas free tier is sufficient for development/testing
- Make sure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Vercel's IP ranges
- CORS is already configured in server.js to allow all origins

## Seeding Production Database

After deployment, you can seed your database by running the seed scripts locally with production MongoDB URI:

```bash
# Set production MongoDB URI temporarily
export MONGODB_URI="your_production_mongodb_uri"

# Seed admin
npm run seed:admin

# Seed menu
npm run seed:menu

# Or seed both
npm run seed:all
```

## Troubleshooting

1. **500 Error**: Check Vercel logs for detailed error messages
2. **Database Connection Failed**: Verify MongoDB URI and network access settings
3. **CORS Issues**: Ensure CORS is properly configured in server.js
4. **Environment Variables**: Double-check all environment variables are set correctly

## Monitoring

- View logs: https://vercel.com/dashboard → Your Project → Deployments → View Logs
- Monitor performance: Vercel Dashboard → Analytics

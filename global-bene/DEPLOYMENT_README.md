# 🚀 Global Bene Deployment Guide

This guide will help you deploy the Global Bene application to Render (backend) and Vercel (frontend).

## 📋 Prerequisites

- MongoDB Atlas account
- Render account
- Vercel account
- Mixpanel account (optional)
- Cloudinary account (for image uploads)
- Google OAuth credentials

## 🗄️ Backend Deployment (Render)

### 1. Prepare Backend for Deployment

```bash
cd backend

# Install dependencies
npm install

# Create production .env file
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your production values:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/globalbene?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
ACCESS_TOKEN_SECRET=your-access-token-secret-here
MIXPANEL_TOKEN=bfae4fe5c827d9d44ba994028b30d36a
FRONTEND_URL=https://your-vercel-domain.vercel.app
# ... other variables
```

### 3. Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `global-bene-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables in Render dashboard
6. Click "Create Web Service"

### 4. Health Check

Once deployed, verify the health endpoint:
```
curl https://your-backend-url.onrender.com/health
```

## 🎨 Frontend Deployment (Vercel)

### 1. Prepare Frontend for Deployment

```bash
cd frontend

# Install dependencies
npm install

# Create production .env file
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit the `.env.local` file:

```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 3. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables in Vercel dashboard
6. Click "Deploy"

### 4. Update Backend CORS

After frontend deployment, update the `FRONTEND_URL` in your Render environment variables to your Vercel domain.

## 🔧 Post-Deployment Configuration

### 1. Update Vercel Configuration

Edit `frontend/vercel.json` and replace:
```json
"dest": "https://your-backend-url.onrender.com/api/$1"
```

### 2. Seed Initial Data

```bash
# SSH into Render service or run locally
npm run seed-admin
npm run seed
```

### 3. Verify Analytics

1. Check Mixpanel dashboard for events
2. Verify nightly jobs are running (check logs)
3. Test admin analytics dashboard

## 📊 Monitoring & Maintenance

### Health Checks
- Backend: `https://your-backend.onrender.com/health`
- API Status: `https://your-backend.onrender.com/api/status`

### Logs
- **Render**: View logs in Render dashboard
- **Vercel**: View logs in Vercel dashboard

### Analytics Jobs
- Jobs run daily at 2 AM UTC
- Check `/api/admin/nightly-job-status` for job status
- Monitor MongoDB `nightlyjobs` collection

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is correctly set in Render
   - Check `vercel.json` API routing

2. **Database Connection**
   - Verify MongoDB Atlas IP whitelist
   - Check connection string format

3. **Analytics Not Working**
   - Verify `MIXPANEL_TOKEN` is set
   - Check Mixpanel project settings

4. **Build Failures**
   - Ensure all dependencies are in `package.json`
   - Check Node.js version compatibility

### Performance Optimization

1. **Enable Caching**
   - Configure Redis for session storage (optional)
   - Set up CDN for static assets

2. **Database Indexing**
   - Ensure proper indexes on frequently queried fields
   - Monitor slow queries

3. **Monitoring**
   - Set up error tracking (Sentry)
   - Configure uptime monitoring

## 🔒 Security Checklist

- [ ] Environment variables not committed to Git
- [ ] HTTPS enabled on all domains
- [ ] CORS properly configured
- [ ] JWT secrets are strong and unique
- [ ] Database IP restrictions in place
- [ ] Admin routes protected
- [ ] Rate limiting enabled
- [ ] Input validation in place

## 📞 Support

If you encounter issues:
1. Check the logs in Render/Vercel dashboards
2. Verify environment variables are set correctly
3. Test API endpoints individually
4. Check MongoDB Atlas connectivity

---

**🎉 Your Global Bene application is now live!**

Backend: `https://your-backend.onrender.com`
Frontend: `https://your-frontend.vercel.app`
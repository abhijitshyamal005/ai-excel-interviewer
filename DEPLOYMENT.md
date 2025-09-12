# Deployment Guide

This guide covers deploying the AI-Powered Excel Mock Interviewer to production.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- OpenAI API key or Google AI API key
- Vercel account (recommended for frontend)

## Environment Setup

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# AI Services (at least one required)
OPENAI_API_KEY="sk-..."
GOOGLE_AI_API_KEY="..."

# Authentication
JWT_SECRET="your-secure-jwt-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# Redis
REDIS_URL="redis://username:password@host:port"

# Application
NODE_ENV="production"
PORT=3000

# Optional: Email notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Optional: File storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="ai-excel-interviewer-files"
```

## Database Setup

### 1. Create PostgreSQL Database

```sql
CREATE DATABASE ai_excel_interviewer;
CREATE USER interviewer_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_excel_interviewer TO interviewer_user;
```

### 2. Run Database Migrations

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required environment variables

5. **Configure Database**
   - Use Railway, Supabase, or AWS RDS for PostgreSQL
   - Use Railway or Redis Cloud for Redis

### Option 2: Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=${DATABASE_URL}
         - REDIS_URL=${REDIS_URL}
         - OPENAI_API_KEY=${OPENAI_API_KEY}
         - JWT_SECRET=${JWT_SECRET}
       depends_on:
         - postgres
         - redis

     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: ai_excel_interviewer
         POSTGRES_USER: interviewer_user
         POSTGRES_PASSWORD: secure_password
       volumes:
         - postgres_data:/var/lib/postgresql/data

     redis:
       image: redis:7-alpine
       volumes:
         - redis_data:/data

   volumes:
     postgres_data:
     redis_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

### Option 3: AWS/GCP/Azure

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Create production bundle**
   ```bash
   npm ci --only=production
   ```

3. **Deploy to your cloud provider**
   - Configure load balancer
   - Set up auto-scaling
   - Configure monitoring

## Database Providers

### Railway (Recommended)
- Easy PostgreSQL and Redis setup
- Automatic backups
- Built-in monitoring

### Supabase
- PostgreSQL with built-in auth
- Real-time subscriptions
- Dashboard for database management

### AWS RDS + ElastiCache
- Enterprise-grade reliability
- Advanced monitoring and scaling
- Higher cost but maximum control

## Monitoring and Logging

### Application Monitoring
```bash
# Install monitoring tools
npm install @sentry/nextjs newrelic
```

### Health Checks
The application includes health check endpoints:
- `/api/health` - Application health
- `/api/health/db` - Database connectivity
- `/api/health/redis` - Redis connectivity

### Logging
- Application logs are structured JSON
- Use log aggregation services like:
  - Vercel Analytics
  - DataDog
  - New Relic
  - CloudWatch

## Performance Optimization

### 1. Enable Caching
```bash
# Redis caching is built-in
# Configure TTL values in config
```

### 2. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_interview_sessions_candidate_id ON interview_sessions(candidate_id);
CREATE INDEX idx_evaluation_results_session_id ON evaluation_results(session_id);
CREATE INDEX idx_excel_questions_category ON excel_questions(category);
```

### 3. CDN Setup
- Use Vercel's built-in CDN
- Or configure CloudFlare for custom domains

## Security Checklist

- [ ] JWT secrets are secure and rotated
- [ ] Database credentials are secure
- [ ] API keys are properly secured
- [ ] HTTPS is enforced
- [ ] Rate limiting is configured
- [ ] Input validation is implemented
- [ ] CORS is properly configured
- [ ] Security headers are set

## Backup Strategy

### Database Backups
```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Redis Backups
```bash
# Redis persistence is configured
# Snapshots are taken automatically
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer for multiple app instances
- Redis handles session sharing
- Database connection pooling

### Vertical Scaling
- Monitor CPU and memory usage
- Scale database resources as needed
- Optimize AI API usage

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check connection string
   npm run db:studio
   ```

2. **Redis Connection Issues**
   ```bash
   # Test Redis connectivity
   redis-cli ping
   ```

3. **AI API Errors**
   ```bash
   # Check API key validity
   # Monitor rate limits
   # Implement fallback strategies
   ```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm start
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Security scan completed
- [ ] Load testing performed
- [ ] Documentation updated

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Check AI service status
5. Review monitoring dashboards

## Cost Optimization

### AI API Usage
- Monitor token usage
- Implement caching for repeated evaluations
- Use appropriate model sizes

### Database Costs
- Regular cleanup of old sessions
- Archive completed interviews
- Optimize query performance

### Infrastructure
- Use auto-scaling to match demand
- Monitor resource utilization
- Regular cost reviews
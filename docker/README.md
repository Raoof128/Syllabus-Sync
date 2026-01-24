# Docker Support for The Syllabus Sync

**Containerized Development & Production Deployments**

This directory contains Docker configurations for development, testing, and production environments.

## 🚀 Quick Start

### **Development Environment**

```bash
# Build and start development container
docker-compose up --build dev

# View logs
docker-compose logs -f dev

# Stop container
docker-compose down
```

### **Production Build**

```bash
# Build production image
docker build -t syllabus-sync:latest .

# Run production container
docker run -p 3000:3000 -e NODE_ENV=production syllabus-sync:latest
```

## 📁 File Overview

### **Dockerfile**

Multi-stage build optimized for production:

- **Base:** Node.js 22 Alpine Linux
- **Build Stage:** Install dependencies and build application
- **Production Stage:** Minimal runtime image with built application
- **Security:** Non-root user, health checks, optimized layers

### **docker-compose.yml**

Development orchestration with:

- **Services:** Application, PostgreSQL, Redis
- **Volumes:** Live code mounting, database persistence
- **Environment:** Development configuration with hot reload
- **Networking:** Internal service communication

### **docker-compose.prod.yml**

Production deployment with:

- **Services:** Application behind Nginx reverse proxy
- **Volumes:** Persistent data storage
- **Environment:** Production-optimized settings
- **Health Checks:** Automated service monitoring

## 🛠️ Development Workflow

### **Container Development**

```bash
# Start development environment
docker-compose up --build dev

# Execute commands inside container
docker-compose exec dev npm run dev

# Access container shell
docker-compose exec dev sh
```

### **Database Management**

```bash
# Access PostgreSQL
docker-compose exec db psql -U postgres -d syllabus_sync

# Backup database
docker-compose exec db pg_dump -U postgres syllabus_sync > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres syllabus_sync < backup.sql
```

## 🔧 Configuration

### **Environment Variables**

| Variable              | Development             | Production        | Description         |
| --------------------- | ----------------------- | ----------------- | ------------------- |
| `NODE_ENV`            | `development`           | `production`      | Environment mode    |
| `DATABASE_URL`        | Local PostgreSQL        | Supabase URL      | Database connection |
| `REDIS_URL`           | Local Redis             | Upstash Redis     | Cache & sessions    |
| `NEXTAUTH_SECRET`     | Local secret            | Production secret | Authentication      |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Production URL    | Application URL     |

### **Health Checks**

```dockerfile
# Application health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Database health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD pg_isready -U postgres || exit 1
```

## 🚢 Deployment Options

### **Docker Compose (Recommended)**

```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### **Kubernetes**

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=syllabus-sync
```

### **Cloud Platforms**

- **AWS ECS:** Push to ECR and deploy with ECS
- **Google Cloud Run:** Build with Cloud Build and deploy
- **Azure Container Apps:** Deploy ACI instances
- **DigitalOcean App Platform:** Direct container deployment

## 🔍 Troubleshooting

### **Common Issues**

1. **Port Conflicts**

   ```bash
   # Kill existing processes
   pkill -f "node.*next"

   # Or use different port
   docker-compose up --build -p 3001:3000 dev
   ```

2. **Permission Errors**

   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER .next
   ```

3. **Build Failures**
   ```bash
   # Clear cache and rebuild
   docker-compose down --volumes
   docker system prune -f
   docker-compose up --build
   ```

## 📊 Performance

### **Production Optimizations**

- **Multi-stage builds** reduce image size by 60%
- **Alpine Linux** minimal attack surface
- **Nginx reverse proxy** for static asset serving
- **Health checks** for orchestration platforms
- **Resource limits** prevent OOM errors

### **Security Features**

- **Non-root user** execution
- **Read-only filesystem** where possible
- **Minimal base image** with security patches
- **Environment variable** injection (no hardcoded secrets)
- **Health monitoring** and automated restarts

## 🔄 CI/CD Integration

### **GitHub Actions**

```yaml
# Example GitHub Action step
- name: Build and Push Docker Image
  run: |
    docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .
    docker push ghcr.io/${{ github.repository }}:${{ github.sha }}
```

### **Automated Deployment**

```yaml
# Example deployment step
- name: Deploy to Production
  run: |
    docker-compose -f docker-compose.prod.yml pull
    docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Best Practices

### **Security**

- Use `.dockerignore` to exclude sensitive files
- Scan images for vulnerabilities with `docker scan`
- Regular base image updates
- Implement resource quotas and limits

### **Performance**

- Use `.dockerignore` to minimize context size
- Leverage Docker layer caching
- Optimize for specific target architecture
- Monitor resource usage and set appropriate limits

### **Operations**

- Implement centralized logging with structured JSON
- Use health checks for automated monitoring
- Backup persistent volumes regularly
- Implement graceful shutdown handling

---

**Container Ready Development Environment** 🐳

_For detailed deployment instructions, see [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)_

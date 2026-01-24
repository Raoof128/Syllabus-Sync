# Kubernetes Deployment Configuration

**Production-Ready K8s Manifests for The Syllabus Sync**

## 🚀 Quick Deploy

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=syllabus-sync

# View services
kubectl get services -l app=syllabus-sync

# Access application
minikube service syllabus-sync --url
```

## 📁 Manifest Files Overview

### **namespace.yaml**

Creates dedicated namespace for application isolation and resource management.

### **configmap.yaml**

Application configuration including:

- Database connection strings
- Redis cache URLs
- Authentication secrets
- Environment-specific settings

### **secret.yaml**

Sensitive data management:

- Database credentials
- API keys and tokens
- TLS certificates
- OAuth secrets

### **deployment.yaml**

Application deployment with:

- Multi-replica deployment (2-3 pods)
- Resource limits and requests
- Health check configuration
- Rolling update strategy

### **service.yaml**

Network exposure configuration:

- LoadBalancer service type
- HTTP/HTTPS port mapping
- Health check endpoints
- Session affinity

### **ingress.yaml**

External access configuration:

- SSL/TLS termination
- Custom domain routing
- Rate limiting
- Path-based routing

### **hpa.yaml**

Auto-scaling configuration:

- CPU-based horizontal scaling
- Memory-based triggers
- Custom metrics integration
- Scaling limits and policies

## ⚙️ Configuration

### **Environment Variables**

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: syllabus-sync-config
  namespace: syllabus-sync
data:
  NODE_ENV: 'production'
  APP_PORT: '3000'
  NEXT_PUBLIC_APP_URL: 'https://app.syllabus-sync.dev'
  REDIS_HOST: 'redis-service'
  REDIS_PORT: '6379'
```

### **Secrets Management**

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: syllabus-sync-secrets
  namespace: syllabus-sync
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  NEXTAUTH_SECRET: <base64-encoded-secret>
  REDIS_PASSWORD: <base64-encoded-password>
```

## 🔧 Deployment Strategies

### **Blue-Green Deployment**

```yaml
# deployment-blue.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: syllabus-sync-blue
  namespace: syllabus-sync
spec:
  replicas: 2
  selector:
    matchLabels:
      app: syllabus-sync
      version: blue
---
# deployment-green.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: syllabus-sync-green
  namespace: syllabus-sync
spec:
  replicas: 2
  selector:
    matchLabels:
      app: syllabus-sync
      version: green
```

### **Canary Deployment**

```yaml
# deployment-canary.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: syllabus-sync-canary
  namespace: syllabus-sync
spec:
  replicas: 1
  selector:
    matchLabels:
      app: syllabus-sync
      version: canary
```

## 📊 Monitoring & Logging

### **Prometheus Integration**

```yaml
# service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: syllabus-sync-monitor
  namespace: syllabus-sync
spec:
  selector:
    matchLabels:
      app: syllabus-sync
  endpoints:
    - port: http
      path: /api/metrics
      interval: 30s
```

### **Grafana Dashboard**

- Application performance metrics
- Database connection monitoring
- Redis cache efficiency
- Error rate and latency tracking

## 🔒 Security Configuration

### **Network Policies**

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: syllabus-sync-netpol
  namespace: syllabus-sync
spec:
  podSelector:
    matchLabels:
      app: syllabus-sync
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
```

### **Pod Security Policies**

```yaml
# pod-security-policy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: syllabus-sync-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
```

## 🚦 Scaling Configuration

### **Horizontal Pod Autoscaler**

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: syllabus-sync-hpa
  namespace: syllabus-sync
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: syllabus-sync
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## 🔍 Troubleshooting

### **Common Issues**

1. **Pod Fails to Start**

   ```bash
   # Check pod logs
   kubectl logs -l app=syllabus-sync -f

   # Describe pod for events
   kubectl describe pod -l app=syllabus-sync
   ```

2. **Service Not Accessible**

   ```bash
   # Check service endpoints
   kubectl get endpoints -l app=syllabus-sync

   # Test connectivity
   kubectl port-forward service/syllabus-sync 3000:3000
   ```

3. **Resource Issues**

   ```bash
   # Check resource usage
   kubectl top pods -l app=syllabus-sync

   # Check resource limits
   kubectl describe pod -l app=syllabus-sync | grep -A 10 Limits
   ```

### **Rollback Commands**

```bash
# Rollback to previous revision
kubectl rollout undo deployment/syllabus-sync -n syllabus-sync

# Check rollback status
kubectl rollout status deployment/syllabus-sync -n syllabus-sync
```

## 🌐 Cloud Provider Integration

### **Google Kubernetes Engine (GKE)**

```bash
# Create GKE cluster
gcloud container clusters create syllabus-sync \
  --num-nodes=3 \
  --machine-type=e2-standard-2 \
  --region=us-central1

# Configure kubectl
gcloud container clusters get-credentials syllabus-sync \
  --region=us-central1

# Deploy
kubectl apply -f k8s/
```

### **Amazon EKS**

```bash
# Create EKS cluster
eksctl create cluster --name syllabus-sync \
  --version 1.28 \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3

# Deploy
kubectl apply -f k8s/
```

### **Azure Kubernetes Service (AKS)**

```bash
# Create AKS cluster
az group create --name syllabus-sync-rg --location eastus
az aks create --resource-group syllabus-sync-rg \
  --name syllabus-sync-cluster --node-count 3 \
  --node-vm-size Standard_DS2_v2 --generate-ssh-keys

# Deploy
kubectl apply -f k8s/
```

## 📚 Best Practices

### **Resource Management**

- Set appropriate resource requests and limits
- Use horizontal pod autoscaling
- Implement resource quotas
- Monitor resource utilization regularly

### **Security**

- Use secrets for sensitive data
- Implement network policies
- Enable pod security policies
- Regular security scans and updates

### **Reliability**

- Use multiple replicas for high availability
- Implement proper health checks
- Use readiness and liveness probes
- Configure graceful shutdown

### **Monitoring**

- Centralized logging with structured format
- Metrics collection for performance
- Alerting for critical failures
- Regular backup and disaster recovery

---

**Production-Ready Kubernetes Deployment** ☸️

_For cloud-specific deployment guides, see our cloud provider documentation._

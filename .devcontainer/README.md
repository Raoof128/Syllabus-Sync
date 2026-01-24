# Development Environment Configuration

**Comprehensive Dev Container Setup for The Syllabus Sync**

This repository includes Dev Container configuration for consistent, reproducible development environments across VS Code, GitHub Codespaces, and local development.

## 🚀 Quick Start

### **VS Code**

1. Install [Remote Development extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open repository in VS Code
3. Press `F1` and select "Dev Containers: Reopen in Container"

### **GitHub Codespaces**

1. Open repository in GitHub Codespaces
2. Container automatically builds and starts
3. Access web application at forwarded port

### **Local Docker**

```bash
# Build and start container
docker-compose -f docker-compose.dev.yml up --build

# Access shell in container
docker-compose exec dev bash
```

## 📁 Configuration Files

### **.devcontainer/devcontainer.json**

Primary development container definition:

- **Base Image:** Ubuntu 22.04 with Node.js 22
- **Features:** Docker-in-Docker, GitHub CLI, Zsh shell
- **Customizations:** VS Code extensions, port forwards, environment
- **Mounts:** Git configuration, SSH keys, development volumes

### **docker-compose.dev.yml**

Development services orchestration:

- **Application:** Main Next.js development server
- **Database:** PostgreSQL 15 with development data
- **Redis:** Cache and session storage
- **Tools:** PgAdmin, Redis Commander (optional profiles)

## 🛠️ Environment Setup

### **Installed Tools**

```bash
# Development tools
- Node.js 22.x with npm
- PostgreSQL 15 client tools
- Redis CLI
- Docker & Docker Compose
- Git with GitHub CLI
- Zsh with Oh My Zsh framework
- VS Code Server (for web-based editing)
- curl, wget, jq for API testing
- vim, nano for text editing
```

### **VS Code Extensions**

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-playwright.playwright",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### **Development Scripts**

```bash
# Container entry point commands
npm install                    # Install dependencies
npm run dev                   # Start development server
npm run test                   # Run unit tests
npm run test:watch            # Watch mode testing
npm run lint                  # Code quality checks
npm run typecheck             # TypeScript compilation
npm run format                 # Code formatting
npm run db:migrate            # Database migrations
npm run db:seed               # Seed development data
```

## 🔧 Customization Options

### **Environment Variables**

Create `.devcontainer/devcontainer.env` for custom settings:

```bash
# Development configuration
NODE_ENV=development
APP_PORT=3000
DB_PORT=5432
REDIS_PORT=6379

# Feature flags
ENABLE_MOCK_APIS=false
ENABLE_DEBUG_MODE=true
ENABLE_PERFORMANCE_MONITORING=false

# Personal preferences
GIT_USER_NAME="Your Name"
GIT_USER_EMAIL="your.email@example.com"
DEFAULT_SHELL=/bin/zsh
```

### **VS Code Settings**

Customize VS Code behavior in `.devcontainer/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": ["typescript", "typescriptreact"],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## 🌐 Network Configuration

### **Port Forwarding**

Default forwarded ports:

- **3000:** Next.js development server
- **3001:** Storybook (if enabled)
- **8080:** PgAdmin interface
- **8081:** Redis Commander
- **9229:** VS Code debug port
- **6070:** BrowserSync or livereload

### **Service Discovery**

Internal container services available at:

- **Application:** `http://localhost:3000`
- **Database:** `postgresql://localhost:5432/syllabus_sync`
- **Redis:** `redis://localhost:6379`
- **API Health:** `http://localhost:3000/api/health`

## 📊 Performance Optimizations

### **Build Optimization**

```dockerfile
# Multi-stage builds reduce image size
FROM node:22-alpine AS deps
# Install dependencies and cache layers
FROM node:22-alpine AS builder
# Build application with proper caching
FROM node:22-alpine AS runner
# Minimal runtime image
```

### **Development Experience**

- **Hot Reload:** Fast development with file watching
- **Volume Mounting:** Live code synchronization
- **Dependency Caching:** Accelerated npm install times
- **Parallel Testing:** Multi-core test execution
- ** IntelliSense:** Full TypeScript and CSS support

## 🔍 Troubleshooting

### **Common Issues**

1. **Port Conflicts**

   ```bash
   # Check port usage
   netstat -tulpn | grep :3000

   # Modify in .devcontainer.json
   "forwardPorts": [3001, 3002]
   ```

2. **Permission Issues**

   ```bash
   # Fix file permissions
   sudo chown -R vscode:vscode /workspace
   chmod -R 755 /workspace
   ```

3. **Memory Constraints**

   ```bash
   # Increase Docker memory
   # In Docker Desktop settings or
   docker-compose up --build --scale app=1
   ```

4. **Extension Installation**
   ```bash
   # Install VS Code extensions manually
   code --install-extension ms-vscode.vscode-typescript-next
   ```

### **Debug Mode**

Enable enhanced debugging in `.devcontainer/devcontainer.json`:

```json
{
  "customizations": {
    "vscode": {
      "extensions": ["ms-vscode.vscode-typescript-next", "ms-vscode.vscode-chrome-debug"],
      "settings": {
        "debug.node.autoAttach": "on",
        "debug.javascript.terminal": "integrated"
      }
    }
  }
}
```

## 🎯 Development Workflow

### **Day-to-Day Development**

1. **Container Start:** `docker-compose -f docker-compose.dev.yml up -d`
2. **VS Code Connect:** Remote explorer → Attach to running container
3. **Feature Development:** Create branches, write code, commit changes
4. **Quality Checks:** `npm run lint`, `npm run test`, `npm run typecheck`
5. **Database Changes:** Run migrations and seed data as needed
6. **Testing:** Unit tests in container, E2E tests via Playwright

### **Git Integration**

```bash
# Git configuration in container
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# SSH key forwarding
ssh-add ~/.ssh/id_rsa
```

## 🚢 Production Parity

### **Environment Consistency**

Dev container closely mirrors production:

- **Same Node.js version** (22.x LTS)
- **Identical package versions** via package-lock.json
- **Similar environment variables** (with development overrides)
- **Production build process** available for testing

### **Testing Strategy**

```bash
# Production-like testing
NODE_ENV=test npm run test:coverage
NODE_ENV=production npm run build

# Integration testing
docker-compose -f docker-compose.test.yml up
```

## 📚 Learning Resources

### **Dev Container Documentation**

- [Dev Containers Specification](https://containers.dev/implementors/spec/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)

### **Best Practices**

- Keep images small and focused
- Use .dockerignore effectively
- Implement proper health checks
- Version control your dev container definitions

---

**Consistent Development Environment** 🐳

_For production deployment instructions, see [docker/README.md](docker/README.md)_

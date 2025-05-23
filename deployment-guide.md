# AWS部署指南

## 问题分析

从截图可以看出，前端应用部署在AWS (`3.104.77.41:3001`)，但仍然尝试访问本地后端 (`localhost:8080`)，导致CORS错误。

## 解决方案

### 1. 前端配置修改

前端代码现在支持动态API配置：

- **开发环境**: 自动使用 `http://localhost:8080/api/v1`
- **生产环境**: 使用环境变量 `REACT_APP_API_URL` 或相对路径 `/api/v1`

### 2. 部署选项

#### 选项A: 使用相对路径 + Nginx代理（推荐）

1. **前端设置**: 使用相对路径 `/api/v1`
2. **Nginx配置**: 将 `/api/v1` 代理到后端服务

```bash
# 构建前端时设置环境变量
docker build --build-arg REACT_APP_API_URL=/api/v1 -t resume-frontend .

# 运行时设置后端URL
docker run -e BACKEND_URL=http://your-backend-host:8080 -p 3001:80 resume-frontend
```

#### 选项B: 直接配置后端URL

```bash
# 构建时指定后端完整URL
docker build --build-arg REACT_APP_API_URL=http://your-backend-aws-url/api/v1 -t resume-frontend .

# 运行
docker run -p 3001:80 resume-frontend
```

### 3. AWS部署步骤

#### 3.1 后端部署

1. 确保后端服务正在运行
2. 记录后端的AWS地址（例如：`http://3.104.77.41:8080`）

#### 3.2 前端部署

**如果使用选项A（推荐）**:
```bash
# 重新构建前端镜像
cd resume-frontend
docker build -t resume-frontend .

# 运行时设置正确的后端URL
docker run -e BACKEND_URL=http://3.104.77.41:8080 -p 3001:80 resume-frontend
```

**如果使用选项B**:
```bash
# 重新构建前端镜像，指定后端URL
cd resume-frontend
docker build --build-arg REACT_APP_API_URL=http://3.104.77.41:8080/api/v1 -t resume-frontend .

# 运行
docker run -p 3001:80 resume-frontend
```

### 4. 验证部署

1. 访问前端: `http://3.104.77.41:3001`
2. 检查Network面板，确认API请求指向正确的后端地址
3. 测试简历上传功能

### 5. 环境变量配置

创建 `.env.production` 文件：

```env
# 生产环境配置
REACT_APP_API_URL=http://your-backend-aws-url/api/v1

# 或者使用相对路径（配合nginx代理）
REACT_APP_API_URL=/api/v1
```

### 6. Docker Compose配置（如果使用）

更新 `docker-compose.yml`:

```yaml
services:
  frontend:
    build:
      context: ./resume-frontend
      args:
        - REACT_APP_API_URL=/api/v1
    environment:
      - BACKEND_URL=http://backend:8080
    ports:
      - "3001:80"
```

## 故障排除

1. **检查Network面板**: 确认API请求的目标URL
2. **检查CORS**: 后端已经配置了CORS，但确保没有其他网络层阻止
3. **检查防火墙**: 确保AWS安全组允许相应端口的访问
4. **检查服务状态**: 确认后端服务正常运行并可访问 
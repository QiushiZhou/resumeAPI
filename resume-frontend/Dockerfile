FROM node:18-alpine as build

WORKDIR /app

# 使用缓存层安装依赖
COPY package.json package-lock.json ./
RUN npm ci --silent

# 复制源代码
COPY . .

# 构建应用
ARG REACT_APP_API_URL=http://backend:8080/api/v1
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 从构建阶段复制构建好的静态文件
COPY --from=build /app/build /usr/share/nginx/html

# 添加自定义nginx配置
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# 如果nginx.conf不存在，创建一个默认配置
RUN if [ ! -f /etc/nginx/conf.d/default.conf ]; then \
    echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/v1 { \
        proxy_pass http://resume-backend:8080/api/v1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf; \
fi

# 暴露80端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]

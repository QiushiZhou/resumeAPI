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

# 复制nginx配置文件和模板
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/nginx.conf.template /etc/nginx/templates/

# 设置环境变量默认值
ENV BACKEND_URL=http://backend:8080

# 安装envsubst工具（如果不存在）
RUN apk add --no-cache gettext

# 创建启动脚本来处理nginx配置模板
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'if [ -f /etc/nginx/templates/nginx.conf.template ]; then' >> /docker-entrypoint.sh && \
    echo '  envsubst "\$BACKEND_URL" < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# 暴露80端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# 启动Nginx（使用自定义启动脚本）
CMD ["/docker-entrypoint.sh"]

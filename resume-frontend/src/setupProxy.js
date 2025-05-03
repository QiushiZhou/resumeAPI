const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log("======= 代理服务器初始化 =======");
  
  // 代理整个/proxy路径
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:5005',
    changeOrigin: true,
    pathRewrite: function(path, req) {
      // 移除'/proxy'前缀
      const newPath = path.replace(/^\/proxy/, '');
      console.log(`代理请求路径: ${path} -> ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[代理请求] ${req.method} ${req.url} → http://localhost:5005${req.url.replace(/^\/proxy/, '')}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[代理响应] ${proxyRes.statusCode} ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[代理错误] ${req.method} ${req.url}:`, err.message);
      // 提供更友好的错误消息给客户端
      res.writeHead(500, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({
        error: '代理服务器错误，无法连接到目标服务',
        message: err.message
      }));
    }
  });
  
  app.use('/proxy', apiProxy);
  
  // 专门为Docker API添加一个额外的代理
  const dockerApiProxy = createProxyMiddleware({
    target: 'http://localhost:5005',
    changeOrigin: true,
    pathRewrite: function(path, req) {
      return '/api/match_jobs'; // 无论请求什么路径，都转到这个端点
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Docker API请求] ${req.method} ${req.url} → http://localhost:5005/api/match_jobs`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Docker API响应] ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`[Docker API错误]:`, err.message);
    }
  });
  
  app.use('/docker-api', dockerApiProxy);
}; 
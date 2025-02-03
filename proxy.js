import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Proxy only requests starting with "/"
app.use(
  '/',
  createProxyMiddleware({
    target: 'https://nettleweb.com', // Your target URL
    changeOrigin: true,            // Changes the `Host` header to match the target
    secure: true,                  // Validate HTTPS certificates
    followRedirects: true,         // Automatically follow redirects
    logLevel: 'debug',             // Debug logs for troubleshooting
    onProxyReq: (proxyReq, req) => {
      console.log(`Proxying request to: ${req.originalUrl}`);
    },
    onProxyRes: (proxyRes) => {
      console.log(`Received response with status: ${proxyRes.statusCode}`);
    },
  })
);

// Codespaces requires the app to listen on 0.0.0.0 and PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});

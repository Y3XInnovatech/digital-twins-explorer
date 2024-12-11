const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Proxy for API requests to the local backend server
  app.use(
    "/api",
    createProxyMiddleware({
      // eslint-disable-next-line line-comment-position, no-inline-comments
      target: "http://localhost:5000", // Local backend server
      // eslint-disable-next-line line-comment-position, no-inline-comments
      changeOrigin: true, // Ensures the Host header matches the target
      headers: {
        // eslint-disable-next-line line-comment-position, no-inline-comments
        connection: "keep-alive" // Keeps the connection alive for better performance
      },
      onProxyReq: proxyReq => {
        // Remove unnecessary headers (e.g., origin and referer) for cleaner requests
        if (proxyReq.getHeader("origin")) {
          proxyReq.removeHeader("origin");
          proxyReq.removeHeader("referer");
        }
      }
    })
  );

  // Proxy for the "/models" endpoint
  app.use(
    "/models",
    createProxyMiddleware({
      // eslint-disable-next-line line-comment-position, no-inline-comments
      target: "http://localhost:5000", // Local backend server
      // eslint-disable-next-line line-comment-position, no-inline-comments
      changeOrigin: true, // Ensures the Host header matches the target
      pathRewrite: {
        // eslint-disable-next-line line-comment-position, no-inline-comments
        "^/models": "/models" // Optional: Rewrite "/models" if needed
      }
    })
  );

  // Proxy for the "/twins" endpoint
  app.use(
    "/twins",
    createProxyMiddleware({
      // eslint-disable-next-line line-comment-position, no-inline-comments
      target: "http://localhost:5000", // Local backend server
      changeOrigin: true,
      pathRewrite: {
        // eslint-disable-next-line line-comment-position, no-inline-comments
        "^/twins": "/twins" // Optional: Rewrite "/twins" if needed
      }
    })
  );

  // Add additional proxy rules here as needed
};

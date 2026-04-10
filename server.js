const express = require('express');
const path = require('path');
const http = require('http');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://product-service:80';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://order-service:80';

function proxyRequest(targetBase, req, res) {
  const url = new URL(targetBase + req.url);
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + url.search,
    method: req.method,
    headers: { 'Content-Type': 'application/json' }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.status(500).json({ error: 'Invalid response from service' });
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Service unavailable' });
  });

  if (req.method !== 'GET' && req.body) {
    proxyReq.write(JSON.stringify(req.body));
  }
  proxyReq.end();
}

app.use('/api/products', (req, res) => {
  proxyRequest(PRODUCT_SERVICE + '/products', req, res);
});

app.use('/api/orders', (req, res) => {
  proxyRequest(ORDER_SERVICE + '/orders', req, res);
});

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'store-front' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Store Front running on port ${PORT}`));
const express = require('express');
const path = require('path');
const http = require('http');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PRODUCT_HOST = 'product-service';
const PRODUCT_PORT = 80;
const ORDER_HOST = 'order-service';
const ORDER_PORT = 80;

function proxy(host, port, remotePath, method, body, res) {
  const options = {
    hostname: host,
    port: port,
    path: remotePath,
    method: method,
    headers: { 'Content-Type': 'application/json' },
    timeout: 5000
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try { res.json(JSON.parse(data)); }
      catch (e) { res.status(500).json({ error: 'Parse error' }); }
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.status(504).json({ error: 'Service timeout' });
  });

  proxyReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  if (body) proxyReq.write(JSON.stringify(body));
  proxyReq.end();
}

app.get('/api/products', (req, res) => {
  proxy(PRODUCT_HOST, PRODUCT_PORT, '/products', 'GET', null, res);
});

app.post('/api/orders', (req, res) => {
  proxy(ORDER_HOST, ORDER_PORT, '/orders', 'POST', req.body, res);
});

app.get('/api/orders', (req, res) => {
  proxy(ORDER_HOST, ORDER_PORT, '/orders', 'GET', null, res);
});

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'store-front' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Store Front running on port ${PORT}`));
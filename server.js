const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://order-service:3000';

// Proxy routes — browser calls /api/products, server forwards to product-service internally
app.use('/api/products', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const url = `${PRODUCT_SERVICE}/products${req.url === '/' ? '' : req.url}`;
    const options = { method: req.method, headers: { 'Content-Type': 'application/json' } };
    if (req.method !== 'GET') options.body = JSON.stringify(req.body);
    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Product service unavailable' });
  }
});

app.use('/api/orders', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const url = `${ORDER_SERVICE}/orders${req.url === '/' ? '' : req.url}`;
    const options = { method: req.method, headers: { 'Content-Type': 'application/json' } };
    if (req.method !== 'GET') options.body = JSON.stringify(req.body);
    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Order service unavailable' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'store-front' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Store Front running on port ${PORT}`));
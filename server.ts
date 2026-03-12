import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('database.sqlite');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price INTEGER,
    quantity INTEGER,
    warranty TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS warranty_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );
`);

// Seed initial data if empty
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare('INSERT INTO products (name, description, price, quantity, warranty, category) VALUES (?, ?, ?, ?, ?, ?)');
  insertProduct.run('Via Philippines Cổ', 'Via cổ PH, kháng 272, bao login', 150000, 50, 'Bao login 24h', 'Via');
  insertProduct.run('BM350 Kháng', 'BM350 đã kháng, limit 350$', 450000, 10, 'Bao add thẻ', 'BM');
  insertProduct.run('Clone Nuôi Cứng', 'Clone nuôi trên 1 tháng, có avatar', 5000, 1000, 'Bao login', 'Clone');
}

const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
if (settingsCount.count === 0) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('zaloPhone', '0943304685');
  insertSetting.run('bankAccount', '8396869395');
  insertSetting.run('bankName', 'Techcombank');
  insertSetting.run('adminPassword', 'admin123');
}

const policyCount = db.prepare('SELECT COUNT(*) as count FROM warranty_policies').get() as { count: number };
if (policyCount.count === 0) {
  const insertPolicy = db.prepare('INSERT INTO warranty_policies (title, content) VALUES (?, ?)');
  insertPolicy.run('Lỗi đăng nhập', 'Bảo hành 1 đổi 1 nếu tài khoản sai pass hoặc bị checkpoint ngay khi đăng nhập lần đầu.');
  insertPolicy.run('Thời gian bảo hành', 'Tất cả tài khoản được bảo hành trong vòng 24h kể từ lúc mua.');
  insertPolicy.run('Từ chối bảo hành', 'Không bảo hành via login die 282 180 ngày (bảo hành die từ trước <180 ngày). Không bảo hành nếu khách hàng đã đổi thông tin hoặc vi phạm chính sách Facebook sau khi đăng nhập.');
}

const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
if (categoryCount.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
  ['Via', 'BM', 'Clone'].forEach(cat => insertCat.run(cat));
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get('/api/categories', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories').all();
    res.json(categories);
  });

  app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: 'Danh mục đã tồn tại' });
    }
  });

  app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products);
  });

  app.post('/api/products', (req, res) => {
    const { name, description, price, quantity, warranty, category } = req.body;
    const result = db.prepare('INSERT INTO products (name, description, price, quantity, warranty, category) VALUES (?, ?, ?, ?, ?, ?)').run(name, description, price, quantity, warranty, category);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, price, quantity, warranty, category } = req.body;
    db.prepare('UPDATE products SET name = ?, description = ?, price = ?, quantity = ?, warranty = ?, category = ? WHERE id = ?').run(name, description, price, quantity, warranty, category, id);
    res.json({ success: true });
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
    const settingsObj = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json(settingsObj);
  });

  app.post('/api/settings', (req, res) => {
    const { zaloPhone, bankAccount, bankName, adminPassword } = req.body;
    const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    if (zaloPhone) update.run('zaloPhone', zaloPhone);
    if (bankAccount) update.run('bankAccount', bankAccount);
    if (bankName) update.run('bankName', bankName);
    if (adminPassword) update.run('adminPassword', adminPassword);
    res.json({ success: true });
  });

  app.get('/api/policies', (req, res) => {
    const policies = db.prepare('SELECT * FROM warranty_policies').all();
    res.json(policies);
  });

  app.post('/api/policies', (req, res) => {
    const { title, content } = req.body;
    const result = db.prepare('INSERT INTO warranty_policies (title, content) VALUES (?, ?)').run(title, content);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/policies/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    db.prepare('UPDATE warranty_policies SET title = ?, content = ? WHERE id = ?').run(title, content, id);
    res.json({ success: true });
  });

  app.delete('/api/policies/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM warranty_policies WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

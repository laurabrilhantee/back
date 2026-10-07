require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não definido. Configure JWT_SECRET no ambiente do backend.');
}
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Inicializa o banco de dados (cria tabelas automaticamente)
require('./database/database');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Garante que a pasta de uploads existe
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Servir imagens estáticas
app.use('/uploads', express.static(uploadsDir));

// ─── Rotas ───────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mensagem: 'API Nana & Mimi está funcionando!' });
});

// ─── Seed automático no primeiro start ──────────────────
const { seed } = require('./database/seed');
seed();

// ─── Tratamento global de erros ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

// ─── Iniciar servidor ───────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor Nana & Mimi rodando em http://localhost:${PORT}`);
  console.log(`📦 API disponível em http://localhost:${PORT}/health`);
  console.log(`🖼️  Imagens servidas em http://localhost:${PORT}/uploads/`);
  console.log(`🌐 Frontend esperado em ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});

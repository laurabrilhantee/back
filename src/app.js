require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Inicializa o banco de dados
require('./database/database');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

// ─── CORS ────────────────────────────────────────────────

const allowedOrigins = [
'http://localhost:5173',
'http://localhost:3000',

// Vercel - domínio atual
'https://1fjstwfyh-35hecb1pr-laurabrilhante1.vercel.app',

// Vercel - domínio anterior
'https://1fjstwfyh-gs8bw2fze-laurabrilhante1.vercel.app',

// Vercel - domínio antigo
'https://delta-tan-40.vercel.app'
];

app.use(cors({
origin: function (origin, callback) {
// Permite requisições sem origin
if (!origin) {
return callback(null, true);
}

if (allowedOrigins.includes(origin)) {
return callback(null, true);
}

console.log('❌ Origem bloqueada pelo CORS:', origin);

return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
},
credentials: true
}));

// ─── Middlewares ─────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Pasta de uploads ────────────────────────────────────

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
fs.mkdirSync(uploadsDir, { recursive: true });
}

// Servir imagens
app.use('/uploads', express.static(uploadsDir));

// ─── Rotas ───────────────────────────────────────────────

app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);

// ─── Health Check ────────────────────────────────────────

app.get('/health', (req, res) => {
res.json({
status: 'ok',
mensagem: 'API Nana & Mimi está funcionando!'
});
});

// ─── Seed automático ─────────────────────────────────────

const { seed } = require('./database/seed');

seed();

// ─── Tratamento global de erros ──────────────────────────

app.use((err, req, res, next) => {
console.error('Erro:', err.stack);

res.status(500).json({
erro: 'Erro interno do servidor.'
});
});

// ─── Iniciar servidor ────────────────────────────────────

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
console.log('');
console.log('🚀 Servidor Nana & Mimi rodando');
console.log(`📡 Porta: ${PORT}`);
console.log(`📦 API: /health`);
console.log(`🖼️ Imagens: /uploads/`);
console.log('');
});

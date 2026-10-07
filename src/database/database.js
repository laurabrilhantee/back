const Database = require('better-sqlite3');
const path = require('path');

// Caminho do banco SQLite
// O arquivo database.sqlite fica na mesma pasta deste arquivo database.js
const dbPath = path.join(__dirname, 'database.sqlite');

const db = new Database(dbPath);

// Configurações do SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Criação das Tabelas ───────────────────────────────────────────

db.exec(`
  -- Tabela de clientes/usuários
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de funcionários
  CREATE TABLE IF NOT EXISTS funcionarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    cargo TEXT NOT NULL DEFAULT 'funcionario',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de produtos/roupas
  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco REAL NOT NULL,
    preco_antigo REAL,
    categoria TEXT,
    tamanhos TEXT,
    cor TEXT,
    imagem TEXT,
    estoque INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de carrinhos
  CREATE TABLE IF NOT EXISTS carrinhos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  -- Tabela de itens do carrinho
  CREATE TABLE IF NOT EXISTS carrinho_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carrinho_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    UNIQUE(carrinho_id, produto_id)
  );
`);

module.exports = db;

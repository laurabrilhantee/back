const bcrypt = require('bcryptjs');
const db = require('./database');

// Cria/garante a conta administrativa em TODOS os starts do servidor.
// Assim ela continua funcionando mesmo quando o banco do Render já possui produtos.
function garantirAdministrador() {
  const email = (process.env.NANA_MIMI_ADMIN_EMAIL || 'nanaemimimodainfantil@gmail.com').trim().toLowerCase();
  const senha = process.env.NANA_MIMI_ADMIN_PASSWORD || 'NanaMimi123';
  const nome = process.env.NANA_MIMI_ADMIN_NAME || 'Nana & Mimi';

  if (!email || !senha) {
    console.warn('⚠️ Conta administrativa não configurada.');
    return;
  }

  const existente = db.prepare('SELECT id, nome, email, cargo FROM funcionarios WHERE email = ?').get(email);

  if (existente) {
    // Garante que a conta continue sendo administradora.
    if (existente.cargo !== 'admin' || existente.nome !== nome) {
      db.prepare('UPDATE funcionarios SET nome = ?, cargo = ? WHERE id = ?').run(nome, 'admin', existente.id);
    }
    console.log(`🔐 Administrador já configurado: ${email}`);
    return;
  }

  const senhaHash = bcrypt.hashSync(senha, 10);
  db.prepare(
    'INSERT INTO funcionarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)'
  ).run(nome, email, senhaHash, 'admin');

  console.log(`🔐 Administrador criado automaticamente: ${email}`);
}

function seed() {
  // Primeiro garante o administrador. Não pode ficar depois de um return.
  garantirAdministrador();

  const produtoCount = db.prepare('SELECT COUNT(*) as count FROM produtos').get();

  if (produtoCount.count > 0) {
    console.log('✅ Banco de dados já possui dados.');
    return;
  }

  console.log('🌱 Inserindo dados iniciais...\n');

  const produtos = [
    { nome: 'Body + Corpete Bege', descricao: 'Lindo body com corpete bege, perfeito para ocasiões especiais. Tecido confortável de alta durabilidade.', preco: 105.00, preco_antigo: null, categoria: 'body', tamanhos: '8,10,12,14', cor: 'bege', imagem: 'produto1.png', estoque: 50 },
    { nome: 'Camisa Social', descricao: 'Camisa social elegante de algodão. Ideal para o dia a dia no trabalho ou eventos formais.', preco: 59.90, preco_antigo: 119.90, categoria: 'camisa', tamanhos: '8,10,12,14', cor: 'branco', imagem: 'produto2.png', estoque: 30 },
    { nome: 'Calça Jogger', descricao: 'Calça jogger super estilosa com ajuste na cintura. Conforto e moda andam juntos aqui.', preco: 89.90, preco_antigo: null, categoria: 'calca', tamanhos: '8,10,12,14', cor: 'preto', imagem: 'produto3.png', estoque: 40 },
    { nome: 'Moletom Cinza', descricao: 'Moletom cinza flanelado perfeito para os dias mais frios. Caimento perfeito e muito quentinho.', preco: 85.00, preco_antigo: null, categoria: 'moletom', tamanhos: '8,10,12,14', cor: 'cinza', imagem: 'produto4.png', estoque: 25 },
    { nome: 'Blusa feminina', descricao: 'Blusa menta estilosa com saia para um visual casual.', preco: 42.00, preco_antigo: null, categoria: 'blusa', tamanhos: '8,10,12,14', cor: 'menta', imagem: 'produto5.jpeg', estoque: 35 },
    { nome: 'Conjunto Verão', descricao: 'Conjunto de camisa bata e shorts fresquinho para o verão.', preco: 135.00, preco_antigo: null, categoria: 'conjunto', tamanhos: '8,10,12,14', cor: 'colorido', imagem: 'produto6.jpeg', estoque: 20 },
    { nome: 'Pijama Infantil Sereia', descricao: 'Pijama de sereia divertido e super confortável.', preco: 65.00, preco_antigo: null, categoria: 'pijama', tamanhos: '8,10,12,14', cor: 'rosa', imagem: 'produto7.jpeg', estoque: 45 },
    { nome: 'Pijama Infantil Sweet Dreams', descricao: 'Pijama verde-menta macio para noites tranquilas.', preco: 69.00, preco_antigo: null, categoria: 'pijama', tamanhos: '8,10,12,14', cor: 'verde-menta', imagem: 'produto8.jpeg', estoque: 38 }
  ];

  const insertProduto = db.prepare(`
    INSERT INTO produtos (nome, descricao, preco, preco_antigo, categoria, tamanhos, cor, imagem, estoque)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((prods) => {
    for (const p of prods) {
      insertProduto.run(p.nome, p.descricao, p.preco, p.preco_antigo, p.categoria, p.tamanhos, p.cor, p.imagem, p.estoque);
    }
  });

  insertMany(produtos);
  console.log(`   ✅ ${produtos.length} produtos inseridos.`);
}

if (require.main === module) {
  seed();
  console.log('🌱 Seed finalizado!\n');
}

module.exports = { seed, garantirAdministrador };

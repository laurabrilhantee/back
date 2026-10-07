const bcrypt = require('bcryptjs');
const db = require('./database');

function seed() {
  // Verifica se já existem dados
  const produtoCount = db.prepare('SELECT COUNT(*) as count FROM produtos').get();

  if (produtoCount.count > 0) {
    console.log('✅ Banco de dados já possui dados.');
    return;
  }

  console.log('🌱 Inserindo dados iniciais...\n');

  // ─── Produtos (mesmos 8 do frontend mockado) ─────────────────────
  const produtos = [
    {
      nome: 'Body + Corpete Bege',
      descricao: 'Lindo body com corpete bege, perfeito para ocasiões especiais. Tecido confortável de alta durabilidade.',
      preco: 105.00,
      preco_antigo: null,
      categoria: 'body',
      tamanhos: '8,10,12,14',
      cor: 'bege',
      imagem: 'produto1.png',
      estoque: 50
    },
    {
      nome: 'Camisa Social',
      descricao: 'Camisa social elegante de algodão. Ideal para o dia a dia no trabalho ou eventos formais.',
      preco: 59.90,
      preco_antigo: 119.90,
      categoria: 'camisa',
      tamanhos: '8,10,12,14',
      cor: 'branco',
      imagem: 'produto2.png',
      estoque: 30
    },
    {
      nome: 'Calça Jogger',
      descricao: 'Calça jogger super estilosa com ajuste na cintura. Conforto e moda andam juntos aqui.',
      preco: 89.90,
      preco_antigo: null,
      categoria: 'calca',
      tamanhos: '8,10,12,14',
      cor: 'preto',
      imagem: 'produto3.png',
      estoque: 40
    },
    {
      nome: 'Moletom Cinza',
      descricao: 'Moletom cinza flanelado perfeito para os dias mais frios. Caimento perfeito e muito quentinho.',
      preco: 85.00,
      preco_antigo: null,
      categoria: 'moletom',
      tamanhos: '8,10,12,14',
      cor: 'cinza',
      imagem: 'produto4.png',
      estoque: 25
    },
    {
      nome: 'Blusa feminina',
      descricao: 'Blusa menta estilosa com saia para um visual casual.',
      preco: 42.00,
      preco_antigo: null,
      categoria: 'blusa',
      tamanhos: '8,10,12,14',
      cor: 'menta',
      imagem: 'produto5.jpeg',
      estoque: 35
    },
    {
      nome: 'Conjunto Verão',
      descricao: 'Conjunto de camisa bata e shorts fresquinho para o verão.',
      preco: 135.00,
      preco_antigo: null,
      categoria: 'conjunto',
      tamanhos: '8,10,12,14',
      cor: 'colorido',
      imagem: 'produto6.jpeg',
      estoque: 20
    },
    {
      nome: 'Pijama Infantil Sereia',
      descricao: 'Pijama de sereia divertido e super confortável.',
      preco: 65.00,
      preco_antigo: null,
      categoria: 'pijama',
      tamanhos: '8,10,12,14',
      cor: 'rosa',
      imagem: 'produto7.jpeg',
      estoque: 45
    },
    {
      nome: 'Pijama Infantil Sweet Dreams',
      descricao: 'Pijama verde-menta macio para noites tranquilas.',
      preco: 69.00,
      preco_antigo: null,
      categoria: 'pijama',
      tamanhos: '8,10,12,14',
      cor: 'verde-menta',
      imagem: 'produto8.jpeg',
      estoque: 38
    }
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

  // ─── Funcionário administrador padrão ─────────────────────
  const senhaHash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    'INSERT INTO funcionarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)'
  ).run('Administrador', 'admin@nanamimi.com', senhaHash, 'admin');

  console.log('   ✅ Funcionário admin criado.');
  console.log('\n   ╔══════════════════════════════════════════════╗');
  console.log('   ║  DADOS DE TESTE — FUNCIONÁRIO ADMINISTRADOR  ║');
  console.log('   ╠══════════════════════════════════════════════╣');
  console.log('   ║  Email: admin@nanamimi.com                   ║');
  console.log('   ║  Senha: admin123                             ║');
  console.log('   ╚══════════════════════════════════════════════╝\n');
}

// Permite executar diretamente via "node seed.js" ou importar
if (require.main === module) {
  seed();
  console.log('🌱 Seed finalizado!\n');
}

module.exports = { seed };

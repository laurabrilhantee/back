const db = require('../database/database');
const path = require('path');

// ─── GET /products ───────────────────────────────────────────
function listar(req, res) {
  try {
    const { busca, categoria, preco_min, preco_max } = req.query;

    let query = 'SELECT * FROM produtos WHERE ativo = 1';
    const params = [];

    if (busca) {
      query += ' AND nome LIKE ?';
      params.push(`%${busca}%`);
    }

    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    if (preco_min) {
      query += ' AND preco >= ?';
      params.push(parseFloat(preco_min));
    }

    if (preco_max) {
      query += ' AND preco <= ?';
      params.push(parseFloat(preco_max));
    }

    query += ' ORDER BY id ASC';

    const produtos = db.prepare(query).all(...params);

    // Monta a URL completa da imagem
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const produtosComUrl = produtos.map(p => ({
      ...p,
      imagem: p.imagem ? `${baseUrl}/uploads/${p.imagem}` : null
    }));

    res.json(produtosComUrl);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── GET /products/:id ───────────────────────────────────────────
function buscarPorId(req, res) {
  try {
    const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    produto.imagem = produto.imagem ? `${baseUrl}/uploads/${produto.imagem}` : null;

    res.json(produto);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── POST /products ───────────────────────────────────────────
// Somente funcionários podem criar produtos (middleware garante)
function criar(req, res) {
  try {
    const { nome, descricao, preco, preco_antigo, categoria, tamanhos, cor, estoque } = req.body;

    if (!nome || preco === undefined || preco === null) {
      return res.status(400).json({ erro: 'Nome e preço são obrigatórios.' });
    }

    if (isNaN(preco) || preco < 0) {
      return res.status(400).json({ erro: 'Preço deve ser um número válido.' });
    }

    // Imagem: se veio via multer, pega o filename
    const imagem = req.file ? req.file.filename : (req.body.imagem || null);

    const result = db.prepare(`
      INSERT INTO produtos (nome, descricao, preco, preco_antigo, categoria, tamanhos, cor, imagem, estoque)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nome.trim(),
      descricao || null,
      parseFloat(preco),
      preco_antigo ? parseFloat(preco_antigo) : null,
      categoria || null,
      tamanhos || '8,10,12,14',
      cor || null,
      imagem,
      estoque ? parseInt(estoque) : 0
    );

    const novoProduto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    novoProduto.imagem = novoProduto.imagem ? `${baseUrl}/uploads/${novoProduto.imagem}` : null;

    res.status(201).json({
      mensagem: 'Produto cadastrado com sucesso!',
      produto: novoProduto
    });
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── PUT /products/:id ───────────────────────────────────────────
function atualizar(req, res) {
  try {
    const { id } = req.params;
    const existente = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);

    if (!existente) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    const nome = req.body.nome || existente.nome;
    const descricao = req.body.descricao !== undefined ? req.body.descricao : existente.descricao;
    const preco = req.body.preco !== undefined ? parseFloat(req.body.preco) : existente.preco;
    const preco_antigo = req.body.preco_antigo !== undefined ? (req.body.preco_antigo ? parseFloat(req.body.preco_antigo) : null) : existente.preco_antigo;
    const categoria = req.body.categoria !== undefined ? req.body.categoria : existente.categoria;
    const tamanhos = req.body.tamanhos !== undefined ? req.body.tamanhos : existente.tamanhos;
    const cor = req.body.cor !== undefined ? req.body.cor : existente.cor;
    const estoque = req.body.estoque !== undefined ? parseInt(req.body.estoque) : existente.estoque;
    const ativo = req.body.ativo !== undefined ? req.body.ativo : existente.ativo;
    const imagem = req.file ? req.file.filename : (req.body.imagem !== undefined ? req.body.imagem : existente.imagem);

    db.prepare(`
      UPDATE produtos 
      SET nome = ?, descricao = ?, preco = ?, preco_antigo = ?, categoria = ?, 
          tamanhos = ?, cor = ?, imagem = ?, estoque = ?, ativo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nome, descricao, preco, preco_antigo, categoria, tamanhos, cor, imagem, estoque, ativo, id);

    const atualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    atualizado.imagem = atualizado.imagem ? `${baseUrl}/uploads/${atualizado.imagem}` : null;

    res.json({
      mensagem: 'Produto atualizado com sucesso!',
      produto: atualizado
    });
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── DELETE /products/:id ───────────────────────────────────────────
// Desativa o produto (soft delete) em vez de remover
function deletar(req, res) {
  try {
    const { id } = req.params;
    const existente = db.prepare('SELECT id FROM produtos WHERE id = ?').get(id);

    if (!existente) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    // Soft delete: desativa em vez de remover
    db.prepare('UPDATE produtos SET ativo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    res.json({ mensagem: 'Produto desativado com sucesso.' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, deletar };

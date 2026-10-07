const db = require('../database/database');

// Helper: obtém ou cria carrinho do usuário
function obterOuCriarCarrinho(userId) {
  let carrinho = db.prepare('SELECT * FROM carrinhos WHERE usuario_id = ?').get(userId);
  if (!carrinho) {
    db.prepare('INSERT INTO carrinhos (usuario_id) VALUES (?)').run(userId);
    carrinho = db.prepare('SELECT * FROM carrinhos WHERE usuario_id = ?').get(userId);
  }
  return carrinho;
}

// Helper: monta resposta do carrinho com dados dos produtos
function montarItensCarrinho(carrinhoId, baseUrl) {
  const itens = db.prepare(`
    SELECT ci.id AS item_id, ci.produto_id, ci.quantidade, ci.preco_unitario,
           p.nome, p.imagem, p.estoque, p.ativo
    FROM carrinho_itens ci
    JOIN produtos p ON ci.produto_id = p.id
    WHERE ci.carrinho_id = ?
    ORDER BY ci.created_at ASC
  `).all(carrinhoId);

  return itens.map(item => ({
    id: item.produto_id,
    item_id: item.item_id,
    nome: item.nome,
    img: item.imagem ? `${baseUrl}/uploads/${item.imagem}` : null,
    preco: item.preco_unitario,
    quantidade: item.quantidade,
    estoque: item.estoque,
    ativo: item.ativo
  }));
}

// ─── GET /cart ───────────────────────────────────────────
function obterCarrinho(req, res) {
  try {
    const userId = req.usuario.id;

    // Apenas clientes podem ter carrinho
    if (req.usuario.tipo !== 'cliente') {
      return res.status(403).json({ erro: 'Apenas clientes possuem carrinho.' });
    }

    const carrinho = obterOuCriarCarrinho(userId);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itens = montarItensCarrinho(carrinho.id, baseUrl);

    res.json({ itens });
  } catch (err) {
    console.error('Erro ao obter carrinho:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── POST /cart/items ───────────────────────────────────────────
function adicionarItem(req, res) {
  try {
    const userId = req.usuario.id;
    const { produto_id, quantidade = 1 } = req.body;

    if (req.usuario.tipo !== 'cliente') {
      return res.status(403).json({ erro: 'Apenas clientes possuem carrinho.' });
    }

    if (!produto_id) {
      return res.status(400).json({ erro: 'produto_id é obrigatório.' });
    }

    if (quantidade < 1) {
      return res.status(400).json({ erro: 'Quantidade deve ser pelo menos 1.' });
    }

    // Verifica produto
    const produto = db.prepare('SELECT * FROM produtos WHERE id = ? AND ativo = 1').get(produto_id);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado ou indisponível.' });
    }

    if (produto.estoque < quantidade) {
      return res.status(400).json({ erro: 'Estoque insuficiente.' });
    }

    const carrinho = obterOuCriarCarrinho(userId);

    // Verifica se já existe no carrinho
    const itemExistente = db.prepare(
      'SELECT * FROM carrinho_itens WHERE carrinho_id = ? AND produto_id = ?'
    ).get(carrinho.id, produto_id);

    if (itemExistente) {
      const novaQtd = itemExistente.quantidade + quantidade;
      if (novaQtd > produto.estoque) {
        return res.status(400).json({ erro: 'Estoque insuficiente para a quantidade solicitada.' });
      }
      db.prepare(
        'UPDATE carrinho_itens SET quantidade = ? WHERE id = ?'
      ).run(novaQtd, itemExistente.id);
    } else {
      db.prepare(
        'INSERT INTO carrinho_itens (carrinho_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)'
      ).run(carrinho.id, produto_id, quantidade, produto.preco);
    }

    // Retorna carrinho atualizado
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itens = montarItensCarrinho(carrinho.id, baseUrl);
    res.json({ mensagem: 'Produto adicionado ao carrinho!', itens });
  } catch (err) {
    console.error('Erro ao adicionar item ao carrinho:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── PUT /cart/items/:produtoId ───────────────────────────────────────────
function atualizarItem(req, res) {
  try {
    const userId = req.usuario.id;
    const produtoId = parseInt(req.params.produtoId);
    const { quantidade } = req.body;

    if (req.usuario.tipo !== 'cliente') {
      return res.status(403).json({ erro: 'Apenas clientes possuem carrinho.' });
    }

    if (!quantidade || quantidade < 0) {
      return res.status(400).json({ erro: 'Quantidade inválida.' });
    }

    // Se quantidade = 0, remove o item
    if (quantidade === 0) {
      return removerItem(req, res);
    }

    const carrinho = obterOuCriarCarrinho(userId);

    // Verifica produto
    const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produtoId);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    if (quantidade > produto.estoque) {
      return res.status(400).json({ erro: 'Estoque insuficiente.' });
    }

    const item = db.prepare(
      'SELECT * FROM carrinho_itens WHERE carrinho_id = ? AND produto_id = ?'
    ).get(carrinho.id, produtoId);

    if (!item) {
      return res.status(404).json({ erro: 'Item não encontrado no carrinho.' });
    }

    db.prepare(
      'UPDATE carrinho_itens SET quantidade = ? WHERE id = ?'
    ).run(quantidade, item.id);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itens = montarItensCarrinho(carrinho.id, baseUrl);
    res.json({ mensagem: 'Quantidade atualizada!', itens });
  } catch (err) {
    console.error('Erro ao atualizar item do carrinho:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── DELETE /cart/items/:produtoId ───────────────────────────────────────────
function removerItem(req, res) {
  try {
    const userId = req.usuario.id;
    const produtoId = parseInt(req.params.produtoId);

    if (req.usuario.tipo !== 'cliente') {
      return res.status(403).json({ erro: 'Apenas clientes possuem carrinho.' });
    }

    const carrinho = obterOuCriarCarrinho(userId);

    const item = db.prepare(
      'SELECT * FROM carrinho_itens WHERE carrinho_id = ? AND produto_id = ?'
    ).get(carrinho.id, produtoId);

    if (!item) {
      return res.status(404).json({ erro: 'Item não encontrado no carrinho.' });
    }

    db.prepare('DELETE FROM carrinho_itens WHERE id = ?').run(item.id);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itens = montarItensCarrinho(carrinho.id, baseUrl);
    res.json({ mensagem: 'Item removido do carrinho.', itens });
  } catch (err) {
    console.error('Erro ao remover item do carrinho:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── DELETE /cart/clear ───────────────────────────────────────────
function limparCarrinho(req, res) {
  try {
    const userId = req.usuario.id;

    if (req.usuario.tipo !== 'cliente') {
      return res.status(403).json({ erro: 'Apenas clientes possuem carrinho.' });
    }

    const carrinho = obterOuCriarCarrinho(userId);
    db.prepare('DELETE FROM carrinho_itens WHERE carrinho_id = ?').run(carrinho.id);

    res.json({ mensagem: 'Carrinho limpo com sucesso.', itens: [] });
  } catch (err) {
    console.error('Erro ao limpar carrinho:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { obterCarrinho, adicionarItem, atualizarItem, removerItem, limparCarrinho };

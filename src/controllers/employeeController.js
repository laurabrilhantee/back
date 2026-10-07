const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/database');

// ─── POST /employees/register ───────────────────────────────────
// Apenas funcionários autorizados podem registrar novos funcionários
function registrar(req, res) {
  try {
    const { nome, email, senha, cargo } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ erro: 'E-mail inválido.' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    // Verifica duplicidade (email único entre funcionários E usuários)
    const existeFuncionario = db.prepare('SELECT id FROM funcionarios WHERE email = ?').get(email.toLowerCase());
    if (existeFuncionario) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado como funcionário.' });
    }

    const senhaHash = bcrypt.hashSync(senha, 10);

    const result = db.prepare(
      'INSERT INTO funcionarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)'
    ).run(nome.trim(), email.toLowerCase(), senhaHash, cargo || 'funcionario');

    res.status(201).json({
      mensagem: 'Funcionário cadastrado com sucesso!',
      funcionario: {
        id: Number(result.lastInsertRowid),
        nome: nome.trim(),
        email: email.toLowerCase(),
        cargo: cargo || 'funcionario'
      }
    });
  } catch (err) {
    console.error('Erro ao registrar funcionário:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── POST /employees/login ───────────────────────────────────
function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const funcionario = db.prepare(
      'SELECT * FROM funcionarios WHERE email = ?'
    ).get(email.toLowerCase());

    if (!funcionario) {
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    }

    if (!bcrypt.compareSync(senha, funcionario.senha)) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      {
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo,
        tipo: 'funcionario'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo,
        tipo: 'funcionario'
      }
    });
  } catch (err) {
    console.error('Erro no login do funcionário:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── GET /employees ───────────────────────────────────
function listar(req, res) {
  try {
    const funcionarios = db.prepare(
      'SELECT id, nome, email, cargo, created_at FROM funcionarios ORDER BY id ASC'
    ).all();
    res.json(funcionarios);
  } catch (err) {
    console.error('Erro ao listar funcionários:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── GET /employees/:id ───────────────────────────────────
function buscarPorId(req, res) {
  try {
    const funcionario = db.prepare(
      'SELECT id, nome, email, cargo, created_at FROM funcionarios WHERE id = ?'
    ).get(req.params.id);

    if (!funcionario) {
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    }

    res.json(funcionario);
  } catch (err) {
    console.error('Erro ao buscar funcionário:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── PUT /employees/:id ───────────────────────────────────
function atualizar(req, res) {
  try {
    const { nome, email, senha, cargo } = req.body;
    const { id } = req.params;

    const existente = db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(id);
    if (!existente) {
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    }

    const novoNome = nome || existente.nome;
    const novoEmail = email ? email.toLowerCase() : existente.email;
    const novoCargo = cargo || existente.cargo;
    const novaSenha = senha ? bcrypt.hashSync(senha, 10) : existente.senha;

    db.prepare(
      'UPDATE funcionarios SET nome = ?, email = ?, senha = ?, cargo = ? WHERE id = ?'
    ).run(novoNome, novoEmail, novaSenha, novoCargo, id);

    res.json({
      mensagem: 'Funcionário atualizado com sucesso!',
      funcionario: { id: Number(id), nome: novoNome, email: novoEmail, cargo: novoCargo }
    });
  } catch (err) {
    console.error('Erro ao atualizar funcionário:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── DELETE /employees/:id ───────────────────────────────────
function deletar(req, res) {
  try {
    const { id } = req.params;

    const existente = db.prepare('SELECT id FROM funcionarios WHERE id = ?').get(id);
    if (!existente) {
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    }

    // Não permitir deletar a si mesmo
    if (Number(id) === req.usuario.id) {
      return res.status(400).json({ erro: 'Você não pode deletar sua própria conta.' });
    }

    db.prepare('DELETE FROM funcionarios WHERE id = ?').run(id);
    res.json({ mensagem: 'Funcionário removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao deletar funcionário:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { registrar, login, listar, buscarPorId, atualizar, deletar };

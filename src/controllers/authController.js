const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/database');

// ─── POST /auth/register ───────────────────────────────────────────
function registrar(req, res) {
  try {
    const { nome, email, senha } = req.body;

    // Validações
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
    }

    if (nome.trim().length < 2) {
      return res.status(400).json({ erro: 'O nome deve ter pelo menos 2 caracteres.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ erro: 'Por favor, insira um e-mail válido.' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    // Verifica email duplicado
    const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.toLowerCase());
    if (existente) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    // Hash da senha
    const senhaHash = bcrypt.hashSync(senha, 10);

    // Insere o usuário
    const result = db.prepare(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)'
    ).run(nome.trim(), email.toLowerCase(), senhaHash);

    // Cria carrinho para o usuário
    db.prepare('INSERT INTO carrinhos (usuario_id) VALUES (?)').run(result.lastInsertRowid);

    // Gera token JWT
    const token = jwt.sign(
      {
        id: Number(result.lastInsertRowid),
        nome: nome.trim(),
        email: email.toLowerCase(),
        tipo: 'cliente'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso!',
      token,
      usuario: {
        id: Number(result.lastInsertRowid),
        nome: nome.trim(),
        email: email.toLowerCase(),
        tipo: 'cliente'
      }
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── POST /auth/login ───────────────────────────────────────────
function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    // Busca por email ou por nome (o frontend aceita "Usuário ou E-mail")
    let usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase());

    if (!usuario) {
      usuario = db.prepare('SELECT * FROM usuarios WHERE nome = ?').get(email);
    }

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    // Verifica a senha
    if (!bcrypt.compareSync(senha, usuario.senha)) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    // Gera token
    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: 'cliente'
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── GET /auth/me ───────────────────────────────────────────
function me(req, res) {
  try {
    const { id, tipo } = req.usuario;

    let user;
    if (tipo === 'funcionario') {
      user = db.prepare(
        'SELECT id, nome, email, cargo, created_at FROM funcionarios WHERE id = ?'
      ).get(id);
    } else {
      user = db.prepare(
        'SELECT id, nome, email, created_at FROM usuarios WHERE id = ?'
      ).get(id);
    }

    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json({ ...user, tipo });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// ─── POST /auth/logout ───────────────────────────────────────────
function logout(req, res) {
  // JWT é stateless — o logout é feito no frontend removendo o token
  res.json({ mensagem: 'Logout realizado com sucesso.' });
}

module.exports = { registrar, login, me, logout };

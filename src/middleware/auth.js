const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica se o usuário está autenticado (cliente ou funcionário).
 */
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ erro: 'Token inválido ou expirado.' });
  }
}

/**
 * Middleware que verifica se o usuário é um funcionário autorizado.
 * Bloqueia acesso de clientes comuns a rotas administrativas.
 */
function autenticarFuncionario(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tipo !== 'funcionario') {
      return res.status(403).json({ erro: 'Acesso restrito a funcionários autorizados.' });
    }

    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticarToken, autenticarFuncionario };

const router = require('express').Router();
const { registrar, login, me, logout } = require('../controllers/authController');
const { autenticarToken } = require('../middleware/auth');

// Rotas públicas
router.post('/register', registrar);
router.post('/login', login);
router.post('/logout', logout);

// Rota protegida (requer token)
router.get('/me', autenticarToken, me);

module.exports = router;

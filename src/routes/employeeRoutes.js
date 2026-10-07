const router = require('express').Router();
const {
  registrar, login, listar, buscarPorId, atualizar, deletar
} = require('../controllers/employeeController');
const { autenticarFuncionario } = require('../middleware/auth');

// Login de funcionário (público)
router.post('/login', login);

// Rotas protegidas (somente funcionários autorizados)
router.post('/register', autenticarFuncionario, registrar);
router.get('/', autenticarFuncionario, listar);
router.get('/:id', autenticarFuncionario, buscarPorId);
router.put('/:id', autenticarFuncionario, atualizar);
router.delete('/:id', autenticarFuncionario, deletar);

module.exports = router;

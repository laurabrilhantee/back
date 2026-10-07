const router = require('express').Router();
const {
  obterCarrinho, adicionarItem, atualizarItem, removerItem, limparCarrinho
} = require('../controllers/cartController');
const { autenticarToken } = require('../middleware/auth');

// Todas as rotas do carrinho exigem autenticação
router.use(autenticarToken);

router.get('/', obterCarrinho);
router.post('/items', adicionarItem);
router.put('/items/:produtoId', atualizarItem);
router.delete('/items/:produtoId', removerItem);
router.delete('/clear', limparCarrinho);

module.exports = router;

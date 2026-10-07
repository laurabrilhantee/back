const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { listar, buscarPorId, criar, atualizar, deletar } = require('../controllers/productController');
const { autenticarFuncionario } = require('../middleware/auth');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `produto-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens (JPEG, PNG, GIF, WebP) são permitidas.'));
  }
});

// Rotas públicas (qualquer pessoa pode visualizar)
router.get('/', listar);
router.get('/:id', buscarPorId);

// Rotas protegidas (somente funcionários)
router.post('/', autenticarFuncionario, upload.single('imagem'), criar);
router.put('/:id', autenticarFuncionario, upload.single('imagem'), atualizar);
router.delete('/:id', autenticarFuncionario, deletar);

module.exports = router;

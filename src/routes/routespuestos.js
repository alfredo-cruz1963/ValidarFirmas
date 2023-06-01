const router = require('express').Router();

const { isLoggedIn } = require('../lib/auth');
const puestosctrl = require('../controllers/ctrlpuestos');

router.get('/', isLoggedIn, puestosctrl.list);
router.get('/add', isLoggedIn, puestosctrl.add);
router.post('/add', isLoggedIn, puestosctrl.new);
router.get('/edit/:codigo', isLoggedIn, puestosctrl.edit);
router.post('/edit/:codigo', isLoggedIn, puestosctrl.update);
router.get('/delete/:codigo', isLoggedIn, puestosctrl.delete);

module.exports = router;
const router = require('express').Router();

const { isLoggedIn } = require('../lib/auth');
const causasctrl = require('../controllers/ctrlcausas');

router.get('/', isLoggedIn, causasctrl.list);
router.get('/add', isLoggedIn, causasctrl.add);
router.post('/add', isLoggedIn, causasctrl.new);
router.get('/edit/:codigo', isLoggedIn, causasctrl.edit);
router.post('/edit/:codigo', isLoggedIn, causasctrl.update);
router.get('/delete/:codigo', isLoggedIn, causasctrl.delete);

module.exports = router;
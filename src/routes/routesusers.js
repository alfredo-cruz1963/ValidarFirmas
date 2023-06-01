const router = require('express').Router();

const { isLoggedIn } = require('../lib/auth');
const usersctrl = require('../controllers/ctrlusers');

router.get('/', isLoggedIn, usersctrl.list);
router.get('/add', isLoggedIn, usersctrl.add);
router.post('/add', isLoggedIn, usersctrl.new);
router.get('/edit/:id', isLoggedIn, usersctrl.edit);
router.post('/edit/:id', isLoggedIn, usersctrl.update);
router.get('/delete/:id', isLoggedIn, usersctrl.delete);

module.exports = router;
const router = require('express').Router();

const { isLoggedIn } = require('../lib/auth');
const firmasctrl = require('../controllers/ctrlfirmas');

router.get('/add', isLoggedIn, firmasctrl.add);
router.get('/add1', isLoggedIn, firmasctrl.add1);
router.post('/valid', isLoggedIn, firmasctrl.valid);
router.get('/view', isLoggedIn, firmasctrl.view);
router.post('/savenv', isLoggedIn, firmasctrl.savenv);
router.get('/muestra', isLoggedIn, firmasctrl.muestra);
router.post('/grabar', isLoggedIn, firmasctrl.grabar);
router.post('/edit', isLoggedIn, firmasctrl.edit);
router.post('/update', isLoggedIn, firmasctrl.update);
router.get('/delete/:cedula', isLoggedIn,firmasctrl.delete);
router.post('/consultaAdres/:cedula', isLoggedIn,firmasctrl.consultaAdres);


module.exports = router;
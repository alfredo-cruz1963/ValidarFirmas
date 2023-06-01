const router = require('express').Router();

router.get('/', async (req, res) => {
    // res.render('index.hbs');
    res.render('auth/signin.hbs');
});

module.exports = router;
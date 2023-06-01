const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('./helpers');

// valida el usuario
passport.use('local.signin', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  const rows = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (rows.length > 0) {
    const user = rows[0];
    const validPassword = await helpers.matchPassword(password, user.password)
    if (validPassword) {
      //done(null, user, req.flash('success', 'Bienvenido ' + user.username));
      done(null, user, req.flash('success', ''));
    } else {
      done(null, false, req.flash('message', 'Password Incorrecto...'));
    }
  } else {
    return done(null, false, req.flash('message', 'El Usuario NO existe...'));
  }
}));

// hace el registro del usuario
passport.use('local.signup', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
  }, async (req, username, password, done) => {

  const { fullname } = req.body;
  let newUser = {
    fullname,
    username,
    password
  };
  const musername = req.body.username;
  const usuario = await pool.query('SELECT username FROM users WHERE username = ?', musername);
  
  if (usuario.length > 0) {
    return done(null, false, req.flash('message', 'El Usuario: ' + musername + ', YA existe.'));
  }

  newUser.password = await helpers.encryptPassword(password);
  // Saving in the Database
  const result = await pool.query('INSERT INTO users SET ? ', newUser);
  newUser.id = result.insertId;
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
 
passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  done(null, rows[0]);
});


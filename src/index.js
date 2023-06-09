if (process.env.NODE_ENV != 'production') {
  require('dotenv').config();
}

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const favicon = require('static-favicon');
//const favicon = require('serve-favicon');
const exphbs = require('express-handlebars');
const hbs = require('handlebars'); 
const session = require('express-session');
const validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const async = require('async');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { database } = require('./keys');
const puppeteer = require("puppeteer");
const ac = require("@antiadmin/anticaptchaofficial");
const EventEmitter = require('events');

// Intializations
const app = express();
app.use(express.json());
require('./lib/passport');

// Settings
process.setMaxListeners(15); // Establece el límite máximo a 15 listeners, puedes ajustar este número según tus necesidades
app.set('port', process.env.PORT || 6500);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  layoutsDir: path.join(app.get('views'), 'layouts'),
  partialsDir: path.join(app.get('views'), 'partials'),
  extname: '.hbs',
  helpers: require('./lib/handlebars')
}))
//app.set('view engine', '.hbs'); esta linea es la original

hbs.registerHelper({
  eq: function (v1, v2) {
      return v1 === v2;
  },
  ne: function (v1, v2) {
      return v1 !== v2;
  },
  lt: function (v1, v2) {
      return v1 < v2;
  },
  gt: function (v1, v2) {
      return v1 > v2;
  },
  lte: function (v1, v2) {
      return v1 <= v2;
  },
  gte: function (v1, v2) {
      return v1 >= v2;
  },
  and: function () {
      return Array.prototype.slice.call(arguments).every(Boolean);
  },
  or: function () {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  }
});
 
app.set('view engine', 'handlebars'); 
app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(favicon());

app.use(session({
  secret: 'faztmysqlnodemysql',
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore(database)
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());

// Global variables
var gplanilla = '';
var gfecha = new Date();
var gopc = 0;
var mtoken = '';
var memail = '';
var idusr = 0;

app.use((req, res, next) => {
  app.locals.message = req.flash('message');
  app.locals.success = req.flash('success');
  app.locals.user = req.user;       
  next();
});

// Routes
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use('/causas', require('./routes/routescausas'));
app.use('/querys', require('./routes/routesquery'));
app.use('/firmas', require('./routes/routesfirmas'));
app.use('/puestos', require('./routes/routespuestos'));
app.use('/users', require('./routes/routesusers'));

// Public
app.use(express.static(path.join(__dirname, 'public')));

//Errores
app.use((error, req, res, next) => {
  res.status(400).json({
      status: 'error',
      message: error.message,
  });
});

// Starting
app.listen(app.get('port'), () => {
  console.log('Server is in port', app.get('port'));
});


const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');
const validUrl = require('valid-url');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();

// Configuração do Mongoose
mongoose.connect('sua-string-de-conexao-do-mongodb', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Conectado ao MongoDB');
});

// Configuração do Passport
passport.use(new GoogleStrategy({
    clientID: 'seu-client-id-do-google',
    clientSecret: 'seu-client-secret-do-google',
    callbackURL: "http://blza.me/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.use(session({ 
    secret: 'sua-chave-secreta', 
    resave: false, 
    saveUninitialized: false 
}));
app.use(passport.initialize());
app.use(passport.session());

// Middleware para garantir autenticação
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Configuração do bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração dos arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Modelo do Mongoose
const Url = mongoose.model('Url', new mongoose.Schema({
  urlLong: String,
  urlShort: String
}));

// Rotas
app.post('/shorten', ensureAuthenticated, async (req, res) => {
    const { url: urlLong, customShortId } = req.body;
    if (!validUrl.isUri(urlLong)) {
        return res.status(400).send('URL inválida');
    }
    let url = await Url.findOne({ urlLong });
    if (url) {
        return res.json({ urlShort: `https://blza.me/${url.urlShort}` });
    }
    let urlShort = customShortId || shortid.generate();
    if (customShortId) {
        const existing = await Url.findOne({ urlShort });
        if (existing) {
            return res.status(409).send('ID personalizada já está em uso');
        }
    }
    url = new Url({ urlLong, urlShort });
    await url.save();
    res.json({ urlShort: `https://blza.me/${url.urlShort}` });
});

app.get('/:id', async (req, res) => {
    const url = await Url.findOne({ urlShort: req.params.id });
    if (url) {
        res.redirect(url.urlLong);
    } else {
        res.status(404).send('URL não encontrada');
    }
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'], hostedDomain: 'exemplo.com.br' }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    });

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

module.exports = app;  // exporta para os testes

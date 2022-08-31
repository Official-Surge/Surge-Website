const express = require("express");
const session = require('express-session');
const passport = require('passport');
const Strategy = require('passport-discord').Strategy;
const MemoryStore = require('memorystore')(session);
const url = require('url');
const helmet = require('helmet')
const path = require('path');
require('dotenv').config()
const { discord, invite, vote } = require('./links.json');
var app = express();

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new Strategy({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: 'https://www.surge.ml/auth',
    scope: ['identify', 'guilds', 'guilds.join']
},
    (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => done(null, profile));
    }));
app.use(session({
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
    secret: 'clientsessionsecret<>?:@~{}[]',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "img-src": ["'self'", "https: data:"]
        }
    })
)
app.locals.domain = 'https://www.surge.ml';
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(path.join(__dirname, '../')));
app.set('views', path.join(__dirname, '../'));
app.set('view engine', 'ejs');
app.listen(console.log(`App listening at https://www.surge.ml/`));

app.get('/', (req, res) => {
    const user = req.isAuthenticated() ? req.user : null;
    res.render('home', {
        user,
    });
});

app.get('/home', (req, res) => {
    const user = req.isAuthenticated() ? req.user : null;
    res.render('home', {
        user,
    });
});

app.get('/invite', (req, res) => {
    res.status(301).redirect(`${invite}`)
});

app.get('/discord', (req, res) => {
    res.status(301).redirect(`${discord}`)
});

app.get('/vote', (req, res) => {
    res.status(301).redirect(`${vote}`)
});

app.get('/login', (req, res, next) => {
    if (req.session.backURL) {
        req.session.backURL = 'https://www.surge.ml/auth';
    } else if (req.headers.referer) {
        const parsed = url.parse(req.headers.referer);
        if (parsed.hostname === app.locals.domain) {
            req.session.backURL = parsed.path;
        }
    } else {
        req.session.backURL = '/';
    }
    next();
}, passport.authenticate('discord'));

app.get('/auth', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    if (req.session.backURL) {
        const refurl = req.session.backURL;
        req.session.backURL = null;
        res.redirect(refurl);
    } else {
        res.redirect('/');
    }
});

app.get('/terms-of-service', (req, res) => {
    res.sendFile(path.join(__dirname + '../../terms-of-service.html'));
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname + '../../home'));
});

app.listen(3000);
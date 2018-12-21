'use strict';

const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const JWTstrategy = require('passport-jwt').Strategy;

const jwt = require('jsonwebtoken');

const Person = mongoose.model('Person');
const Partner = mongoose.model('Partner');

const config = require('../../config.json');

// Strategy pour log l'utilisateur avec son nom d'utilisateur & mot de passe.
// Si les identifiants sont bon. Alors on lui renvoie son token jwt pour
// s'authentifier sur les requêtes à l'API
passport.use('login', new LocalStrategy({
    usernameField: "username",
    passwordField: "password"
},
    (username, password, done) => {
        Person.findOne({ username: username, password: password }, (err, user) => {
            if (err) return done(err);
            if (!user) {
                return done(null, false, { message: "Incorrect username or password" });
            } else {
                let userToken = jwt.sign(
                    { id: user._id },
                    config.jwt.secret,
                    {
                        expiresIn: 60 * 60 * 24
                    }
                );
                return done(null, userToken);
            }
        });
    }
));


// Strategy pour identifier l'utilisateur sur les éléments de l'API
passport.use('jwt', new JWTstrategy({
    //secret we used to sign our JWT
    secretOrKey: config.jwt.secret,
    //we expect the user to send the token as a query paramater with the name 'token'
    jwtFromRequest: req => {
        return req.headers.token;
    }
}, async (token, done) => {
    try {
        //Pass the user details to the next middleware
        Person.findOne({ _id: token.id }, (err, person) => {
            if (err) return done(err);
            return done(null, person);
        })
    } catch (error) {
        done(error);
    }
}));

exports.logPartner = (req, res) => {
    if (req.body.key) {
        Partner.findOne({ key: req.body.key }, (err, partner) => {
            if (err) res.send(err);
            if (!partner)
                res.status(401).send({type:"NotExisting"});
            else {
                let userToken = jwt.sign(
                    { id: partner._id },
                    config.jwt.secret,
                    {
                        expiresIn: 60 * 60 * 24
                    }
                );

                res.json({ token: userToken });
            }
        });
    } else {
        res.status(400).send({message: "Missing key parameter", type:"MissingParameter"});
    }
}

exports.areAuthorized = authorized => {
    return (req, res, next) => {
        if (!req.user) {
            next(new Error('Unauthorized access'));
        } else {
            if (authorized.constructor === Array && authorized.indexOf(req.user.__t) != -1) {
                next();
            } else {
                next(new Error('Unauthorized access'));
            }
        }
    }
}


passport.serializeUser(function (token, done) {
    done(null, token);
});

passport.deserializeUser(function (id, done) {
    console.log("deserializeUser", id);
    User.findById({ _id: id }, function (err, user) {
        done(err, user);
    });
});

exports.passport = passport;
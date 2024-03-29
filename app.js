//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const encrypt = require("mongoose-encryption"); //LVL 2 Security
// const md5 = require("md5");
// var bcrypt = require('bcrypt');
// const saltRounds = 10;


const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  

// mongoose.connect("mongodb://localhost:27017/userDB");
mongoose.connect("mongodb+srv://AjeeT:Test123@cluster0.9smghzn.mongodb.net/userDB",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    secret: String
  });

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});  //LVL 2 Security

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
  done(null,user.id);
});
/*
passport.deserializeUser(function(id, done) {
    User.findById(id)
    .then(function(user) {
      done(user);
    })
    .catch(function(err){
      console.log(err);
    });
  });
  */
  passport.deserializeUser(function(id, done) {
    User.findById(id)
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err, null);
      });
  });
  
  
  passport.use(new GoogleStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      // callbackURL: "http://localhost:3000/auth/google/secrets",
      callbackURL: "https://secrets-aj.netlify.app/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
  
      User.findOne({ googleId: profile.id })
      .then(user => {
        if (user) {
          return user;
        } else {
          return User.create({ googleId: profile.id });
        }
      })
      .then(user => {
        return cb(null, user);
      })
      .catch(err => {
        return cb(err, null);
      });
    }
  ));

  app.get("/", function(req, res){
    res.render("home");
  });
  
  app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
  );
  
  app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect to secrets.
      res.redirect("/secrets");
    });


app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}})
  .then(foundUsers => {
    if (foundUsers) {
      res.render("secrets", {usersWithSecrets: foundUsers});
    }
  })
  .catch(err => {
    console.log(err);
  });

});

// app.get("/logout", function(req, res){
//   req.logout();
//   res.redirect("/");
// });

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});



app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);


 User.findById(req.user.id)
  .then(foundUser => {
    if (foundUser) {
      foundUser.secret = submittedSecret;
      return foundUser.save();
    } else {
      throw new Error('User not found');
    }
  })
  .then(() => {
    res.redirect('/secrets');
  })
  .catch(err => {
    console.log(err);
  });
 
 
 //Below is same but this is perfect...............!
//   User.findById(req.user.id)
//   .then(function(foundUser){
//       if (foundUser) {
//         foundUser.secret = submittedSecret;
//         foundUser.save(function(){
//           res.redirect("/secrets");
//         });
//       }
//   })
//   .catch(function(err){
//     console.log(err);
//   });

});

// app.get("/logout", function(req, res){
//   req.logout();
//   res.redirect("/");
// });

// app.get("/logout", (req, res) => {
//   req.logout();
//   res.redirect("/");
// });


app.get("/logout", function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


  app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password)
      .then(function(user) {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        });
      })
      .catch(function(err) {
        console.log(err);
        res.redirect("/register");
      });
  });
  
  app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});





app.listen(3000,function(req,res){
    console.log("Server started on port 3000.")
});
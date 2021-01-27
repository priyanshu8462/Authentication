require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
   secret : "This is a secret Key.",
   resave:false,
   saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());




mongoose.connect('mongodb://localhost:27017/secretsDB',{useNewUrlParser:true, useUnifiedTopology:true});
mongoose.set("useCreateIndex",true)



const UserSchema = new mongoose.Schema({
   email : String,
   password : String,
   googleId : String,
   facebookId : String,
   secret:String
})

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

const User = mongoose.model('User',UserSchema);



passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
   done(null, user.id);
 });
 
 passport.deserializeUser(function(id, done) {
   User.findById(id, function(err, user) {
     done(err, user);
   });
 });  



passport.use(new GoogleStrategy({
   clientID : process.env.CLIENT_ID,
   clientSecret : process.env.CLIENT_SECRET,
   callbackURL : "https://localhost:3000/auth/google/secrets",
   userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
},
   function(accessToken,refreshToken,profile,cb){
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user){
         return cb(err,user);
      });
   }
))

passport.use(new FacebookStrategy({
   clientID: process.env.FACEBOOK_CLIENT_ID,
   clientSecret: process.env.FACEBOOK_SECRET,    
   callbackURL: "http://localhost:3000/auth/facebook/secrets"
 },
 function(accessToken, refreshToken, profile, done) {
   console.log("authenticated");
   User.findOrCreate({ facebookId: profile.id }, function (err, user){
      return done(err,user);
   });
 }
));





app.get('/',(req,res) => {
   res.render('home')
})

app.get('/auth/google',
   passport.authenticate('google', {scope:["profile"]})
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
   });


app.get('/auth/facebook',
   passport.authenticate('facebook'));
 
app.get('/auth/facebook/secrets',
   passport.authenticate('facebook', { failureRedirect: '/login' }),
   function(req, res) {
     // Successful authentication, redirect home.
     res.redirect('/secrets');
   });



app.get('/secrets',(req,res)=>{
   User.find({"secret":{$ne: null}},(err,foundUser)=>{
      if(!err){
         res.render("secrets",{usersWithSecret: foundUser});
      }
   })
})

app.get('/register', (req,res)=>{
   res.render('register');
})

app.post('/register', (req,res) => {
      User.register({username:req.body.username},req.body.password,(err,user)=>{
         if(err){
            console.log(err);
            res.redirect('/regiter');
         } else {
            passport.authenticate('local')(req,res,()=>{
               res.redirect('/secrets');
            });
         }
      })
})


app.get('/login', (req,res)=>{
   res.render('login')
})

app.post('/login', (req,res) => {
   const user = new User({
      username : req.body.username,
      password : req.body.password
   });

   req.login(user,(err)=>{
      console.log("login");
      if(err){
         console.log("error");
         console.log(err);
      } else {
         passport.authenticate('local')(req,res,()=>{
            res.redirect('/secrets');
         })
      }
   })
   
})

app.get('/submit',(req,res)=>{
   if(req.isAuthenticated()){
      res.render('submit');
   } else {
      res.redirect('/login');
   }
})

app.post('/submit',(req,res)=>{
   const submittedSecret = req.body.secret;
   console.log(req.user.id);
   User.findById({_id:req.user.id},(err,foundUser)=>{
      if(err){
         console.log(err);
      } else {
         if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save();
               res.redirect('secrets');
         }
      }
   })
})

app.get('/logout',(req,res)=>{
   req.logout();
   res.redirect('/');
})

app.get('/submit',(req,res) => {
   res.render('submit');
})

app.listen(3000,() => {
   console.log("server started on port 3000");
})
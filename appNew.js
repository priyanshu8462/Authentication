//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
   password : String
})

UserSchema.plugin(passportLocalMongoose);


const User = mongoose.model('User',UserSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());      //creates a cookie to store user session information
passport.deserializeUser(User.deserializeUser());  //destroys the cookie to decrypt the information 

app.get('/',(req,res) => {
   res.render('home')
})

app.get('/secrets',(req,res)=>{
   if(req.isAuthenticated()){
      res.render('secrets');
   } else {
      res.redirect('/login');
   }
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
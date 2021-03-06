//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require('md5')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect('mongodb://localhost:27017/secretsDB',{useNewUrlParser:true,useUnifiedTopology:true});

const UserSchema = new mongoose.Schema({
   email : String,
   password : String
})


// UserSchema.plugin(encrypt,{secret : process.env.SECRETKEY, encryptedFields : ['password']});

const User = mongoose.model('User',UserSchema);

app.get('/',(req,res) => {
   res.render('home')
})

app.get('/register', (req,res)=>{
   res.render('register');
})

app.post('/register', (req,res) => {
   console.log(req.body);
   bcrypt.hash(req.body.password, saltRounds, (err,hash) => {
         console.log(hash);
         const user = new User({
            email : req.body.username,
            password : hash
         })
         user.save((err)=>{
            if(err){
               console.log(err);
            } else {
               res.render('secrets');
            }
         });
   })
})


app.get('/login', (req,res)=>{
   res.render('login')
})

app.post('/login', (req,res) => {
   const username = req.body.username;
   const pass = req.body.password;
   console.log(pass);

   User.findOne({email:username},(err,foundItem)=>{
      if(err){
         console.log("Error : " +err);
      } else {
         console.log("FoundItem : " + foundItem);
         if(foundItem!=null){
            bcrypt.compare(pass, foundItem.password, function(err, result) {
               if(result){
                  res.render('secrets');
               } else {
                  res.send("Wrong username or Password");
               }
            })
         }
      }
   })
})

app.get('/submit',(req,res) => {
   res.render('submit');
})

app.listen(3000,() => {
   console.log("server started on port 3000");
})
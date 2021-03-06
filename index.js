const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

/////////////////////////////////////


//Set Mongoose
const mongoose = require('mongoose');
// mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const { Schema } = mongoose;

const userSchema = new Schema({
  username : { type : String, required: true, unique: true },
  log : [{
    _id : false,
    description: { type : String, required: true },
    duration: { type : Number, required: true },
    date : { type : Date, required: true }
  }]
});

let User = mongoose.model('User', userSchema);

// Route
app.use(function(req, res, next) {
  console.log(req.method,req.path);
  console.log(req.query)
  next();
});

app.post('/api/users', (req,res) => {
  let username = req.body.username;
  try{
    let user = new User()
    user.username = username;
    // let trySave = user.save()
    // console.log(trySave)
    // return res.json(trySave);
    user.save((err,data) =>{
      if(err){
        console.log(err)
        return res.json({
          error : true,
          message : "user already exist"
        })
      }else{
        console.log({
          username : data.username,
          _id : data._id
        })
        return res.json({
          username : data.username,
          _id : data._id
        });
      }
    })
  }
  catch(e){
    console.log(e)
  }
})

app.get('/api/users', (req,res) => {
  try{
    User.find({},"_id username",(err,data) =>{
      if(err){
        console.log(err)
      }else{
        console.log(data);
        return res.json(data)
      }
    })
  }catch(e){
    console.log(e)
  }
})

app.post('/api/users/:_id/exercises', (req,res) => {
  let _id = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  var date;
  if (isNaN(Date.parse(req.body.date))) {
    date = new Date().toDateString()
  }else{
    date = new Date(req.body.date).toDateString()
  }

  let exercise = {}
  exercise.description = description;
  exercise.duration = duration;
  exercise.date = date;
  User.findByIdAndUpdate(_id, 
    { $push : { log : exercise } },
    { new: true, useFindAndModify: false }, 
    (err,data) => {
    if(err){
      console.log(err)
      return res.json(err)
    }else{
      console.log(data)
      return res.json({           
        _id : data._id,   
        username : data.username,
        date : date,
        duration : parseInt(duration),
        description : description,
      })
    }
  })
})

app.get('/api/users/:_id/logs', (req,res) => {
  let _id = req.params._id;
  let limit = 0;
  let from;
  let to;
  let filter = {}
  let date = {}
  let respDate = {}
  // {date: { $gte: from, $lte: to }}
  if(req.query.from){
    from = new Date(req.query.from);
    date.$gte  = from;
    respDate.from = from.toDateString()
  }

  if(req.query.to){
    to = new Date(req.query.to)
    date.$lte = to;
    respDate.to = to.toDateString()
  }
  // console.log(Object.keys(date).length)
  if(Object.keys(date).length !== 0){
    filter.date = date
  }
  if(req.query.limit && req.query.limit != 0){
    limit = req.query.limit
    console.log("NOT NOL")
  }
  // console.log("limit",limit)
  // console.log("filter",filter)

try{
     User.findById(_id,"_id username log").exec((err,data) => {
      if(err){
        console.log(err)
      }else{

      let log = data.log
      if (from){
        log = log.filter(l => l.date >= from)
      }

      if (to){
        log = log.filter(l => l.date <= to)
      }
        
      if(limit){
        log = log.slice(0,limit)
      }

      if(log.length !== 0){
        log = log.map((l) => ({
          description: l.description,
          duration : l.duration,
          date : new Date(l.date).toDateString(),
        }));
      }

        resp = {
          username: data.username,
          count: log.length,
          _id: _id,
          ...respDate,
          log: log
        }
        
      // console.log(resp)
      return res.json(resp)
      }
    })
  }
  catch(e){
    console.log(e)
  }
  
  // try{
  //    User.findById(_id, "_id username ",  (err,data) => {
  //     if(err){
  //       console.log(err)
  //     }else{
  //     Exercise.find({user : data._id, ...filter},'-_id description duration date').limit(limit).exec((err1,data1) => {
  //       resp = {
  //         username: data.username,
  //         count: data1.length,
  //         _id: _id,
  //         ...respDate,
  //         log: data1
  //       }
  //       return res.json(resp)
  //       })
  //     }
  //   })
  // }
  // catch(e){
  //   console.log(e)
  // }
})




module.exports = {
    User
  }
/////////////////////////////////////

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

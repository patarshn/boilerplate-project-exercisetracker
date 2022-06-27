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
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const { Schema } = mongoose;

const userSchema = new Schema({
  username : { type : String, required: true, unique: true },
  exercises : [{ type: Schema.Types.ObjectId, ref: 'Exercise'}]
});
const exerciseSchema = new Schema({
  user: {type : Schema.Types.ObjectId, ref: "User"},
  description: { type : String, required: true },
  duration: { type : Number, required: true },
  date: { type : Date, required: true },
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

// Route
app.use(function(req, res, next) {
  console.log(req.method,req.path);
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
        console.log(data)
        return res.json(data);
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
  User.findById(_id, (err,data) => {
    if(err){
      console.log(err)
      return res.json(err)
    }else{
      console.log(data)
      if(data !== null){
        let exercise = new Exercise()
        exercise.description = description;
        exercise.duration = duration;
        exercise.date = date;
        exercise.user = data._id;
        exercise.save((err1,data1) => {
          if(err1){
            cosnole.log(err1)
          }
          else{
            console.log(data1)
            User.findByIdAndUpdate(
              _id,
              { $push : { exercises : data1._id } },
              { new: true, useFindAndModify: false },
              (err2 , data2) => {
                if(err2){
                  console.log(err2);
                }else{
                  console.log(data2)
                }
              }
            )
            return res.json({           
              _id : data._id,   
              username : data.username,
              date : date,
              duration : data1.duration,
              description : data1.description,
            })
          }
        })
      }
    }
  })
})

app.get('/api/users/:_id/logs', (req,res) => {
  let _id = req.params._id;
  let limit = {limit : Number.MAX_SAFE_INTEGER};
  let from;
  let to;
  let filter = {}
  let date = {}
  let respDate = {}
  // {date: { $gte: from, $lte: to }}
  if(req.query.from){
    from = req.query.from;
    date.$gte  = from;
    respDate.from = new Date(from).toDateString()
  }

  if(req.query.to){
    to = req.query.to
    date.$lte = to;
    respDate.to = new Date(to).toDateString()
  }
  console.log(Object.keys(date).length)
  if(Object.keys(date).length !== 0){
    filter.date = date
  }
  if(req.query.limit && req.query.limit != 0){
    limit.limit = req.query.limit
    console.log("NOT NOL")
  }
  // console.log("limit",limit)
  // console.log("filter",filter)
  try{
     User.findById({_id : _id}, "_id username")
      .populate("exercises"," description duration date ",filter,limit).exec((err,data) => {
      if(err){
        console.log(err)
      }else{
        console.log(data)
        let exercises = data.exercises
        if(exercises.length !== 0){
          exercises = exercises.map((e) => ({
            description: e.description,
            duration : e.duration,
            date : new Date(e.date).toDateString(),
          }));
        }
        
        resp = {
          username: data.username,
          count: data.exercises.length,
          _id: _id,
          log: exercises,
          ...respDate
        }
        return res.json(resp)
      }
    })
  }
  catch(e){
    console.log(e)
  }
  // Exercise.findById(_id)
  //   .populate('user')
  //   .exec((err,data) => {
  //   if(err){
  //     console.log(err)
  //   }else{
  //     console.log(data)
  //     return res.json(data)
  //   }
  // })
})




module.exports = {
    User, Exercise,
  }
/////////////////////////////////////

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

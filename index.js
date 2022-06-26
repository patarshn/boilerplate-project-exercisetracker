const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/////////////////////////////////////

//Set Mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const { Schema } = mongoose;


const urlSchema = new Schema({
  original_url : { type: String, required: true },
  short_url  : { type: String, required: true },
});

const userSchema = new Schema({
  username : { type : String, required: true },
});
const exerciseSchema = new Schema({
  username: { type : String, required: true },
  description: { type : String, required: true },
  duration: { type : Number, required: true },
  date: { type: Date, default: Date.now },
});
// const logSchema = new Schema({
//      username: "fcc_test",
//     count: 1,
//     _id: "5fb5853f734231456ccb3b05",
//     log: [{
//       description: "test",
//       duration: 60,
//       date: "Mon Jan 01 1990",
//     }]
// });

let Url = mongoose.model('Url', urlSchema);







/////////////////////////////////////

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

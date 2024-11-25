const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose")
const bodyParser = require("body-parser")

const { Schema } = require("mongoose")
const req = require('express/lib/request')
require('dotenv').config()
const MONGO_URI = process.env.MONGO_URI
mongoose.connect(MONGO_URI)

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  log:[{
    date: String,
    duration: Number,
    description: String
  }],
  count: Number
})

const User = mongoose.model("User", userSchema)

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req,res) => {
    const username = req.body.username
    const user = new User({ username, count: 0 })
    user.save((err, data)=>{
      if (err){
        res.json({error: err})
      }
      res.json(data)
    })
})

app.get("/api/users",(req,res) => {
  User.find((err,data) => {
    if(data){
      res.json(data)
    }
  })
})

app.post("/api/users/:_id/exercises", (req,res) => {
  const { description } = req.body
  const duration = parseInt(req.body.duration)
  const date = req.body.date ? "Mon Jan 01 1990": "Mon Feb 21 2022"
  const id = req.params._id
  const exercise = {
        
    date,
    duration,
    description,
    
  }
  User.findByIdAndUpdate(id,{$push: { log: exercise}, $inc: {count: 1}}, {new: true}, (err,user) => {
    if(user){
      
      const updateExercise = {
        _id: id,
        username: user.username,
        ...exercise
      }
       res.json(updateExercise)
          
    }
  })
})

app.get("/api/users/:_id/logs", (req,res)=>{
  const {from, to, limit} = req.query

  User.findById(req.params._id,(err,user)=>{
    if(user){
      if(from || to || limit){
        const logs = user.log
        const filteredLogs = logs
        .filter(log =>{
          const formattedLogDate = new Date(log.date).toISOString().split("T")[0]
          console.log(formattedLogDate)
          return true
        })

        console.log(filteredLogs)
        const slicedLogs = limit ? filteredLogs.slice(0,limit) : filteredLogs
        user.log = slicedLogs
        console.log(slicedLogs)
      
      }

      
      res.json(user)
    }
  })
})


app.get("/mongo-health", (req,res) =>{
res.json({status: mongoose.connection.readyState})
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

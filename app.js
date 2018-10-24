const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const router = express.Router();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const Room = require('./model/RoomList');
const socketIo = require("socket.io");
const config = require('./config')
const port = process.env.PORT;
const app = express()
const options = {
  key: fs.readFileSync('./key/key.pem'),
  cert: fs.readFileSync('./key/cert.pem')
};

app.use(express.urlencoded());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors());
app.use(morgan('dev'))
app.use('/', router);
app.set('json spaces', 2);
app.set('jwt-secret', config.secret)
app.use('/api', require('./routes/api'))

const server = app.listen(port, function(){  
  console.log("Https server listening on port " + port);
});

app.get('/', function (req, res) {  
  res.writeHead(200, {'Content-Type' : 'text/html'});
  res.write('<h3>Welcome</h3>');
  res.write('<a href="/login">Please login</a>');
  res.end();
});

const io = socketIo(server);
io.on('connection', (socket) => {
  console.log({'a user connected' : socket.id});
  var room = Room.find((err, data) => {
    if (err) {
      console.log("---Gethyl GET failed!!")
    } else {
      socket.emit('initialList', data);
      console.log("데이터를 가져왔습니다.")
    }
  });

  socket.on('addItem', (addData) => {
    let {
      title,
      userName,
      userMail
    } = addData;
    const newRoom = new Room({
      title,
      userName,
      userMail
    });
    newRoom.save((err, roomsData) => {
      if (err) {
        console.log("---Gethyl ADD NEW ITEM failed!! " + err)
      } else {
        io.emit('itemAdded', roomsData)
        console.log({ message: "+++Gethyl ADD NEW ITEM Added!" })
      }
    });
  })

  socket.on('removeItem', (id) => {
    Room.findOneAndDelete({ _id: id }, function (err) {
      if (err) {
        console.log("---Gethyl ADD NEW ITEM failed!! " + err)
      } else {
        io.emit('itemRemove', id);
        console.log({ message: "+++Gethyl ADD NEW ITEM Removed!!" })
      }
    })
  });

  socket.on('disconnect', () => {
    console.log("나감요." + socket.id)
    io.emit('user disconnected');
  });
});

mongoose.connect(
  config.mongodbUri,
  { useNewUrlParser: true }
);
mongoose.set("useCreateIndex", true);
const db = mongoose.connection;
db.once('open', () => {
  console.log('DB Connected...');
})


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
const config = require('./config');
const port = process.env.PORT || 8080;
const app = express();
const pbkdf2Password = require('pbkdf2-password');
const hasher = pbkdf2Password();
const options = {
  key: fs.readFileSync('./key/key.pem'),
  cert: fs.readFileSync('./key/cert.pem')
};

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

// app.use();
app.use(express.urlencoded());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/', router);
app.set('json spaces', 2);
app.set('jwt-secret', config.secret);
app.use('/api', require('./routes/api'));


const server = app.listen(port, function () {
  console.log("Https server listening on port " + port);
});

app.get('/',  cors(corsOptionsDelegate), (req, res) => {
  res.writeHead(200, { 
    'Content-Type': 'text/html'
  });
  res.write('<h3>Welcome</h3>');
  res.end();
});

app.post('/passcheck', (req, res) => {
  const { roomid } = req.body;
  Room.findOne({ _id: roomid }, function (err, room) {
    if (err) { return res.status(500).send({ error: 'database find failure' }); }
    const { password } = req.body;
    hasher({ password, salt: room.userSalt }, function (err, pass, salt, hash) {
      if (hash === room.roomPassword) {
        res.json({ message: true });
      } else {
        res.json({ message: false });
      }
    });
  });
});

const io = socketIo(server);

io.on('connection', (socket) => {
  console.log({ 'a user connected': socket.id });
  var room = Room.find((err, data) => {
    if (err) {
      console.log("---Gethyl GET failed!!");
    } else {
      socket.emit('initialList', data);
      console.log("데이터를 가져왔습니다.");
    }
  });

  socket.on('addItem', (addData) => {
    let {
      title,
      roomPassword,
      userName,
      userMail
    } = addData;
    hasher({ password: addData.roomPassword }, function (err, pass, salt, hash) {
      const newRoom = new Room({
        title,
        roomPassword: hash,
        userName,
        userMail,
        userSalt: salt
      });
      newRoom.save((err, roomsData) => {
        if (err) {
          console.log("---Gethyl ADD NEW ITEM failed!! " + err)
        } else {
          io.emit('itemAdded', roomsData)
          console.log({ message: "+++Gethyl ADD NEW ITEM Added!" })
        }
      });
    });
  })

  socket.on('removeItem', (id) => {
    Room.findOneAndDelete({ _id: id }, function (err) {
      if (err) {
        console.log("---Gethyl ADD NEW ITEM failed!! " + err);
      } else {
        io.emit('itemRemove', id);
        console.log({ message: "+++Gethyl ADD NEW ITEM Removed!!" });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(socket.id);
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


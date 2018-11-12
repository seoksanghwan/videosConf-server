var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const roomSchema = new Schema({
  title:  {
    type : String,
    required: true
  },
  userName:  {
    type : String,
    required: true
  },
  userMail:  {
    type : String,
    required: true
  },
  roomPassword:  {
    type : String,
    required: true
  },
  userSalt: {
    type : String,
    required: true
  }
})

var Room = mongoose.model('rooms', roomSchema);

module.exports = Room;
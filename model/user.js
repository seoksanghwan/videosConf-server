const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
    uid : String,
    name : String,
    url : String,
    email : String
})

// create new User document
User.statics.create = function(uid) {
    const user = new this({
        uid,
        name,
        url,
        email
    })
    return user.save()
}

// find one user by using username
User.statics.findOneByUsername = function(uid) {
    return this.findOne({uid}).exec()
}

// verify the password of the User documment
User.methods.verify = function(uid) {
    return this.uid === uid
}

module.exports = mongoose.model('User', User)
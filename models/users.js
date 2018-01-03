var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    name: String,
    roll: Number
});

module.exports = mongoose.model("User", UserSchema);
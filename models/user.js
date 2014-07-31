var userService = require('service/userService');

var mongoose = require('lib/mongoose'),
  Schema = mongoose.Schema;

var schema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

schema.virtual('password')
  .set(function(password) {
    this._plainPassword = password;
    userService.setPassword(this, password);
  })
  .get(function() { return this._plainPassword; });

exports.User = mongoose.model('User', schema);






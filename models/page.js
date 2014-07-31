var mongoose = require('lib/mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var schema = new Schema({
  name: {
    type: String,
    required: true
  },
  title: {
    type: String
  },
  parent : {
    type : ObjectId,
    ref: 'Page'
  },
  created: {
    type: Date,
    'default': Date.now
  }
});

exports.Page = mongoose.model('Page', schema);

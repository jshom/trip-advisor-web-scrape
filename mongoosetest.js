var mongoose = require('mongoose')
var user = 'jshom', pswd = 'jshom'
var Schema = mongoose.Schema
var a = 0
var b = 0

//CONNECT TO DB
db = mongoose.connection
mongoose.connect('mongodb://' + user +':' + pswd + '@ds011024.mlab.com:11024/shomstein-test')

db.once('open', function () {
  var dateOne = mongoose.model('6 27 2016 14', {
    name: String,
    rating: Number,
    hotel_id: Number,
    reviews: [{
      id : Number,
      user : String,
      rating: Number,
      review : String
    }]
  })

  var dateTwo = mongoose.model('6 27 2016 15', {
    name: String,
    rating: Number,
    hotel_id: Number,
    reviews: [{
      id : Number,
      user : String,
      rating: Number,
      review : String
    }]
  })

  dateOne.find({}, function (err, hotelsa) {
    if (err) throw err
    a = hotelsa[0].rating
    console.log(hotelsa[0]);
  }).then(function () {
    dateTwo.find({}, function (err, hotelsb) {
      if (err) throw err
      b = hotelsb[0].rating
      console.log(hotelsb[0]);
    }).then(function () {
      console.log('a:', a, 'b:', b);
      console.log(typeof a, typeof b);
      if (a != b) {
        console.log('Rating has changed');
      } else {
        console.log('same same');
      }
    })
  })
})

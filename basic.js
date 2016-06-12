var express = require('express');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var cmd = require('node-cmd');
var fs = require('fs');
var app = express();
var port = 8000;
var url = 'https://www.tripadvisor.com/Hotels-g60763-oa60-New_York_City_New_York-Hotels.html#ACCOM_OVERVIEW';
var user = 'jshom',
      pswd = 'jshom';
mongoose.connect('mongodb://' + user +':' + pswd + '@ds011024.mlab.com:11024/shomstein-test');
var db = mongoose.connection;

var Hotel = mongoose.model('Hotel', { name: String, rating: Number, hotel_id: Number });

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected!');
  getDataFromPage(0);
});

var h_name = [],
    h_rating = [],
    h_id = [],
    hotels = [],
    hotel_count = 0,
    list = {};

function notEmpty(obj) {
  if (obj.name === '') {
    return false;
  } else {
    return true;
  }
}

function setUrl(pageNum) {
  var d_num = (pageNum * 30) + 60;
  url = 'https://www.tripadvisor.com/Hotels-g60763-oa'+ d_num +'-New_York_City_New_York-Hotels.html#ACCOM_OVERVIEW';
}

function sendHotels() {
  hotels.forEach(function(hotel) {
    if(hotel.rating === undefined) {
      hotel.rating = 0;
    }

    //Check if exists...

    var db_hotel = new Hotel({name: hotel.name, rating: hotel.rating, hotel_id: hotel.hotel_id});
    db_hotel.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log(hotel.name, ' saved');
      }
    });
    //console.log(hotel);
    //console.log('yes');
  });
}

function getDataFromPage(pageNum) {
  setUrl(pageNum);
  //console.log(url);
  request(url, function(error, res, body) {
    //LOAD BODY
    var $ = cheerio.load(body);

    $('.listing').children().children().children().children().children().each(function(i, el) {

      //Get name of hotel
      h_name[i] = $(this).children('.listing_title').children('a').text();

      //Get rating of the hotel
      h_rating[i] = $(this).children('.listing_rating').children('.rating').children('.prw_rup').children('.rate').children('img').attr('alt');

      //Get id of hotel
      h_id[i] = $(this).parent().parent().parent().parent().parent().attr('data-locationid');

      //Correct sponsored ids
      if (h_id[i] === undefined) {
        var sponsored_id = $(this).children('.listing_title').children('a').attr('id');
        sponsored_id = sponsored_id + "";
        h_id[i] = sponsored_id.toString().substring(9);
      }

      if(h_rating[i] !== undefined) {
        if(h_rating[i].length > 13) {
          h_rating[i] = Number(h_rating[i].slice(0,3).trim());
          hotel_count++;
        } else {
          h_rating[i] = Number(h_rating[i].slice(0,2).trim());
          hotel_count++;
        }
        console.log('hotel-count:', hotel_count);
      }

      // TODO: GET THE COMMENTS AND SEACH FOR NEGATIVE WORKDS SUCH AS
      /*
      1. Towels
      2. Service
      3.
      4.
      5.
      */

      hotels[i + pageNum*31] = {
        name : h_name[i],
        rating : h_rating[i],
        hotel_id : h_id[i]
      };
    });

    hotels = hotels.filter(notEmpty);
    if(hotel_count % 31 === 0 && pageNum <= 16) {
      getDataFromPage(pageNum+1);
    }
    if (hotel_count >= 409) {
      console.log(hotels);
      sendHotels();
    }
  });
}

//REST API
app.listen(port);
console.log('server is listening on', port);

app.all('/', function(req, res) {
  res.send(JSON.stringify(hotels, null, 2));
  console.log(hotels.length);
});

app.all('/id/:id', function(q, r) {
  var d_hotel = hotels.filter(function(hotel) {
    return hotel.id === q.params.id;
  });
  r.send(d_hotel);
});

app.all('/rating/:rating', function(q, r) {
  q.params.rating = Number(q.params.rating);
  var d_hotel = hotels.filter(function(hotel) {
    return hotel.rating == q.params.rating;
  });
  if(isNaN(q.params.rating)) {
    r.send('Use numbers 0-5 only');
  } else if (q.params.rating > 5) {
    r.send('Use numbers 0-5 only');
  } else {
    r.send(d_hotel);
  }
});

app.all('/save', function (req, res) {
  //SEND DATA TO JSON FILE
  fs.writeFile('data.json', JSON.stringify(hotels, null, 2), function(err) {
    if (err) throw err;
    console.log('Data is saved into JSON file');
    res.sendStatus(200);
  });
});

var express = require('express');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var app = express();
var port = 8000;
var url = 'https://www.tripadvisor.com/Hotels-g60763-oa60-New_York_City_New_York-Hotels.html#ACCOM_OVERVIEW';

//INIT VARIABLES

var h_name = [],
    h_rating = [],
    h_id = [],
    hotels = [],
    hotel_count = 0;

//GET RAW DATA FROM SOURCE
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

    hotels[i] = {
      name : h_name[i],
      rating : h_rating[i],
      id : h_id[i]
    };
  });

function notEmpty(obj) {
  if (obj.name === '') {
    return false;
  } else {
    return true;
  }
}

hotels = hotels.filter(notEmpty);

console.log(hotels);
  if(hotel_count % 31 === 0) {
    //rerun the get data function and change url to load new page
  }
});

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

var express = require('express');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var app = express();
var port = 8000;

//INIT VARIABLES

var h_name = [],
    h_rating = [],
    h_id = [];

var hotels = [];

//GET RAW DATA FROM SOURCE
var url = 'https://www.tripadvisor.com/Hotels-g60763-New_York_City_New_York-Hotels.html';
request(url, function(error, res, body) {
  //LOAD BODY
  var $ = cheerio.load(body);

  $('.listing').children().children().children().children().children().each(function(i, el) {
    //Get name of hotel
    h_name[i] = $(this).children('.listing_title').children('a').text();

    //Get rating of the hotel
    h_rating[i] = $(this).children('.listing_rating').children('.rating').children('.prw_rup').children('.rate').children('img').attr('alt');

    //Get id of hotel
    h_id[i] = $(this).parent().parent().parent().parent().parent().attr('id');

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
  //SEND DATA TO JSON FILE
  fs.writeFile('data.json', JSON.stringify(hotels, null, 2), function(err) {
    if (err) throw err;
    console.log('It\'s saved!');
  });
});

//Express business
app.listen(port);
console.log('server is listening on', port);

app.all('/', function(req, res) {
  res.send(data);
});

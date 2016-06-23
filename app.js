//Copyright (c) 2016 Jacob Shomstein All Rights Reserved.
var Spinner = require('cli-spinner').Spinner;
var express = require('express');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var fs = require('fs');
var chalk = require('chalk');
var app = express();
var port = 8000;
var url = 'https://www.tripadvisor.com/Hotels-g60763-oa60-New_York_City_New_York-Hotels.html#ACCOM_OVERVIEW';
var user = 'jshom', pswd = 'jshom';
mongoose.connect('mongodb://' + user +':' + pswd + '@ds011024.mlab.com:11024/shomstein-test');
var db = mongoose.connection;

//Loading spiner for loading hotels
var load_spin = new Spinner(chalk.red.bold('Getting Hotels %s'));
load_spin.setSpinnerString('.|*')

var h_name = [],
    h_rating = [],
    h_id = [],
    h_review_page = [],
    hotels = [],
    reviews = [],
    hotel_count = 0;


// Function for naming mongo documents
var current_time = function () {
  var now = new Date();
  var date = now.getDate();
  var month = now.getMonth() + 1;
  var year = now.getFullYear();
  var hour = now.getHours();
  var time = month + ' ' + date + ' ' + year + ' ' + hour;
  return time;
}

function clearUndefinedRatings() {
  hotels.forEach(function(hotel) {
    if (hotel.rating === undefined) {
      hotel.rating = 0;
    }
  })
}

//Remove more at the end of commment
function reviewRemoveMore() {
  hotels.forEach(function(hotel) {
    hotel.reviews.forEach(function(review) {
      if (review.review.substring(review.review.length - 6, review.review.length - 2) === 'More') {
        review.review = review.review.slice(0, -9);
      }
    })
  })
}

//Change the name if it is hotel response
function changeHotelResponseNames() {
  for (var i = 0; i < hotels.length; i++) {
    for (var a = 0; a < hotels[i].reviews.length; a++) {
      if (a >= 1) {
        if (hotels[i].reviews[a-1].user === hotels[i].reviews[a].user) {
          hotels[i].reviews[a].user = 'Hotel response to: ' + hotels[i].reviews[a].user;
          hotels[i].reviews[a].review = 'Hotel response: ' + hotels[i].reviews[a].review;
        }
      }
    }
  }
}

function sortHotelsByNames() {
  function byName(a,b) {
    var nameA = a.name.toUpperCase();
    var nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      // names must be equal
      return 0;
  }
  hotels = hotels.sort(byName);
}

/*function sortReviewsbyPage() {
  function byPage() {
    if (a.page > b.page) {
    return 1;
  }
  if (a.value < b.value) {
    return -1;
  }
  // a must be equal to b
  return 0;
  }
  hotels.forEach(function(hotel) {
    hotel.review.sort(byPage);
  })
}*/

//Modeling for data
var Hotel = mongoose.model(
  current_time(),
  {
    name: String,
    rating: Number,
    hotel_id: Number,
    reviews: [{
      id : Number,
      user : String,
      rating: Number,
      review : String
    }]
  });

//Create error/success on connection to MongoDB
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected!');
  console.log('Loading NYC Hotels');
  load_spin.start();
  getDataFromPage(0);
});

//Make sure that the hotel has a name
function notEmpty(obj) {
  if (obj.name === '') {
    return false;
  } else {
    return true;
  }
}

//Change url for each page
function setUrl(pageNum) {
  var d_num = (pageNum * 30) + 60;
  url = 'https://www.tripadvisor.com/Hotels-g60763-oa'+ d_num +'-New_York_City_New_York-Hotels.html#ACCOM_OVERVIEW';
}

var db_count = 0;
//Send the hotels to MongoDB
function sendHotels() {
  hotels.forEach(function(hotel) {
    var db_hotel = new Hotel({
      name: hotel.name,
      rating: hotel.rating,
      hotel_id: hotel.hotel_id,
      reviews: hotel.reviews
    });
    db_hotel.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        db_count++;
        if (db_count === hotels.length) {
          console.log(chalk.green('All Hotels Saved'));
          console.log(chalk.green.bgBlack('Done for now :D'));
        }
      }
    });
  });
}

function changeReviewPage(o, rPageNum) {
  if (rPageNum === 0) {
    return url;
  }
  var raw_r_url = o.split('-');
  var pre = raw_r_url.slice(0,4).join('-');
  var mid = '-or' + (rPageNum * 10) + '-';
  var post = raw_r_url.slice(4, raw_r_url.length).join('-');
  return pre.concat(mid,post);
}

function getHotelReviews(hotel_review_page) {
  var max = 0;
  reviews = [];
  if (hotel_review_page) {
    request(hotel_review_page, function(err, res, body) {
      if (res && body) {
        var $2 = cheerio.load(body);
        if (!body) return;
        max = Number($2('a.pageNum').last().text());
        for (var i = 0; i <= max; i++) {
          request(changeReviewPage(hotel_review_page, i), function(error, res, body) {
            if (res && body) {
            var $3 = cheerio.load(body);
              $3('p.partial_entry').each(function() {
                reviews.push({
                  id : ($3(this)
                    .parent()
                    .parent()
                    .parent()
                    .parent()
                    .parent()
                    .parent()
                    .attr('id') + '')
                    .substring(7),
                  user : $3(this)
                    .parent()
                    .parent()
                    .parent()
                    .parent()
                    .parent()
                    .children('.col1of2')
                    .children('.member_info')
                    .children().children('.mo')
                    .children('span')
                    .text(),
                  rating : Number(($3(this)
                    .parent()
                    .parent()
                    .children('.rating')
                    .children('.rating_s')
                    .children('img')
                    .attr('alt') + '')
                    .substring(0,1)),
                  review : $3(this)
                    .text()
                    .replace(/(\r\n|\n|\r|)/gm,"")
                    .replace(/(\"|\')/gm, "'")
                });
              });
            }
          })
        }
      }
    })
  }
}

//Get each hotel from the host url (NYC)
function getDataFromPage(pageNum) {
  setUrl(pageNum);
  request(url, function(error, res, body) {
    //LOAD BODY
    var $ = cheerio.load(body);

    //gets each hotel listing
    $('.listing')
      .children()
      .children()
      .children()
      .children()
      .children()
      .each(function(i, el) {

      //Get rating of the hotel
      h_rating[i] = $(this)
        .children('.listing_rating')
        .children('.rating')
        .children('.prw_rup')
        .children('.rate')
        .children('img')
        .attr('alt');

      //Get id of hotel
      h_id[i] = $(this)
        .parent()
        .parent()
        .parent()
        .parent()
        .parent()
        .attr('data-locationid');

      //Get name of hotel
      h_name[i] = $(this)
        .children('.listing_title')
        .children('a')
        .text();

      //Get the reviews page
      var hotel_resource = $(this)
        .children('.listing_title')
        .children('a').attr('href');

      //set the proper page for each hotel
      h_review_page[i] = 'https://tripadvisor.com' + hotel_resource;

      //Correct sponsored ids
      if (h_id[i] === undefined) {
        var sponsored_id = $(this)
          .children('.listing_title')
          .children('a')
          .attr('id');

        sponsored_id = sponsored_id + "";

        h_id[i] = sponsored_id
          .toString()
          .substring(9);
      }

      if(h_rating[i] !== undefined) {
        if(h_rating[i].length > 13) {
          h_rating[i] = Number(h_rating[i]
            .slice(0,3)
            .trim());
        } else {
          h_rating[i] = Number(h_rating[i]
            .slice(0,2)
            .trim());
        }

        if(h_rating[i] === undefined) {
          h_rating[i] = 0;
        }

        if (h_rating[i] && h_id[i] && h_review_page[i] && hotel_resource && h_name[i] && h_rating[i]) {
          getHotelReviews(h_review_page[i]);
        }
        hotel_count++;
      }

      hotels[i + pageNum*31] = {
        name : h_name[i],
        rating : h_rating[i],
        hotel_id : h_id[i],
        hotel_r_page : h_review_page[i],
        reviews : reviews
      };
    });

    hotels = hotels.filter(notEmpty);

    //console.log('Hotels completed: ' + chalk.white.bold.bgBlack(hotels.length));

    if(hotel_count % 31 === 0 && pageNum <= 16) {
      getDataFromPage(pageNum+1);
    }
    if (hotels.length >= 429) {
      //Final edits to data
      load_spin.stop(true);
      console.log(chalk.bgRed('--edits--'));
      sortHotelsByNames();
      clearUndefinedRatings();
      changeHotelResponseNames();
      reviewRemoveMore();
      //sortReviewsbyPage();
      sendHotels();
      return;
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

app.all('/name/:name', function(req, res) {
  var d_hotel = hotels.filter(function(hotel) {
    return hotel.name = decodeURI(req.params.name);
  });
  res.json(d_hotel[0]);
})

app.all('/id/:id', function(q, r) {
  var d_hotel = hotels.filter(function(hotel) {
    return hotel.hotel_id === q.params.id;
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

app.all('/filter/:text', function (req, res) {
  var words = req.params.text.split(',');
  words.forEach(function(word) {
    filterBy(word)
  });
  function searchFor(data) {
    var d_hotels = hotels.filter(function(hotel) {
      for (var i = 0; i < hotel.reviews.length; i++) {
        return hotel.reviews[i].review.search(data) >= data.length;
      }
    })
  }
  res.send(d_hotels);
})

app.all('/first', function(req, res) {
  res.send(hotels[0]);
});

app.all('/first/review', function(req, res) {
  res.send(hotels[0].reviews[0]);
});

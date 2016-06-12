var express = require('express');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var cmd = require('node-cmd');
var fs = require('fs');
var app = express();
var port = 8000;
var url = 'https://www.tripadvisor.com/Search?q=West+57th+Street+by+Hilton+Club';

request(url, function (error, res, body) {
  var $1 = cheerio.load(body);
  var f_el = $1('.result').first().attr('onclick') + '';
  //f_el = f_el.substring(40,100);

  f_el = f_el
    .split(';')[0]
    .substring(58)
    .slice(0,-2);

  var comment_url = 'https://www.tripadvisor.com/' + f_el;
  console.log(comment_url);
});

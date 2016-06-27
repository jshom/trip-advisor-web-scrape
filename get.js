var type = '0';
var text = '0';

$('p').click(function() {
  type = '';
  text = '';
})

$('button').click(function() {
  $('.response').empty();
  data = 0;
  var type = $('.radios:checked').val();
  var text = $('#search').val();
  console.log(type, text);
  if (type === undefined) {
    $.getJSON('http://c8148890.ngrok.io/', function (data) {
      data.forEach(function(hotel) {
        $('.response').append('<ul><li>Name: ' + hotel.name + '</li><li> Rating:' +hotel.rating+'</li><li>ID:' + hotel.id + ' </li></ul>');
        console.log(JSON.stringify(data, null, 2));
      });
      data = [];
      hotel = {};
    })
  } else {
    $.getJSON('http://c8148890.ngrok.io/' + type + '/' + text, function (data) {
      if (type === 'name' || type === 'id') {
        $('.response').append('<ul><li>Name: ' + data.name + '</li><li>Rating: ' +data.rating+'</li></ul>');
        if (data.reviews) {
          data.reviews.forEach(function(review) {
            $('.response').append('<p>'+review+'</p>');
          })
          data.reviews = [];
          data = [];
          hotel = {};
        }
      } else {
        data.forEach(function(hotel) {
          $('.response').append('<ul><li>Name: ' + hotel.name + '</li><li>Rating: ' +hotel.rating+'</li></ul>');
          hotel.name = "";
        });
      }
    })
  }
});

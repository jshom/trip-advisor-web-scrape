var async = require('async');
var _ = require('underscore');

/**
 * The go method.
 * @returns {unresolved}
 */
module.exports = function() {
  var self = this, show = false;

  // Get the arguments.
  var args = _.values(arguments);

  // See if we should print the command...
  if (typeof args[0] === 'boolean') {
    show = args.shift();
  }

  // Get the method.
  var method = args.shift();

  // Return the async.js signature.
  return function(done) {
    var value = null, i=0;

    // Iterate through each of the arguments.
    async.eachSeries(args, function(arg, done) {

      // If the argument is a function.
      if (typeof arg === 'function') {

        // Closure around the index...
        (function(index) {

          // Get the value returned from the function.
          value = arg.call(self, function(val) {

            // Set the argument and say we are done.
            args[index] = val;
            done();
          });

          // If they return a value, then say we are done.
          if (value !== undefined) {

            // Set the argument and say we are done.
            args[index] = value;
            done();
          }
        })(i++);
      }
      else {
        i++;
        done();
      }
    }, function(error) {

      // If they wish to show the methods, then log to console.
      if (show) {
        console.log(method + '(' + args.join(', ') + ')');
      }

      // Add the done function
      args.push(function() {
        done();
      });

      // Apply the method with arguments.
      self[method].apply(self, args);
    });
  };
};
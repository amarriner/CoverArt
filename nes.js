var exec = require('child_process').exec;
var fs = require('fs');

// Holds the current image names and filenames
var data;

// Module to hold keys for APIs
var Keys = require('keys');
var k = new Keys();

// Holds the setTimeout interval so we can cancel if later if necessary
var interval;

// Twitter function to post images
var twitter_update_with_media = require('twitter_update_with_media');
var twitter = new twitter_update_with_media({
                    consumer_key    : k.twitterConsumerKey,
                    consumer_secret : k.twitterConsumerSecret,
                    token           : k.twitterAccessToken,
                    token_secret    : k.twitterAccessTokenSecret
             });

// Twitter client
var Twit = require('twit');
var t = new Twit({
   consumer_key       : k.twitterConsumerKey,
   consumer_secret    : k.twitterConsumerSecret,
   access_token       : k.twitterAccessToken,
   access_token_secret: k.twitterAccessTokenSecret
});

// Set up a stream to look at all tweets for @CoverArtJumble
var stream = t.stream('user');

stream.on('tweet', function(tweet) {
   console.log('------------------------------------------------------------------------------------------------');
   console.log(tweet.user.screen_name + ' :: ' + tweet.id_str + ' :: ' + tweet.text);

   // Ignore tweets by @CoverArtJumble, but check all others for a correct answer
   if (tweet.user.screen_name.toLowerCase() != 'coverartjumble') {

      // If the current solution is found in the tweet, the user who replied is the winner 
      var pun = new RegExp('[^A-Za-z0-9]', 'g');
      var im1 = data[0]['name'].replace(pun, '').toLowerCase();
      var r1  = new RegExp(im1);
      var im2 = data[1]['name'].replace(pun, '').toLowerCase();
      var r2  = new RegExp(im2);

      if (tweet.text.replace(pun, '').toLowerCase().match(r1) &&
          tweet.text.replace(pun, '').toLowerCase().match(r2)) {
          tweet_winner(tweet);
      }
   }
});


// Calls a python script to generate images
function generate_images() {

   // Only go if there's no previous data
   if (! fs.existsSync('data.json')) {
      console.log(' - Generating random images');

      var py = exec('./nes.py', function (error, stdout, stderr) {

         if (error) {
            console.log(' * Error : ' + error);
            console.log(' * STDERR: ' + stderr);
            clearInterval(interval);
            interval = setTimeout(function() { get_word() }, 10000);
            return;
         }

         if (fs.existsSync('data.json')) {
             console.log(' - Images created successfully, reading data.json');
             data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

             console.log(' - Tweeting jumble for ' + data[0]['name'] + ' and ' + data[1]['name']);
             twitter.post('New cover art jumble! Reply to Solve! You have four hours!', 'images/jumble.png', function(err, response, body) {
                if (err) {
                   console.log(' * Error: ' + err);
                }
                else {
                   console.log(' - Tweeted jumble successfully');
                }
             });

            // Set an interval to handle if no one answers correctly
            interval = setTimeout(function() { tweet_next() }, (4 * 60 * 60 * 1000));
         }
         else {
            console.log(' * Error: missing data.json!');
         }
      });
   }

   else {
      console.log(' - Reading data.json from file');
      data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
      // Set an interval to handle if no one answers correctly
      clearInterval(interval);
      interval = setTimeout(function() { tweet_next() }, (4 * 60 * 60 * 1000));
   }
}

// Tweet the answer and generate a new image if no one answers correctly
function tweet_next() {
   console.log(' - Tweeting result, then new');

   twitter.post('The correct answer was ' + data[0]['name'] + ' and ' + data[1]['name'] + '!',
      'images/anim.gif',
      function (err, data, response) {
         if (err) {
            console.log(' - Reply error: ' + err);
         }

      // Get a new image set in 5 seconds
      clearInterval(interval);
      if (fs.existsSync('data.json')) {
         fs.unlinkSync('data.json');
      }
      interval = setTimeout(function() { generate_images() }, 5000);
   });
}

// Tweet the winner of the last jumble
function tweet_winner(tweet) {
   console.log(' - @' + tweet.user.screen_name + ' tweeted the correct answer, replying and favoriting (' + tweet.id_str + ')');

   t.post('favorites/create', { id: tweet.id_str, id_str: tweet.id_str }, function (err, data, response) {
      if (err)
         console.log(' - Favorite error: ' + err);
   });

   twitter.post('.@' + tweet.user.screen_name + ' got the correct answer ' + data[0]['name'] + ' and ' + data[1]['name'] + '!',
      'images/anim.gif',
      function (err, data, response) {
         if (err) {
            console.log(' - Reply error: ' + err);
         }

         // Get a new image set in 5 seconds
         clearInterval(interval);
         if (fs.existsSync('data.json')) {
            fs.unlinkSync('data.json');
         }
         interval = setTimeout(function() { generate_images() }, 5000);
      });
}

// Initiate the first call
generate_images();

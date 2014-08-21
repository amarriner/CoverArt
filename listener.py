"""Class to listen to twitter streams (based on: https://github.com/tweepy/tweepy/blob/master/examples/streaming.py)"""

from tweepy.streaming import StreamListener


class StdOutListener(StreamListener):
   """Listens for tweets"""

   def on_data(self, data):
      print data
      return True

   def on_error(self, status):
      print status

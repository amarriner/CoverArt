#!/usr/bin/env python
"""Script that mashes NES boxart together and tweets them"""

import gd
import os
import random
import re
import subprocess
import sys


PWD       = '/home/amarriner/python/nes/'
IMAGE_DIR = PWD + '/images/nes/'
SAVE_DIR  = '/home/amarriner/public_html/'

DIMENSIONS  = (490, 680)
FRAMES      = 5
X_OFFSET    = 600
SQUARE_SIZE = 10


def build_animated_frames(images):
   """Builds several images that will be compiled into an animated GIF"""

   for i in range(0, FRAMES):
      im1 = gd.image(DIMENSIONS, True)
      images[0]['img'].copyTo(im1, (0, 0), (X_OFFSET, 0), DIMENSIONS)

      im2 = gd.image(DIMENSIONS, True)
      images[1]['img'].copyTo(im2, (0, 0), (X_OFFSET, 0), DIMENSIONS)

      for j in range(0, DIMENSIONS[1] / FRAMES):
         images[1]['img'].copyTo(im1, (0, j * FRAMES), (X_OFFSET, j * FRAMES), (DIMENSIONS[0], i + 1))
         images[0]['img'].copyTo(im2, (0, j * FRAMES), (X_OFFSET, j * FRAMES), (DIMENSIONS[0], i + 1))

      im1.writePng(SAVE_DIR + '/anim' + str(i) + '.png')
      im2.writePng(SAVE_DIR + '/anim' + str(i + FRAMES) + '.png')


def build_jumble(images):
   """Builds a jumbled image from two boxarts"""

   im = gd.image(DIMENSIONS, True)

   k = 0
   for i in range(0, (DIMENSIONS[0] / SQUARE_SIZE)):
      for j in range(0, (DIMENSIONS[1] / SQUARE_SIZE)):
         images[k % 2]['img'].copyTo(im, (i * SQUARE_SIZE, j * SQUARE_SIZE), (i * SQUARE_SIZE + X_OFFSET, j * SQUARE_SIZE), (SQUARE_SIZE, SQUARE_SIZE))

         k += 1
      k += 1

   im.writePng(SAVE_DIR + '/jumble.png')


def get_images():
   """Finds two random boxarts and returns the resulting array of data"""

   images = []
   for i in range(0, 2):
      file = random.choice(os.listdir(IMAGE_DIR))

      print 'Found image file: ' + file
      punct  = re.compile(r'( ?\(.*?\) ?)|([^A-Za-z0-9 ])|png$')
      spaces = re.compile(r'  ')

      name = re.sub(punct, '', file)
      name = re.sub(spaces, ' ', name)
      print 'Regexed name: ' + name

      images.append({'name': name, 'file': file, 'img': gd.image(IMAGE_DIR + file)})

   return images


def main():
   """Initial entry point"""

   images = get_images()

   build_jumble(images)

   build_animated_frames(images)

   # subprocess.call(PWD + 'make_animated_gif.shl')


if __name__ == '__main__':
   sys.exit(main())

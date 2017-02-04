#!/usr/bin/env node

'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const appenv = require('./appenv');
const mp3store = require('./mp3store');

const app = express();

const MUSIC_MOUNT = '/music';

app.use(morgan('combined'));
app.use(cors());
app.use(MUSIC_MOUNT, express.static(appenv.music_root));
app.use('/', express.static(__dirname + '/www'));

function encodePath(path) {
  let parts = path.split(/[\\/]/);
  for (let i = 0; i < parts.length; i++) {
    parts[i] = encodeURIComponent(parts[i]);
  }
  return parts.join('/');
}

function urlPathFromFile(filepath) {
  return encodePath(filepath.startsWith(appenv.music_root) ? (MUSIC_MOUNT + filepath.substr(appenv.music_root.length, filepath.length)) : filepath);
}

// enable CORS pre-flight requests on all routes
app.options('*', cors());

app.get('/api/artists', (req, res) => {
  mp3store.getArtists((err, artists) => {
    if (err) {
      console.error(err);
      res.status(500);
      res.send(err);
    } else {
      artists.sort((a1, a2) => {
        let u1 = a1.toUpperCase();
        let u2 = a2.toUpperCase();
        if (u1 < u2) {
          return -1;
        }
        return (u1 > u2) ? 1 : 0;
      });
      res.send(artists);
    }
  });
});

app.get('/api/artists/:artist/albums', (req, res) => {
  mp3store.getArtistAlbums(req.params.artist, (err, albums) => {
    if (err) {
      console.error(err);
      res.status(500);
      res.send(err);
    } else {
      res.send(albums);
    }
  });
});

app.get('/api/artists/:artist/albums/:album/tracks', (req, res) => {
  mp3store.getAlbumTracks(req.params.artist, req.params.album, (err, tracks) => {
    if (err) {
      console.error(err);
      res.status(500);
      res.send(err);
    } else {
      tracks.sort((t1, t2) => {
        return t1.trackNumber - t2.trackNumber;
      });
      let trackNames = tracks.map((track) => {
        return track.track;
      });
      res.send(trackNames);
    }
  });
});

app.get('/api/artists/:artist/albums/:album/tracks/:track/details', (req, res) => {
  mp3store.getTrackDetails(req.params.artist, req.params.album, req.params.track, (err, details) => {
    if (err) {
      console.error(err);
      res.status(500);
      res.send(err);
    } else {
      details.path = urlPathFromFile(details.path);
      res.send(details);
    }
  });
});

app.listen(appenv.port, (err) => {
  if (err) {
    console.error('Error ' + err + ' trying to listen on port ' + appenv.port);
  } else {
    console.info('Listening on port ' + appenv.port);
  }
});

#!/usr/bin/env node

'use strict';

const MUSIC_ROOT = '/Users/snichol/music';

const express = require('express');
const morgan = require('morgan');
const mp3store = require('./mp3store');

const app = express();

app.use(morgan('combined'));
app.use('/music', express.static(MUSIC_ROOT));
app.use('/', express.static(__dirname + '/www'));

app.get('/api/artists', (req, res) => {
  mp3store.getArtists((err, artists) => {
    if (err) {
      res.status(500);
      res.send(err);
    } else {
      res.send(artists);
    }
  });
});

app.get('/api/artists/:artist/albums', (req, res) => {
  mp3store.getArtistAlbums(req.params.artist, (err, albums) => {
    if (err) {
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
      res.status(500);
      res.send(err);
    } else {
      details.path = details.path.startsWith(MUSIC_ROOT) ? details.path.substr(MUSIC_ROOT.length, details.path.length) : details.path;
      res.send(details);
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, (err) => {
  if (err) {
    console.error('Error ' + err + ' trying to listen on port ' + port);
  } else {
    console.info('Listening on port ' + port);
  }
});

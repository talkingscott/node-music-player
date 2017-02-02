#!/usr/bin/env node

'use strict';

const express = require('express');
const morgan = require('morgan');
const appenv = require('./appenv');
const mp3store = require('./mp3store');

const app = express();

app.use(morgan('combined'));
app.use('/music', express.static(appenv.music_root));
app.use('/', express.static(__dirname + '/www'));

app.get('/api/artists', (req, res) => {
  mp3store.getArtists((err, artists) => {
    if (err) {
      console.error(err);
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
      details.path = details.path.startsWith(appenv.music_root) ? details.path.substr(appenv.music_root.length, details.path.length) : details.path;
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

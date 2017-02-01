#!/usr/bin/env node

'use strict';

const express = require('express');
const morgan = require('morgan');
const db = require('./db');
const musicdata = require('./musicdata');

const app = express();

app.use(morgan('combined'));
app.use('/music', express.static('C:\\media2\\music'));
app.use('/', express.static(__dirname + '/www'));

db.put('foo1', 'bar1');
db.put('foo2', 'bar2');

db.get('foo1', (err, value) => {
  if (err) {
    console.error('Error ' + err + ' getting foo1');
  } else {
    console.log('Have foo1 ' + value);
  }
});

app.get('/api/artists', (req, res) => {
  res.send(musicdata.artists);
});

app.get('/api/artists/:artist/albums', (req, res) => {
  res.send(musicdata.artistAlbums[req.params.artist]);
});

app.get('/api/artists/:artist/albums/:album/tracks', (req, res) => {
  res.send(musicdata.albumTracks[req.params.artist + '/' + req.params.album]);
});

app.get('/api/artists/:artist/albums/:album/tracks/:track/details', (req, res) => {
  res.send(musicdata.trackDetails[req.params.artist + '/' + req.params.album + '/' + req.params.track]);
});

const port = process.env.PORT || 3000;
app.listen(port, (err) => {
  if (err) {
    console.error('Error ' + err + ' trying to listen on port ' + port);
  } else {
    console.info('Listening on port ' + port);
  }
});

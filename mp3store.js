/**
 * @module mp3store
 */
'use strict';

const db = require('./db');

const ARTISTS_KEY = 'ARTISTS';

function getArtists(callback) {
  db.get(ARTISTS_KEY, (err, value) => {
    if (err) {
      callback(err, null);
    } else {
      let artists = JSON.parse(value);
      callback(null, artists);
    }
  });
}

function getArtistAlbums(artist, callback) {
  db.get(artist, (err, value) => {
    if (err) {
      callback(err, null);
    } else {
      let albums = JSON.parse(value);
      callback(null, albums);
    }
  });
}

function getAlbumTracks(artist, album, callback) {
  let key = artist + '/' + album;
  db.get(key, (err, value) => {
    if (err) {
      callback(err, null);
    } else {
      let tracks = JSON.parse(value);
      callback(null, tracks);
    }
  });
}

function getTrackDetails(artist, album, track, callback) {
  let key = artist + '/' + album + '/' + track;
  db.get(key, (err, value) => {
    if (err) {
      callback(err, null);
    } else {
      let details = JSON.parse(value);
      callback(null, details);
    }
  });
}

function putArtists(artists, callback) {
  let value = JSON.stringify(artists);
  db.put(ARTISTS_KEY, value, callback);
}

function putArtistAlbums(artist, albums, callback) {
  let value = JSON.stringify(albums);
  db.put(artist, value, callback);
}

function putAlbumTracks(artist, album, tracks, callback) {
  let key = artist + '/' + album;
  let value = JSON.stringify(tracks);
  db.put(key, value, callback);
}

function putTrackDetails(artist, album, track, details, callback) {
  let key = artist + '/' + album + '/' + track;
  let value = JSON.stringify(details);
  db.put(key, value, callback);
}

module.exports.getArtists = getArtists;
module.exports.getArtistAlbums = getArtistAlbums;
module.exports.getAlbumTracks = getAlbumTracks;
module.exports.getTrackDetails = getTrackDetails;
module.exports.putArtists = putArtists;
module.exports.putArtistAlbums = putArtistAlbums;
module.exports.putAlbumTracks = putAlbumTracks;
module.exports.putTrackDetails = putTrackDetails;

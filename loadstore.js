'use strict';

const os = require('os');
const pth = require('path');
const util = require('util');

const mp3file = require('./mp3file');
const mp3store = require('./mp3store');

function aggregateAndStoreInfo(infos, callback) {

  // aggregate
  let artistsSet = new Set();
  let artistAlbumsMap = new Map();
  let albumTracksMap = new Map();
  let trackDetailsMap = new Map();
  infos.forEach((info) => {
    let artist = info.getAlbumPerformer();
    let album = info.getAlbumTitle();
    let track = info.getTrackTitle();
    let trackNumber = info.getTrackNumber();

    artistsSet.add(artist);

    if (!artistAlbumsMap.has(artist)) {
      artistAlbumsMap.set(artist, new Set());
    }
    artistAlbumsMap.get(artist).add(album);

    let albumKey = JSON.stringify({ artist: artist, album: album });
    if (!albumTracksMap.has(albumKey)) {
      albumTracksMap.set(albumKey, []);
    }
    albumTracksMap.get(albumKey).push({ track: track, trackNumber: trackNumber });
    
    let trackKey = JSON.stringify({ artist: artist, album: album, track: track });
    trackDetailsMap.set(trackKey, {path: info.path});
  });

  let artists = Array.from(artistsSet);

  // store
  let artistCount = 0;
  mp3store.putArtists(artists, (err) => {
    if (err) {
      callback(err);
    } else {
      mp3store.getArtists((err, value) => {
        if (err) {
          callback(err);
        } else {
          value.forEach((artist) => {
//            console.log(artist);
          });
        }
      });
    }
    ++artistCount;
//    console.log('artistCount: ' + artistCount + ' artistAlbumCount: '  + artistAlbumCount + ' artistAlbumsMap: ' + artistAlbumsMap.size + ' albumTrackCount: ' + albumTrackCount + ' albumTracksMap: ' + albumTracksMap.size + ' trackDetailCount: ' + trackDetailCount + ' trackDetailMap: ' + trackDetailsMap.size);
    if (artistCount == 1 && artistAlbumCount == artistAlbumsMap.size && albumTrackCount == albumTracksMap.size && trackDetailCount == trackDetailsMap.size) {
      callback(null);
    }
  });

  let artistAlbumCount = 0;
  artistAlbumsMap.forEach((value, key) => {
    let albums = Array.from(value);
    mp3store.putArtistAlbums(key, albums, (err) => {
      if (err) {
        callback(err);
      } else {
        mp3store.getArtistAlbums(key, (err, value) => {
          if (err) {
            callback(err);
          } else {
//            console.log(key + ': ' + value);
          }
        });
      }
      ++artistAlbumCount;
//      console.log('artistCount: ' + artistCount + ' artistAlbumCount: '  + artistAlbumCount + ' artistAlbumsMap: ' + artistAlbumsMap.size + ' albumTrackCount: ' + albumTrackCount + ' albumTracksMap: ' + albumTracksMap.size + ' trackDetailCount: ' + trackDetailCount + ' trackDetailMap: ' + trackDetailsMap.size);
      if (artistCount == 1 && artistAlbumCount == artistAlbumsMap.size && albumTrackCount == albumTracksMap.size && trackDetailCount == trackDetailsMap.size) {
        callback(null);
      }
    });
  });

  let albumTrackCount = 0;
  albumTracksMap.forEach((value, key) => {
    let artistAlbum = JSON.parse(key);
    mp3store.putAlbumTracks(artistAlbum.artist, artistAlbum.album, value, (err) => {
      if (err) {
        callback(err);
      } else {
        mp3store.getAlbumTracks(artistAlbum.artist, artistAlbum.album, (err, value) => {
          if (err) {
            callback(err);
          } else {
//            console.log(key + ': ' + util.inspect(value));
          }
        });
      }
      ++albumTrackCount;
//      console.log('artistCount: ' + artistCount + ' artistAlbumCount: '  + artistAlbumCount + ' artistAlbumsMap: ' + artistAlbumsMap.size + ' albumTrackCount: ' + albumTrackCount + ' albumTracksMap: ' + albumTracksMap.size + ' trackDetailCount: ' + trackDetailCount + ' trackDetailMap: ' + trackDetailsMap.size);
      if (artistCount == 1 && artistAlbumCount == artistAlbumsMap.size && albumTrackCount == albumTracksMap.size && trackDetailCount == trackDetailsMap.size) {
        callback(null);
      }
    });
  });

  let trackDetailCount = 0;
  trackDetailsMap.forEach((value, key) => {
    let artistAlbumTrack = JSON.parse(key);
    mp3store.putTrackDetails(artistAlbumTrack.artist, artistAlbumTrack.album, artistAlbumTrack.track, value, (err) => {
      if (err) {
        callback(err);
      } else {
        mp3store.getTrackDetails(artistAlbumTrack.artist, artistAlbumTrack.album, artistAlbumTrack.track, (err, value) => {
          if (err) {
            callback(err);
          } else {
//            console.log(key + ': ' + util.inspect(value));
          }
        });
      }
      ++trackDetailCount;
//      console.log('artistCount: ' + artistCount + ' artistAlbumCount: '  + artistAlbumCount + ' artistAlbumsMap: ' + artistAlbumsMap.size + ' albumTrackCount: ' + albumTrackCount + ' albumTracksMap: ' + albumTracksMap.size + ' trackDetailCount: ' + trackDetailCount + ' trackDetailMap: ' + trackDetailsMap.size);
      if (artistCount == 1 && artistAlbumCount == artistAlbumsMap.size && albumTrackCount == albumTracksMap.size && trackDetailCount == trackDetailsMap.size) {
        callback(null);
      }
    });
  });

}

mp3file.collect(pth.join(os.homedir(), 'music'), (err, infos) => {
  if (err) {
    console.error(err);
  } else {
    infos.forEach((info) => {
      let s = info.path + '\n' + util.inspect(info.id3tag.header);
      info.id3tag.frames.forEach((frame) => {
        s += '\n' + util.inspect(frame);
      });
      console.log(s);
    });

    aggregateAndStoreInfo(infos, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Done');
      }
    });
  }
});

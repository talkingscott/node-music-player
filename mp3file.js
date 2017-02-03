/**
 * @module mp3file
 */
'use strict';

const dir = require('node-dir');
const vasync = require('vasync');

const appenv = require('./appenv');
const id3 = require('./id3');

/**
 * Provides access to information about an MP3 file.
 */
class MP3FileInfo {
  /**
   * ctor that fully initializes the instance.
   * @param {String} path The file path.
   * @param {id3/ID3Tag} id3tag The (parsed) ID3 tag from the file.
   */
  constructor(path, id3tag) {
    this.path = path;
    this.id3tag = id3tag;
    this.frameContent = {};
    this.id3tag.frames.forEach((frame) => {
      this.frameContent[frame.header.id] = frame.content;
    });
  }

  /**
   * Gets the album title or 'N/A'.
   */
  getAlbumTitle() {
    let content = this.frameContent['TALB'];
    return content ? content : 'N/A';
  }

  /**
   * Gets the track title or 'N/A'.
   */
  getTrackTitle() {
    let content = this.frameContent['TIT2'];
    return content ? content : 'N/A';
  }

  /**
   * Gets the track performer or 'N/A'.
   */
  getTrackPerformer() {
    let content = this.frameContent['TPE1'];
    return content ? content : 'N/A';
  }

  /**
   * Gets the album performer or 'N/A'.  If the TPE2
   * frame is not present, returns the track performer.
   */
  getAlbumPerformer() {
    let content = this.frameContent['TPE2'];
    return content ? content : this.getTrackPerformer();
  }

  /**
   * Gets the track number or 0.
   */
  getTrackNumber() {
    let content = this.frameContent['TRCK'];
    return content ? parseInt(content.split('/')[0]) : 0;
  }
}

/**
 * Gets the file info for an MP3 file.
 *
 * @param {String} path The MP3 file path.
 * @param {Function} callback Receives the result, (err, mp3FileInfo)
 */
function getMP3FileInfo(path, callback) {
  id3.read(path, (err, tag) => {
    if (err) {
      callback('Getting info for ' + path + ': ' + err, null);
    } else {
      callback(null, new MP3FileInfo(path, tag));
    }
  });
}

/**
 * Collects file info for all MP3 files in an array.
 * 
 * @param {Array} mp3files The file paths for which to get info.
 * @param {Function} callback Receives the results, (err, mp3FileInfos)
 */
function getMP3FileInfos(mp3files, callback) {
  let errors = [];
  let fileInfos = [];

  let q = vasync.queue((file, callback) => {
    getMP3FileInfo(file, (err, info) => {
      console.log('Processed ' + file);
      if (err) {
        errors.push(err);
        console.error(err);
        callback(err);
      } else {
        fileInfos.push(info);
        callback();
      }
    });
  }, appenv.load_concurrency);
  
  q.on('end', () => {
    // TODO: if errors is not empty, callback with it
    callback(null, fileInfos);
  });
  
  q.push(mp3files, (err) => {
    if (err) {
      console.error(err);
    }
  });
  
  q.close();
}

/**
 * Collects file info for all MP3 files in a directory tree.
 * 
 * @param {String} root The root directory from which to traverse.
 * @param {Function} callback Receives the results, (err, mp3FileInfos)
 */
function collectMP3FileInfo(root, callback) {
  console.log('Get list of files under ' + root);
  dir.files(root, (err, files) => {
    if (err) {
      callback('Getting files under ' + root + ': ' + err, null);
    } else {
      console.log('Got list of files');
      let mp3files = [];
      files.forEach((file) => {
        if (file.endsWith('.mp3')) {
          mp3files.push(file);
        }
      });
      getMP3FileInfos(mp3files, callback);
    }
  });
}

module.exports.collect = collectMP3FileInfo;
module.exports.get = getMP3FileInfos;

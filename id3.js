/**
 * @module id3
 */
'use strict';

const fs = require('fs');

const FRAME_HEADER_SIZE = 10;

function removeBOM(s) {
  return (s.charAt(0) == '\ufeff') ? s.substr(1, s.length) : s;
}

function parseComment(buffer) {
  let encoding = buffer[0];
  let language = buffer.toString('ascii', 1, 4);
  let comment = null;
  if (encoding == 1) {
    comment = removeBOM(buffer.toString('utf16le', 4, buffer.length));
  } else {
    comment = buffer.toString('ascii', 4, buffer.length);
  }
  let parts = comment.split('\u0000', 2);
  return { language: language, shortDesc: parts[0], fullText: parts[1] };
}

function parseAsciiC(buffer, offset) {
  let i = offset;
  while (buffer[i] != 0) {
    i++;
  }
  return buffer.toString('ascii', offset, i);
}

function parseUnicodeC(buffer, offset) {
  let i = offset;
  while (buffer.readUInt16LE(i) != 0) {
    i += 2;
  }
  return removeBOM(buffer.toString('utf16le', offset, i));
}

function parseGeneralEncapsulatedObject(buffer) {
  let encoding = buffer[0];
  let mimeType = parseAsciiC(buffer, 1);
  let offset = 1 + mimeType.length + 1;

  let filename = null;
  if (encoding == 1) {
    filename = parseUnicodeC(buffer, offset);
    offset += (filename.length + 1) * 2;
  } else {
    filename = parseAsciiC(buffer, offset);
    offset += filename.length + 1;
  }

  let description = null;
  if (encoding == 1) {
    description = parseUnicodeC(buffer, offset);
    offset += (description.length + 1) * 2;
  } else {
    description = parseAsciiC(buffer, offset);
    offset += description.length + 1;
  }

  return { mimeType: mimeType, filename: filename, description: description, encapsulatedObject:  buffer.slice(offset, buffer.length) };
}

function parsePrivate(buffer) {
  let owner = parseAsciiC(buffer, 0);
  let offset = owner.length + 1;
  return { owner: owner, priv: buffer.slice(offset, buffer.length) };
}

function parseTextInformation(buffer) {
  let encoding = buffer[0];
  if (encoding == 1) {
    return removeBOM(buffer.toString('utf16le', 1, buffer.length));
  } else {
    return buffer.toString('ascii', 1, buffer.length);
  }
}

/**
 * Parses the content of a frame that's been read.
 *
 * @param {ID3FrameHeader} frameHeader The header for the frame.
 * @param {Buffer} buffer The raw frame content.
 * @return {Any} The parsed content, either string or Object.
 */
function parseFrameContent(frameHeader, buffer) {
  if (frameHeader.id == 'TIT2'    // Track title
      || frameHeader.id == 'TPE1' // Track performer (Lead performer(s)/soloist)
      || frameHeader.id == 'TALB' // Album title
      || frameHeader.id == 'TCON' // Content type (possibly Genre)
      || frameHeader.id == 'TCOM' // Composer
      || frameHeader.id == 'TPE3' // Individual track performers (Composer/performer refinement)
      || frameHeader.id == 'TRCK' // Track number (possibly also /total tracks)
      || frameHeader.id == 'TYER' // Year
      || frameHeader.id == 'TPE2' // Album performer (Band performer/accompaniment)
      || frameHeader.id == 'TCOP' // Copyright
      || frameHeader.id == 'TPOS' // Part of a set (e.g. 1/1)
      || frameHeader.id == 'TPE4' // Interpreted, remixed or otherwise modified by
      || frameHeader.id == 'TPUB' // Publisher
      ) {
    return parseTextInformation(buffer);
  } else if (frameHeader.id == 'COMM') {  // Comment
    return parseComment(buffer);
  } else if (frameHeader.id == 'GEOB') {  // General encapsulated object
    return parseGeneralEncapsulatedObject(buffer);
  } else if (frameHeader.id == 'PRIV') {  // Private
    return parsePrivate(buffer);
  } else {
    return buffer;
  }
}

/**
 * Reads a frame from a open file at its current file position.
 *
 * @param {fileDescriptor} fd The file descriptor.
 * @param {Function} callback Receives the result, (err, frame, bytesRead)
 */
function readFrame(fd, callback) {
  let buf = new Buffer(FRAME_HEADER_SIZE);
  fs.read(fd, buf, 0, FRAME_HEADER_SIZE, null, (err, bytesRead, buffer) => {
    if (err) {
      callback('Reading frame header: ' + err, null, null);
    } else if (bytesRead != FRAME_HEADER_SIZE) {
      callback('Only read ' + bytesRead + ' for frame header', null, null);
    } else {
      let pos = bytesRead;
      // ID3FrameHeader pseudo-class
      let frameHeader = {
        id: buffer.toString('ascii', 0, 4),
        size: buffer.readUInt32BE(4),
        flags: buffer.readUInt16BE(8)
      };
      if (frameHeader.size == 0) {
        let frame = {
          header: frameHeader,
          content: null
        };
        callback(null, frame, pos);
      } else {
        let buf = new Buffer(frameHeader.size);
        fs.read(fd, buf, 0, frameHeader.size, null, (err, bytesRead, buffer) => {
          if (err) {
            callback('Reading frame content: ' + err, null);
          } else if (bytesRead != frameHeader.size) {
            callback('Only read ' + bytesRead + ' for frame content', null);
          } else {
            let frame = {
              header: frameHeader,
              content: parseFrameContent(frameHeader, buffer)
            };
            callback(null, frame, pos + bytesRead);
          }
        });
      }
    }
  });
}

/**
 * Recursively reads frames from an open file, accumulating an
 * array of frames.  The callback is called when the final frame
 * has been read.
 *
 * @param {fileDescriptor} fd The file descriptor.
 * @param {Number} bytesRead The number of bytes already read from the file.
 * @param {Number} tagSize The size of the ID3 tag, in bytes, including the ID3 header.
 * @param {Array} frames The list of frames being accumulated.
 * @param {Function} callback Receives the result after all frames are accumulated, (err, frames).
 */
function readFramesRecursive(fd, bytesRead, tagSize, frames, callback) {
  if (bytesRead >= tagSize) {
    //console.log('@' + bytesRead);
    callback(null, frames);
  } else {
    //console.log('@' + bytesRead);
    let pos = bytesRead;
    readFrame(fd, (err, frame, bytesRead) => {
      if (err) {
        callback(err, null);
      } else {
        frames.push(frame);
        if (frame.content == null) {
          callback(null, frames);
        } else {
          readFramesRecursive(fd, pos + bytesRead, tagSize, frames, callback);
        }
      }
    });
  }
}

/**
 * Reads all the frames from an open file already positioned at the first frame.
 *
 * @param {fileDescriptor} fd The file descriptor.
 * @param {Number} bytesRead The number of bytes already read from the file.
 * @param {Number} tagSize The size of the ID3 tag, in bytes, including the header.
 * @param {Function} callback Receives the result, (err, frames).
 */
function readFrames(fd, bytesRead, tagSize, callback) {
  readFramesRecursive(fd, bytesRead, tagSize, [], (err, frames) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, frames);
    }
  });
}

/**
 * Reads the ID3 tag extended header from an open file.
 *
 * @param {fileDescriptor} fd The file descriptor.
 * @param {Function} callback Receives the result, (err, id3TagExtendedHeader, bytesRead)
 */
function readExtendedHeader(fd, callback) {
  let buf = new Buffer(10);
  fs.read(fd, buf, 0, 4, null, (err, bytesRead, buffer) => {
    if (err) {
      callback(err, null, null);
    } else if (bytesRead != 4) {
      callback('Only read ' + bytesRead, null, null);
    } else {
      let len = buffer.readInt32BE(0);
      if (len != 6 && len != 10) {
        callback('Unexpected extended header length ' + len, null, null);
      } else {
        let pos = bytesRead;
        fs.read(fd, buf, 0, len, null, (err, bytesRead, buffer) => {
          if (err) {
            callback(err, null, null);
          } else if (bytesRead != len) {
            callback('Only read ' + bytesRead, null, null);
          } else {
            pos += bytesRead;
            // ID3TagExtendedHeader pseudo-class
            let extendedHeader = {
              size: len,
              flags: buffer.readUInt16BE(0),
              padsize: buffer.readUInt32BE(2)
            };
            callback(null, extendedHeader, pos);
          }
        });
      }
    }
  });
}

/**
 * Reads the ID3 tag header, and extended header if present,
 * from an open file descriptor.
 *
 * @param {fileDescriptor} fd The file descriptor.
 * @param {Function} callback Receives the result, (err, id3TagHeader, bytesRead)
 */
function readHeader(fd, callback) {
  let buf = new Buffer(FRAME_HEADER_SIZE);
  fs.read(fd, buf, 0, FRAME_HEADER_SIZE, null, (err, bytesRead, buffer) => {
    if (err) {
      callback(err, null);
    } else if (bytesRead != FRAME_HEADER_SIZE) {
      callback('Only read ' + bytesRead, null);
    } else {
      // ID3TagHeader pseudo-class
      let header = {
        id: buffer.toString('ascii', 0, 3),
        major: buffer[3],
        revision: buffer[4],
        flags: buffer[5],
        size: buffer[6] * (2 << 21) + buffer[7] * (2 << 14) + buffer[8] * (2 << 7) + buffer[9],
        extended: {}
      };
      let pos = bytesRead;
      if (header.flags & 0x40 != 0) {
        readExtendedHeader(fd, (err, extendedHeader, bytesRead) => {
          if (err) {
            callback(err, null, null);
          } else {
            pos += bytesRead;
            header.extended = extendedHeader;
            callback(null, header, pos);
          }
        });
      } else {
        callback(null, header, pos);
      }
    }
  });
}

/**
 * Reads the ID3 tag from an open file.
 *
 * @param {fileDescriptor} fd The file descriptor.
 * @param {Function} callback Receives the results, (err, id3tag)
 */
function readID3Tag(fd, callback) {
  readHeader(fd, (err, header, bytesRead) => {
    if (err) {
      callback(err, null);
    } else {
      readFrames(fd, bytesRead, FRAME_HEADER_SIZE + header.size, (err, frames) => {
        if (err) {
          callback('Reading frames: ' + err);
        } else {
          // ID3Tag pseudo-class
          let tag = {header: header, frames: frames};
          callback(null, tag);
        }
      });
    }
  });
}

/**
 * Reads the ID3 tag from a file.
 *
 * @param {String} path The file path.
 * @param {Function} callback Receives the result, (err, id3Tag)
 */
function read(path, callback) {
  fs.open(path, 'r', (err, fd) => {
    if (err) {
      callback('Error opening ' + path + ': ' + err, null);
    } else {
      readID3Tag(fd, (err, tag) => {
        if (err) {
          callback('Error reading ID3 tag from ' + path + ': ' + err, null);
        } else {
          callback(null, tag);
        }
        fs.close(fd);
      });
    }
  });
}

module.exports.read = read;

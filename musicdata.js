'use strict';

const artists = ['Adrian Belew', 'Baba Lou', 'Bachman-Turner Overdrive', 'Banarama']
const artistAlbums = {
  'Adrian Belew': ['Lone Rhino'],
  'Baba Lou': ['Baba Lou at Bob\'s'],
  'Bachman-Turner Overdrive': ['Bachman-Turner Overdrive II'],
  'Bananarama': ['Deep Sea Skiving']
};
const albumTracks = {
  'Adrian Belew/Lone Rhino': ['Big Electric Cat', 'The Momur']
};
const trackDetails = {
  'Adrian Belew/Lone Rhino/Big Electric Cat': {path: 'mp3wave/Adrian Belew/Lone Rhino/01 - Big Electric Cat.mp3'},
  'Adrian Belew/Lone Rhino/The Momur': {path: 'mp3wave/Adrian Belew/Lone Rhino/02 - The Momur.mp3'}
};

module.exports = {artists: artists, artistAlbums: artistAlbums, albumTracks: albumTracks, trackDetails: trackDetails};

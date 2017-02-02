/**
 * @module appenv
 */
'use strict';

const os = require('os');
const pth = require('path');

exports.music_root = process.env.MUSIC_ROOT || pth.join(os.homedir(), 'music');

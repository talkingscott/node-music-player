/**
 * @module appenv
 */
' use strict';

const os = require('os');
const path = require('path');

exports.music_root = process.env.MUSIC_ROOT || path.join(os.homedir(), 'music');
exports.load_concurrency = process.env.LOAD_CONCURRENCY || 32;
exports.port = process.env.PORT || 3000;
exports.db_path = process.env.DB_PATH || path.join(__dirname, 'db');

/**
 * @module db
 */
'use strict';

const level = require('level');
const path = require('path');

const appenv = require('./appenv');

const db = level(appenv.db_path);

module.exports = db;  

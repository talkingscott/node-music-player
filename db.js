/**
 * @module db
 */
'use strict';

const level = require('level');  
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'db');  
const db = level(dbPath);

module.exports = db;  

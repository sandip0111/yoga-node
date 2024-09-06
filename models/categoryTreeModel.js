const mongoose = require('mongoose');

const { Schema, Types, model } = mongoose;

let categoryTree = {};

var bcategorytreeeSchema = Schema({}, { strict: false, collection: 'bcategorytreee' });

categoryTree = model('bcategorytreee', bcategorytreeeSchema);

module.exports= categoryTree;

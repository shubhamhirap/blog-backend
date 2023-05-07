const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const UserSchema = new Schema({
    name : {type: String, required: true },
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true, unique: true}
})

const UserModel = model('user-infos', UserSchema);

module.exports = UserModel;
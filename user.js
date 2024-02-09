const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');


const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
})


//the plugin is a method
//and this inherently provides both a unique username and password
//heres what the docs say:You're free to define your User how you like. 
//Passport-Local Mongoose will add a username, hash and salt field to store the username, the hashed password and the salt value.
//https://www.npmjs.com/package/passport-local-mongoose
//installed all three- passport, passport-local and the other one: all for authenticaiont
userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', userSchema);
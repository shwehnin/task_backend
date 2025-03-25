const { Schema, model } = require("mongoose");

const userSchema = Schema({
    name: {type: String, required: true, trim: true}, 
    email: {type: String, required: true, unique: true, trim: true, validate: {
        validator:(value) => {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return value.match(re);
        },
        message: "Please enter a valid email address"
    }},
    passwordHash: {type: String, required: true},
    phone: {type: String, trim: true},
    resetPasswordOtp: Number,
    resetPasswordOtpExpires: Date,
});

exports.User = model('User', userSchema);
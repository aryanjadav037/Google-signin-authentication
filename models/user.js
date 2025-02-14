const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    googleId: String,
    name: String,
    email: String,
    picture: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);

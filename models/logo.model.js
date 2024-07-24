const mongoose = require("mongoose");

const LogoSchema = mongoose.Schema({
    title: {
        type: String,
    },
    image:{
        type: String,
    }
}, {timestamps: true});


module.exports = mongoose.model("logos", LogoSchema);

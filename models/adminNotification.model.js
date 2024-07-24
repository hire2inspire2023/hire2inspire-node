const mongoose = require("mongoose");

const adminNotificationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'admins'
    },
    title: {
        type: String,
       // required: true
    },
    description: {
        type: String,
       // required: true
    },
    type:{
        type:String
    },
    // agency:{
    //     type: mongoose.Schema.Types.ObjectId, 
    //     ref: 'agencies'
    // },
    seen:{
        type: Boolean,
        default: false
    },
    cleared: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});



module.exports = mongoose.model("adminnotifications", adminNotificationSchema);

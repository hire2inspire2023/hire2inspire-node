const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const agencyTransactionSchema = mongoose.Schema({
    // billing_id:{
    //     type:ObjectId,
    //     ref: 'billings',
    // },
    // hiring_id:{
    //     type:ObjectId,
    //     ref: 'hiringDetails',
    // },
    // candidate:{
    //     type:ObjectId,
    //     ref: 'candidates',
    // },
    // desg:{
    //     type:String
    // },
    // agency:{
    //     type:ObjectId,
    //     ref: 'agencies',
    // },

    agency:{
        type:ObjectId,
        ref: 'agencies',
    },
    passbook_amt:[{
        transaction_id:{
            type:String
        },
        amount:{
            type:Number
        },
        split_amount:{
            agency_amount:{
                type:Number
            },
            h2i_amount:{
                type:Number
            },
        },
        type:{
            type:String,
            enum:{
                values:["payble","paid"],
                message:'please select between -credit/debit'
            }
        },
        candidate:{
            type:ObjectId,
            ref: 'candidates',
        },
        desg:{
            type:String
        },
        employer:{
            type:ObjectId,
            ref: 'employers',
        },
        invoice_file:{
            type:String
        },
        billing_id:{
            type:ObjectId,
            ref: 'billings',
        },
        invoice_No:{
            type:String
        },
        description:{
            type:String
        },
        gst_in:{
            type:String
        },
        hsn_code:{
            type:String
        },
        gst_type:{
            type:String
        },
        cgst:{
            type:String
        },
        igst:{
            type:String
        },
        sgst:{
            type:String
        },
        gst_cal_amount:{
            type:Number
        },
        cgst_cal_amount:{
            type:Number
        },
        sgst_cal_amount:{
            type:Number
        },
        is_active:{
            type:Boolean,
            default:true
        },
   }],
   proforma_passbook_amt:[{
    transaction_id:{
        type:String
    },
    amount:{
        type:Number
    },
    split_amount:{
        agency_amount:{
            type:Number
        },
        h2i_amount:{
            type:Number
        },
    },
    type:{
        type:String,
        enum:{
            values:["payble","paid"],
            message:'please select between -credit/debit'
        }
    },
    candidate:{
        type:ObjectId,
        ref: 'candidates',
    },
    desg:{
        type:String
    },
    employer:{
        type:ObjectId,
        ref: 'employers',
    },
    invoice_file:{
        type:String
    },
    billing_id:{
        type:ObjectId,
        ref: 'billings',
    },
    proforma_invoice_No:{
        type:String
    },
    description:{
        type:String
    },
    gst_in:{
        type:String
    },
    hsn_code:{
        type:String
    },
    gst_type:{
        type:String
    },
    cgst:{
        type:String
    },
    igst:{
        type:String
    },
    sgst:{
        type:String
    },
    gst_cal_amount:{
        type:Number
    },
    cgst_cal_amount:{
        type:Number
    },
    sgst_cal_amount:{
        type:Number
    },
    is_active:{
        type:Boolean,
        default:true
    },
}],
    total_amount:{
        type:Number
    },

}, {timestamps: true});



module.exports = mongoose.model("agencytransactions", agencyTransactionSchema);
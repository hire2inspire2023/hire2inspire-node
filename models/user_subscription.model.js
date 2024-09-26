const mongoose = require("mongoose");

const UserSubscriptionSchema = mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employers",
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "packages",
      required: true,
    },
    quantity: {
      type: Number,
    },
    total_amount: {
      type: Number,
    },
    city: {
      type: String,
    },
    state_code: {
      type: String,
    },
    invoice_No: {
      type: String,
    },
    gst_type: {
      type: String,
    },
    hsn_code: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
    subscription_invoice : {
      type : String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("user_subscription", UserSubscriptionSchema);

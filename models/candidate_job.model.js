const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const CandidateJobSchema = mongoose.Schema(
  {
    emp_job: {
      type: ObjectId,
      ref: "job_postings",
    },
    candidate: {
      type: ObjectId,
      ref: "candidates",
    },
    agency_id: {
      type: ObjectId,
      ref: "agencies",
      trim: true,
    },
    request: {
      type: String,
      enum: {
        values: [0, 1, 2, 3, 4, 5],
        message:
          "only 0:(pending)/1:(reviewing)/2:(interviewing)/3:(offer)/4:(rejected)/5:(noshow)/6:(schedule)/7:(scheduled)/8:(reschedule) allowed.",
        default: 0,
      },
    },
    screening_q_a: {
      type: Array,
    },
    personal_q_a: {
      type: Array,
    },
    review_apply: {
      type: Boolean,
      default: false,
    },
    start_application: {
      type: Boolean,
      default: false,
    },
    submit_app: {
      type: Boolean,
      default: false,
    },
    review: {
      communication_skill: {
        type: String,
      },
      position_knwdlg: {
        type: String,
      },
      proffesioalsm: {
        type: String,
      },
    },
    review_comment: {
      type: String,
    },
    final_submit: {
      type: Boolean,
      default: false,
    },
    is_screeing_qu_exist: {
      type: Boolean,
      default: false,
    },
    interview_det: {
      interview_date: {
        type: Date,
      },
      interview_start_time: {
        type: String,
      },
      interview_end_time: {
        type: String,
      },
      info: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("candidatejobs", CandidateJobSchema);

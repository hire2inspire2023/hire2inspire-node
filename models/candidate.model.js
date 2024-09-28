const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const bcrypt = require("bcrypt");
const { string } = require("joi");

const CandidateSchema = new Schema(
  {
    agency_job: {
      type: ObjectId,
      ref: "agency_jobs",
      trim: true,
    },
    agency: {
      type: ObjectId,
      ref: "agencies",
      trim: true,
    },
    // candidate_job:{
    //     type: ObjectId,
    //     ref: 'job_postings',
    // },
    recruiter: {
      type: ObjectId,
      ref: "recruiters",
      trim: true,
    },
    job: {
      type: ObjectId,
      ref: "job_postings",
      trim: true,
    },
    fname: {
      type: String,
      trim: true,
      required: true,
    },
    lname: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate(value) {
        const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z-.]+$/g;
        if (!pattern.test(value)) {
          s;
          throw new Error("Wrong email format.");
        }
      },
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      validate: {
        validator: function (v) {
          return /\d{10}/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    country: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    pin: {
      type: String,
      trim: true,
    },
    resume: {
      type: String,
      trim: true,
    },
    linkedin_url: {
      type: String,
      trim: true,
    },
    must_have_qualification_q_a: {
      type: Array,
    },
    communication_skill_rating: {
      type: Number,
    },
    position_knowledge_rating: {
      type: Number,
    },
    professionalism_rating: {
      type: Number,
    },
    /**
     * 0 = new
     * 1 = reviewing
     * 2 = interviewing
     * 3 = offer
     */
    status: {
      type: String,
      enum: {
        values: [0, 1, 2, 3, 4],
        message:
          "only 0:(pending)/1:(reviewing)/2:(interviewing)/3:(offer)/4:(rejected)/5:(noshow)/6:(schedule)/7:(scheduled)/8:(reschedule) allowed.",
      },
      default: 0,
    },
    screening_q_a: {
      type: Array,
    },
    personal_q_a: {
      type: Array,
    },
    current_CTC: {
      type: String,
    },
    expected_CTC: {
      type: String,
    },
    notice_period: {
      type: String,
    },
    negotiable_upto: {
      type: String,
    },
    total_experience: {
      type: String,
    },
    relevant_experience: {
      type: String,
    },
    is_hired: {
      type: Boolean,
      default: false,
    },
    final_submit: {
      type: Boolean,
      default: false,
    },
    reSubmit: {
      type: Boolean,
      default: false,
    },
    isUploadedFromexcel: {
      type: Boolean,
      default: false,
    },
    updated_by: {
      type: String,
      enum: {
        values: ["agency", "candidate"],
      },
      default: "candidate",
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

const Candidate = mongoose.model("candidates", CandidateSchema);
module.exports = Candidate;

const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const JobPostingSchema = mongoose.Schema(
  {
    employer: {
      type: ObjectId,
      ref: "employers",
      required: true,
    },
    job_id: {
      type: String,
    },
    comp_name: {
      type: String,
      required: true,
    },
    job_name: {
      type: String,
      trim: true,
      required: true,
    },
    job_description: {
      type: String,
      trim: true,
      required: true,
    },
    job_location: {
      type: Array,
      trim: true,
      required: true,
    },
    designation: {
      type: String,
      trim: true,
      required: true,
    },
    min_work_exp: {
      type: String,
      trim: true,
      // required: true,
    },
    max_work_exp: {
      type: String,
      trim: false,
      // required: true,
    },
    min_compensation: {
      type: String,
      trim: true,
      required: true,
    },
    max_compensation: {
      type: String,
      trim: true,
    },
    compensation_type: {
      type: String,
      enum: {
        values: ["inr", "lpa"],
        message: "only inr/lpa allowed",
      },
      default: "inr",
      required: true,
    },
    hide_compensation: {
      type: Boolean,
      default: false,
    },
    must_have_skills: {
      type: Array,
      trim: true,
      required: true,
    },
    good_to_have_skills: {
      type: Array,
      trim: false,
    },
    educational_qualification: {
      type: Array,
      trim: true,
      required: true,
    },
    industry: {
      type: Array,
      trim: true,
      required: true,
    },
    perk_and_benefits: {
      type: Array,
      trim: false,
    },
    salary_info: {
      type: String,
    },
    company_website_url: {
      type: String,
      trim: false,
      required: true,
    },
    corporate_website_url: {
      type: String,
      trim: false,
    },

    /**
     * 1 => Active
     * 2 => CLosed
     * 3 => Draft
     */
    status: {
      type: String,
      enum: {
        values: [1, 2, 3, 4],
        message: "only 1:(active)/2:(closed)/3:(draft)/4:(filled) allowed.",
      },

      default: 1,
      required: true,
    },
    is_approved: {
      type: Boolean,
      default: false,
    },
    interview_steps: {
      type: Array,
      required: true,
    },
    interview_date: {
      type: Date,
    },
    screeing_questions: {
      type: Array,
      //required: true
    },
    announcement: {
      type: String,
    },
    // budget: {
    //     type: Number
    // },
    diversity: {
      type: String,
    },
    hired_target_date: {
      type: Date,
    },
    expired_on: {
      type: Date,
    },
    is_hired: {
      type: Boolean,
      default: false,
    },
    no_of_opening: {
      type: Number,
    },
    hired_count: {
      type: Number,
    },
    interviewin_count: {
      type: Number,
    },
    reviewing_count: {
      type: Number,
    },
    offer_count: {
      type: Number,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    is_screeing_qu_exist: {
      type: Boolean,
      default: false,
    },
    is_decline: {
      type: Boolean,
      default: false,
    },
    is_urgent: {
      type: Boolean,
      default: false,
    },
    urgent_mesg: {
      type: String,
    },
    isFresher : {
      type: Boolean,
      default: false,
    },
    isJobReposted : {
      type: Boolean,
      default: false,
    },
    ref_job_id: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("job_postings", JobPostingSchema);

const mongoose = require("mongoose");
const { getUserViaToken, verifyAccessToken } = require("../helpers/jwt_helper");
const JobPosting = require("../models/job_posting.model");
const Employer = require("../models/employer.model");
const AgencyJobModel = require("../models/agency_job.model");
const RecruiterModel = require("../models/recruiter.model");
const Agency = require("../models/agency.model");
const Admin = require("../models/admin.model");
const UserCredit = require("../models/user_credit.model");
const Candidate = require("../models/candidate.model");
const CandidateJobModel = require("../models/candidate_job.model");
const HiringDetail = require("../models/hiringDetails.model");
// const Transaction = require('../models/transaction.model')
const sendNotification = require("../helpers/send_notification");
const AdminsendNotification = require("../helpers/adminSend_notification");
const nodemailer = require("nodemailer");
const UserSubscription = require("../models/user_subscription.model");
const DraftJob = require("../models/draft_job.model");
const sgMail = require("@sendgrid/mail");
const cron = require("node-cron");
const monent = require("moment-timezone");

// var transport = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: 465,
//     secure: true,
//     auth: {
//         user: process.env.EMAIL_NAME,
//         pass: process.env.EMAIL_PASSWORD
//     },
//     requireTLS: true,
// });

// cron.schedule(
//      "0 0 * * *",
//   async () => {
//     // Runs every day at midnight
//     try {
//       const now = new Date();
//       const expiredJobs = await JobPosting.find({
//         expired_on: { $lte: now },
//         status: "active", // Assuming 1 is the status for active jobs
//       });

//       if (expiredJobs.length > 0) {
//         console.log("hii");
//         for (const job of expiredJobs) {
//           job.status = "closed"; // Set to 'Closed'
//           await job.save();
//         }
//         console.log(`${expiredJobs.length} job(s) updated to 'Closed' status.`);
//       } else {
//         console.log("No expired jobs found.");
//       }
//     } catch (err) {
//       console.error("Error updating job statuses:", err);
//     }
//   },
//   {
//     scheduled: true,
//     timezone: "Asia/Kolkata", // Adjust timezone as needed
//   }
// );

// console.log("Cron job to update expired jobs is running.");

module.exports = {
  allList: async (req, res, next) => {
    try {
      const job_postings = await JobPosting.find({})
        .populate([
          {
            path: "employer",
            select: "fname lname email employer_image",
          },
        ])
        .sort({ _id: -1 });

      return res.status(200).send({
        error: false,
        message: "Job posting list",
        data: job_postings,
      });
    } catch (error) {
      next(error);
    }
  },

  agencyJobList: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      if (!checkAgency && dataModel != "agency")
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });

      let agencyJobs = await AgencyJobModel.find({ agency: userId });
      let agencyJobsJobIds = agencyJobs.map((e) => {
        return e.job;
      });
      const job_postings = await JobPosting.find({
        _id: { $nin: agencyJobsJobIds },
      })
        .populate([
          {
            path: "employer",
            select: "fname lname email employer_image",
          },
        ])
        .sort({ _id: -1 });

      return res.status(200).send({
        error: false,
        message: "Job posting list",
        data: job_postings,
      });
    } catch (error) {
      next(error);
    }
  },

  // agencyJobDetail: async (req, res, next) => {
  //     try {
  //         let token = req.headers['authorization']?.split(" ")[1];
  //         let {userId, dataModel} = await getUserViaToken(token)
  //         const checkAgency = await Agency.findOne({_id: userId})
  //         if(!checkAgency && dataModel != "agency") return res.status(401).send({ error: true, message: "User unauthorized." })

  //         let agencyJobs = await AgencyJobModel.find({agency: userId})
  //         let agencyJobsJobIds = agencyJobs.map(e => {
  //             return e.job
  //         })

  //         console.log("agencyJobs....",agencyJobs);
  //         const job_postings = await JobPosting.findOne({_id: {$nin: agencyJobsJobIds}}).populate([
  //             {
  //                 path: "employer",
  //                 select: "fname lname email employer_image"
  //             }
  //         ]).sort({_id: -1})

  //         return res.status(200).send({
  //             error: false,
  //             message: "Agency job detail list",
  //             data: job_postings
  //         })
  //     } catch (error) {
  //         next(error);
  //     }
  // },

  detail: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkEmployer = await Employer.findOne({ _id: userId });

      if (!checkEmployer && dataModel != "employers")
        return res
          .status(400)
          .send({ error: true, message: "Employer not authorized." });

      const job_posting_data = await JobPosting.findOne({
        _id: req.params.id,
      }).populate([
        {
          path: "employer",
          select: "fname lname email employer_image",
        },
      ]);

      const hiringDetail = await HiringDetail.find({ job: req.params.id })
        .populate([
          // {
          //     path: "job",
          //     select: "job_name"
          // },
          {
            path: "candidate",
            select: " ",
            populate: {
              path: "agency",
              select: "name corporate_email",
            },
          },
        ])
        .select("candidate");

      return res.status(200).send({
        error: false,
        message: "Job posting detail",
        data: job_posting_data,
        hiringDetail,
      });
    } catch (error) {
      next(error);
    }
  },

  listByEmployer: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkEmployer = await Employer.findOne({ _id: userId });

      if (!checkEmployer && dataModel != "employers")
        return res
          .status(400)
          .send({ error: true, message: "Employer not found." });

      const job_postings = await JobPosting.find({ employer: userId })
        .populate([
          {
            path: "employer",
            select: "fname lname email employer_image",
          },
        ])
        .sort({ createdAt: -1 });

      let jobIds = job_postings.map((e) => e._id.toString());
      let refId = job_postings.map((e) => {
        if (e?.ref_id) {
          e.ref_id.toString()
        }
        return e.ref_id
      });

      const CandidateJobData = await CandidateJobModel.find({
        $or: [
          {
            emp_job: { $in: jobIds },
          },
          { emp_job: { $in: refId } },
        ],
      }).populate([
        {
          path: "candidate",
          select: " ",
        },
        {
          path: "agency_id",
          select: " ",
        },
      ]).sort({ createdAt: -1 , updatedAt: -1 });

      const updatedCandidateJobData = await Promise.all(
        CandidateJobData.map(async (ele) => {
          // Convert the Mongoose document to a plain object so you can modify it
          let candidateJobObject = ele.toObject();
      
          if (candidateJobObject?.candidate?._id) {
            let candidateId = candidateJobObject.candidate._id;
            let hireDetails = await HiringDetail.findOne({
              candidate: candidateId,
              employer: userId,
            }).select("date_of_joining");
      
            // Attach the new field
            candidateJobObject.dateOfJoining = hireDetails?.date_of_joining || null;
          }
      
          // Return the modified object
          return candidateJobObject;
        })
      );


      // const CandidateData = await Candidate.find( {job: {$in: jobIds}}).populate([
      //     {
      //         path:"candidate",
      //         select:" "
      //     },
      //     {
      //         path:"agency_id",
      //         select:" "
      //     },
      //     {
      //         path:"job",
      //         select:" "
      //     }
      // ]);

      //  console.log({CandidateData})

      return res.status(200).send({
        error: false,
        message: "Job posting list",
        data: job_postings,
        CandidateJobData : updatedCandidateJobData,
        //  CandidateData
      });
    } catch (error) {
      next(error);
    }
  },

  // addJobPosting: async (req, res, next) => {
  //     try {
  //         let token = req.headers['authorization']?.split(" ")[1];
  //         let {userId, dataModel} = await getUserViaToken(token)
  //         const checkEmployer = await Employer.findOne({_id: userId})
  //         const checkAdmin = await Admin.findOne({_id: userId})
  //         if (
  //             (!checkEmployer || !checkAdmin) &&
  //             !["employers", "admins"].includes(dataModel)
  //         ) return res.status(401).send({ error: true, message: "User unauthorized." })

  //         req.body.employer = checkEmployer ? userId : req.body.employer

  //         if(checkEmployer && req.body.status == 1) {
  //             var userCreditData = await UserCredit.aggregate([
  //                 {
  //                     $match: {employer: mongoose.Types.ObjectId(userId)}
  //                 },
  //                 {
  //                     $project: {
  //                         "employer": "$employer",
  //                         "free_count":{ $ifNull: [ "$free_count", 0 ] },
  //                         "free_used_count":{ $ifNull: [ "$free_used_count", 0 ] },
  //                         "purchased_count":{ $ifNull: [ "$purchased_count", 0 ] },
  //                         "purchased_used_count":{ $ifNull: [ "$purchased_used_count", 0 ] },
  //                         "remainingFreeCount": { $ifNull: [{ $subtract: ["$free_count", "$free_used_count"] }, { $ifNull: [ "$free_count", 0 ] }] },
  //                         "remainingPurchasedCount": { $ifNull: [{ $subtract: ["$purchased_count", "$purchased_used_count"] }, { $ifNull: [ "$purchased_count", 0 ] }] }
  //                     }
  //                 }
  //             ])

  //             if(userCreditData.length <= 0 || (userCreditData[0].remainingFreeCount <= 0 && userCreditData[0].remainingPurchasedCount <= 0)) {
  //                 return res.status(400).send({ error: true, message: "You do not have enough credits." })
  //             }

  //         }

  //         // Compensation checking
  //         if(Number(req.body.max_compensation) <= Number(req.body.min_compensation)) return res.status(400).send({ error: true, message: "Max compensation should be greater than min compensation." })

  //         // compensation type checking
  //         switch (req.body.compensation_type) {
  //             case "lpa":
  //                 if(Number(req.body.min_compensation) < 1 || Number(req.body.min_compensation) > 98) return res.status(400).send({ error: true, message: "Min compensation should be between 1-98 lpa." })
  //                 if(Number(req.body.max_compensation) < 2 || Number(req.body.max_compensation) > 99) return res.status(400).send({ error: true, message: "Max compensation should be between 2-99 lpa." })
  //                 break;

  //             case "inr":
  //                 if(req.body.min_compensation.length < 4 || req.body.min_compensation.length > 7 || req.body.min_compensation.length < 4 || req.body.min_compensation.length > 7) return res.status(400).send({ error: true, message: "Min and Max compensation should be between 1000 - 9999999 INR." })
  //                 break;

  //             default:
  //                 break;
  //         }

  //         const jobPosted = await JobPosting.findOne({employer: userId});

  //         var today = new Date();
  //         req.body.expired_on = new Date(new Date().setDate(today.getDate() + (JobPosting ? 30 : 15)));

  //         const jobPostingData = new JobPosting(req.body);
  //         const result = await jobPostingData.save();

  //         console.log("result>>>>",result)

  //         if (result) {
  //             let userCreditData2;
  //             if (userCreditData?.length && req.body.status == 1) {
  //                 if(userCreditData[0].remainingFreeCount > 0) {
  //                     userCreditData2 = await UserCredit.findOneAndUpdate({employer: userId}, {$inc: {free_used_count: 1}}, {new: true})
  //                 }
  //                 if(userCreditData[0].remainingPurchasedCount > 0 && userCreditData[0].remainingFreeCount <= 0) {
  //                     userCreditData2 = await UserCredit.findOneAndUpdate({employer: userId}, {$inc: {purchased_used_count: 1}}, {new: true})
  //                 }

  //             }
  //             return res.status(201).send({
  //                 error: false,
  //                 message: "Job posted successfully.",
  //                 data: result,
  //                 credit: userCreditData2
  //             })
  //         }
  //         return res.status(400).send({
  //             error: true,
  //             message: "Job not posted."
  //         })
  //     } catch (error) {
  //         next(error);
  //     }
  // },

  addJobPosting: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkEmployer = await Employer.findOne({ _id: userId });
      const checkAdmin = await Admin.findOne({ _id: userId });
      if (
        (!checkEmployer || !checkAdmin) &&
        !["employers", "admins"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });

      req.body.employer = checkEmployer ? userId : req.body.employer;

      // req.body.job_id = Math.random().toString(36).substr(2, 10);

      function generateIncrementalJobId(prejob) {
        if (prejob == undefined) {
          const now = new Date();
          const year = now.getFullYear().toString();
          const month = (now.getMonth() + 1).toString().padStart(2, "0");
          const day = now.getDate().toString().padStart(2, "0");
          return `H2I${day}${month}${year}01`; //H2IDDMMYYYY01
        } else {
          let currentNumeric = JobList?.job_id;
          let cn = [...currentNumeric];
          let currentNumericPart = cn[cn?.length - 2] + cn[cn?.length - 1];
          const now = new Date();
          const year = now.getFullYear().toString();
          const month = (now.getMonth() + 1).toString().padStart(2, "0");
          const day = now.getDate().toString().padStart(2, "0");

          // Extract the numeric part (01) and increment it
          // let currentNumericPart = "01";
          currentNumericPart = (parseInt(currentNumericPart, 10) + 1)
            .toString()
            .padStart(2, "0");

          // Create the job ID
          const jobId = `H2I${day}${month}${year}${currentNumericPart}`;

          return jobId;
        }
      }

      let JobList = await JobPosting.findOne({
        employer: req.body.employer,
      }).sort({ _id: -1 });

      let preJobId = JobList?.job_id;

      req.body.job_id = generateIncrementalJobId(preJobId);

      if (req.body?.isJobReposted) {
        req.body.ref_job_id = req.body?.ref_job_id
        req.body.ref_id = req.body?.ref_id
      }

      let userCreditData = await UserCredit.findOne({ employer: userId });
      // console.log({userCreditData})
      // console.log(userCreditData?.purchased_count)
      if (userCreditData?.purchased_count <= 0) {
        return res
          .status(400)
          .send({ error: true, message: "You do not have enough credits." });
      }

      // Compensation checking
      if (
        Number(req.body.max_compensation) <= Number(req.body.min_compensation)
      )
        return res.status(400).send({
          error: true,
          message: "Max compensation should be greater than min compensation.",
        });

      // compensation type checking
      switch (req.body.compensation_type) {
        case "lpa":
          if (
            Number(req.body.min_compensation) < 1 ||
            Number(req.body.min_compensation) > 98
          )
            return res.status(400).send({
              error: true,
              message: "Min compensation should be between 1-98 lpa.",
            });
          if (
            Number(req.body.max_compensation) < 2 ||
            Number(req.body.max_compensation) > 99
          )
            return res.status(400).send({
              error: true,
              message: "Max compensation should be between 2-99 lpa.",
            });
          break;

        case "inr":
          if (
            req.body.min_compensation.length < 4 ||
            req.body.min_compensation.length > 7 ||
            req.body.min_compensation.length < 4 ||
            req.body.min_compensation.length > 7
          )
            return res.status(400).send({
              error: true,
              message:
                "Min and Max compensation should be between 1000 - 9999999 INR.",
            });
          break;

        default:
          break;
      }

      const jobPosted = await JobPosting.findOne({ employer: userId }).populate(
        [
          {
            path: "employer",
            select: "fname lname",
          },
        ]
      );

      let empFname = jobPosted?.employer?.fname;
      let empLname = jobPosted?.employer?.lname;

      var today = new Date();
      req.body.expired_on = new Date(
        new Date().setDate(today.getDate() + (JobPosting ? 45 : 15))
      );

      const jobPostingData = new JobPosting(req.body);
      const result = await jobPostingData.save();

      const AdminData = await Admin.findOne({});

      let adminId = AdminData?._id;
      let adminMail = AdminData?.email;
      let adminName = AdminData?.name;

      // let recentPost = await JobPosting.findOne({_id:result?._id});

      // let messagedata = recentPost?.urgent_mesg;
      // let recentJobName = recentPost?.job_name;
      // let recentJobId = recentPost?.job_id;

      // if(recentPost?.is_urgent == true){
      //     let AdminsendNotificationData = await AdminsendNotification({
      //         user: adminId,
      //         type:"Urgentlyapproval",
      //         title: `Job approval urgently for ${recentJobName}-${recentJobId}`,
      //         description: `${messagedata}`
      //     });

      //    // console.log("sendNotificationData", sendNotificationData)
      // }

      sgMail.setApiKey(process.env.SENDGRID);
      const msg = {
        to: "hire2inspireh2i@gmail.com", // Change to your recipient
        from: "info@hire2inspire.com",
        subject: `Job Approval Request!`,
        html: `
                      <head>
                          <title>Notification: Request for Job Approval</title>
                  </head>
                  <body>
                  <p>
                    Dear ${adminName},
                  </p>
                  <p>
                    I hope this message finds you well. I am writing to request your kind attention to the job posting submitted by a employer on our platform. We believe that this job opportunity aligns perfectly with our community's needs, and we kindly request your approval to make it visible to our job seekers.
                  </p>
                  <p>
                    Please let us know if you have any questions or need additional details. We look forward to your positive response.
                  </p>
                  <p>Find the link 
                      <a href="https://${process.env.front_url}/admin/login" target="blank">LogIn</a>
                    </p>
                  <p>Warm regards,</p>
                  <p>${empFname} ${empLname} </p>
                </body>
              `,
      };

      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent for Admin approve");
        })
        .catch((error) => {
          console.error(error);
        });

      // const agencydata = await Agency.find({});

      // let agencyEmails = agencydata.map(e => e.corporate_email.toString());

      // console.log(agencyEmails)

      //             sgMail.setApiKey(process.env.SENDGRID)
      //             const new_msg = {
      //                 to: agencyEmails, // Change to your recipient
      //                 from: 'info@hire2inspire.com', // Change to your verified sender
      //                 subject: ` Calling All Talent Architects, A New Blueprint Awaits!`,
      //                 html: `
      //             <head>
      //                 <title>Notification:New Job Posting</title>
      //           </head>
      //          <body>
      //     // <p>Subject: Calling All Talent Architects, A New Blueprint Awaits!</p>
      //     <p>Greetings from hire2Inspire! We are thrilled to unveil a bold new blueprint that demands the expertise and finesse your agency can provide.</p>
      //     <p>Our latest mandate is not just another project – it's an opportunity to shape careers, transform organizations, and leave an indelible mark on the landscape of talent acquisition.</p>
      //     <p>Let us leverage our collective expertise to bring this blueprint to life.</p>
      //     <p>(Job details and link of the job to be provided here posted on H2I)</p>
      //     <p>Regards,</p>
      //     <p>hire2Inspire</p>
      //     <p>&nbsp;</p>
      // </body>
      //         `
      //             }
      //             sgMail
      //                 .sendMultiple(new_msg)
      //                 .then(() => {
      //                     console.log('Email sent to allagencies')
      //                 })
      //                 .catch((error) => {
      //                     console.error(error)
      //                 })

      if (result) {
        let userCreditData2;
        userCreditData2 = await UserCredit.findOneAndUpdate(
          { employer: userId },
          { $inc: { purchased_count: -1 } },
          { new: true }
        );

        // console.log({userCreditData2})
        return res.status(201).send({
          error: false,
          message: "Job posted successfully.",
          data: result,
          credit: userCreditData2,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Job not posted.",
      });
    } catch (error) {
      next(error);
    }
  },

  detailJobPosting: async (req, res, next) => {
    try {
      // let token = req.headers['authorization']?.split(" ")[1];
      // let {userId, dataModel} = await getUserViaToken(token)
      // const checkEmployer = await Employer.findOne({_id: userId})
      // const checkAgency = await Agency.findOne({_id: userId})
      // const checkRecruiter = await RecruiterModel.findOne({_id: userId})
      // const checkAdmin = await Admin.findOne({_id: userId})

      // if((!checkEmployer || !checkAgency || !checkRecruiter || !checkAdmin) && !["employers", "agency", "recruiters", "admins"].includes(dataModel)) return res.status(400).send({ error: true, message: "User not authorized." })

      const jobPostingData = await JobPosting.findOne({
        _id: req.params.id,
      }).populate([
        {
          path: "employer",
          select: "fname lname email employer_image",
        },
      ]);

      const hiringDetail = await HiringDetail.find({
        job: req.params.id,
      }).populate([
        {
          path: "job",
          select: "job_name",
        },
        {
          path: "candidate",
          select: " ",
          populate: {
            path: "agency",
            select: "name corporate_email",
          },
        },
      ]);

      if (jobPostingData) {
        return res.status(200).send({
          error: false,
          message: "Job detail found!",
          data: jobPostingData,
          hiringDetail,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Job not found.",
      });
    } catch (error) {
      next(error);
    }
  },

  updateJobPosting: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkEmployer = await Employer.findOne({ _id: userId });
      const checkAdmin = await Admin.findOne({ _id: userId });
      if (
        (!checkEmployer || !checkAdmin) &&
        !["employers", "admins"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });
      const existingJobPostingData = await JobPosting.findOne({
        _id: req.params.id,
      });

      if (
        checkEmployer &&
        req.body.status == 1 &&
        existingJobPostingData.status != 1
      ) {
        var userCreditData = await UserCredit.aggregate([
          {
            $match: { employer: mongoose.Types.ObjectId(userId) },
          },
          {
            $project: {
              employer: "$employer",
              free_count: { $ifNull: ["$free_count", 0] },
              free_used_count: { $ifNull: ["$free_used_count", 0] },
              purchased_count: { $ifNull: ["$purchased_count", 0] },
              purchased_used_count: { $ifNull: ["$purchased_used_count", 0] },
              remainingFreeCount: {
                $ifNull: [
                  { $subtract: ["$free_count", "$free_used_count"] },
                  { $ifNull: ["$free_count", 0] },
                ],
              },
              remainingPurchasedCount: {
                $ifNull: [
                  { $subtract: ["$purchased_count", "$purchased_used_count"] },
                  { $ifNull: ["$purchased_count", 0] },
                ],
              },
            },
          },
        ]);

        if (
          userCreditData.length <= 0 ||
          (userCreditData[0].remainingFreeCount <= 0 &&
            userCreditData[0].remainingPurchasedCount <= 0)
        ) {
          return res
            .status(400)
            .send({ error: true, message: "You do not have enough credits." });
        }
      }

      // Compensation checking
      if (
        Number(req.body.max_compensation) <= Number(req.body.min_compensation)
      )
        return res.status(400).send({
          error: true,
          message: "Max compensation should be greater than min compensation.",
        });

      // compensation type checking
      switch (req.body.compensation_type) {
        case "lpa":
          if (
            Number(req.body.min_compensation) < 1 ||
            Number(req.body.min_compensation) > 98
          )
            return res.status(400).send({
              error: true,
              message: "Min compensation should be between 1-98 lpa.",
            });
          if (
            Number(req.body.max_compensation) < 2 ||
            Number(req.body.max_compensation) > 99
          )
            return res.status(400).send({
              error: true,
              message: "Max compensation should be between 2-99 lpa.",
            });

          break;

        case "inr":
          if (
            req.body.min_compensation.length < 4 ||
            req.body.min_compensation.length > 7 ||
            req.body.min_compensation.length < 4 ||
            req.body.min_compensation.length > 7
          )
            return res.status(400).send({
              error: true,
              message:
                "Min and Max compensation should be between 1000 - 9999999 INR.",
            });

          break;

        default:
          break;
      }

      const jobPostingData = await JobPosting.findOneAndUpdate(
        { _id: req.params.id },
        req.body,
        { new: true }
      );

      if (jobPostingData) {
        let userCreditData2;
        // console.log("data>>>>>",typeof(existingJobPostingData.status))
        if (
          userCreditData?.length &&
          req.body.status == 1 &&
          existingJobPostingData.status != 1
        ) {
          if (userCreditData[0].remainingFreeCount > 0) {
            userCreditData2 = await UserCredit.findOneAndUpdate(
              { employer: userId },
              { $inc: { free_used_count: 1 } },
              { new: true }
            );
          }
          if (
            userCreditData[0].remainingPurchasedCount > 0 &&
            userCreditData[0].remainingFreeCount <= 0
          ) {
            userCreditData2 = await UserCredit.findOneAndUpdate(
              { employer: userId },
              { $inc: { purchased_used_count: 1 } },
              { new: true }
            );
          }
        }
        const AdminData = await Admin.findOne({});
        let adminId = AdminData?._id;

        let recentPost = await JobPosting.findOne({ _id: req.params.id });
        let messagedata = recentPost?.urgent_mesg;
        let recentJobName = recentPost?.job_name;
        let recentJobId = recentPost?.job_id;
        if (recentPost?.is_urgent == true) {
          let AdminsendNotificationData = await AdminsendNotification({
            user: adminId,
            type: "Urgentlyapproval",
            title: `Job approval urgently for ${recentJobName}-${recentJobId}`,
            description: `${messagedata}`,
          });

          // console.log("sendNotificationData", sendNotificationData)
        }
        return res.status(200).send({
          error: false,
          message: "Job updated successfully.",
          data: jobPostingData,
          credit: userCreditData2,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Job not updated.",
      });
    } catch (error) {
      next(error);
    }
  },

  // invite agencies here (Single invitation)
  inviteAgency: async (req, res, next) => {
    try {
      // Find recruiter available or not
      const recruiterData = await RecruiterModel.find({
        agency: req.body.agencyId,
        status: true,
      });
      if (recruiterData) {
        req.body.recruiter = recruiterData[0]._id;
      }
      req.body.invitation_date = Date.now();

      // Allocate job to a agency here
      const agencyAllocation = await AgencyJobModel.findOneAndUpdate(
        { job: req.body.jobId, agency: req.body.agencyId },
        req.body,
        { upsert: true, new: true }
      );

      if (agencyAllocation) {
        return res.status(201).send({
          error: false,
          message: "Agency invited",
          data: agencyAllocation,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Agency invitation failed",
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk invite agencies here (Bulk invitation)
  inviteAgencies: async (req, res, next) => {
    try {
      let agencies = [];
      agencies = req.body.agencyIds;
      let customAgencyJobData = [];
      for (let i = 0; i < agencies.length; i++) {
        // Agency invited or not checking
        const checkInvitationExistence = await AgencyJobModel.findOne({
          agency: agencies[i],
          job: req.body.jobId,
        }).populate([
          {
            path: "agency",
            select: "name",
          },
        ]);

        // If agency already invited
        if (checkInvitationExistence)
          return res.status(400).send({
            error: true,
            message: `${checkInvitationExistence?.agency?.name} already invited for this job.`,
          });

        // If agency not invited
        // Find recruiter available or not
        const recruiterData = await RecruiterModel.find({
          agency: agencies[i],
          status: true,
        });
        customAgencyJobData.push({
          job: req.body.jobId,
          agency: agencies[i],
          recruiter: recruiterData.length ? recruiterData[0]._id : undefined,
          invitation_date: Date.now(),
        });
      }

      // Allocate job to a agency here
      const agencyAllocationData = await AgencyJobModel.insertMany(
        customAgencyJobData
      );

      if (agencyAllocationData) {
        return res.status(201).send({
          error: false,
          message: "Agencies invited",
          data: agencyAllocationData,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Agency invitation failed",
      });
    } catch (error) {
      next(error);
    }
  },

  // Agency self job assign / decline
  agencySelfJobAssignDecline: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      if (!checkAgency && dataModel != "agency")
        return res
          .status(400)
          .send({ error: true, message: "Agency not found." });

      let customAgencyJobData = [];
      // Agency invited or not checking
      const checkInvitationExistence = await AgencyJobModel.findOne({
        agency: userId,
        job: req.body.jobId,
        status: req.body.status,
      }).populate([
        {
          path: "agency",
          select: "name",
        },
      ]);

      // If agency already invited
      if (checkInvitationExistence)
        return res.status(400).send({
          error: true,
          message: `${checkInvitationExistence?.agency?.name} already assigned for this job.`,
        });

      // If agency not invited
      // Find recruiter available or not
      const recruiterData = await RecruiterModel.find({
        agency: userId,
        status: true,
      });
      customAgencyJobData.push({
        job: req.body.jobId,
        agency: userId,
        recruiter: recruiterData.length ? recruiterData[0]._id : undefined,
        invitation_date: Date.now(),
      });

      // Allocate job to a agency here
      const agencyJobData = await AgencyJobModel.findOneAndUpdate(
        { agency: userId, job: req.body.jobId },
        { status: req.body.status },
        { upsert: true, new: true }
      );

      let agencyJobs = await AgencyJobModel.find({ agency: userId });
      let agencyJobsJobIds = agencyJobs.map((e) => {
        return e.job;
      });
      const job_postings = await JobPosting.find({
        _id: { $nin: agencyJobsJobIds },
      })
        .populate([
          {
            path: "employer",
            select: "fname lname email employer_image",
          },
        ])
        .sort({ _id: -1 });

      if (agencyJobData) {
        return res.status(201).send({
          error: false,
          message: `Success`,
          data: agencyJobData,
          jobs: job_postings,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Agency job assign/decline failed",
      });
    } catch (error) {
      next(error);
    }
  },

  // add hiring details
  hiringDetail: async (req, res, next) => {
    try {
      const hiringDetailsData = new HiringDetail(req.body);
      const result = await hiringDetailsData.save();

      hiringList = await HiringDetail.findOne({ _id: result?._id }).populate([
        {
          path: "job",
          select: "job_name",
        },
        {
          path: "candidate",
          select: "fname lname",
        },
      ]);

      let candidateFname = hiringList?.candidate?.fname;
      let candidateLname = hiringList?.candidate?.lname;
      let jobRole = hiringList?.job?.job_name;
      let compName = hiringList?.comp_name;

      //  console.log("id>>>",result?.offerd_detail[0]?.candidate);

      const candidateData = await Candidate.findOneAndUpdate(
        { _id: result?.candidate },
        { is_hired: true },
        { new: true }
      ).populate([
        {
          path: "agency",
          select: "first_name last_name",
        },
      ]);

      const jobData = await JobPosting.findOneAndUpdate(
        { _id: result?.job },
        { $inc: { no_of_opening: -1 } },
        { new: true }
      );

      if (jobData?.no_of_opening == 0) {
        const jobUpdate = await JobPosting.findOneAndUpdate(
          { _id: result?.job },
          { status: "4" },
          { new: true }
        );
      }

      if (hiringList) {
        const jobData = await JobPosting.findOneAndUpdate(
          { _id: result?.job },
          { $inc: { hired_count: 1 } },
          { new: true }
        );
      }

      let agencyId = candidateData?.agency?._id;
      //console.log("agency>>>>",agency)

      const agengydata = await Agency.findOne({ _id: agencyId });
      //console.log("agengydata>>>>",agengydata)

      let agencyMail = agengydata?.corporate_email;
      // console.log("agencyMail>>>>",agencyMail)

      let agencyName = agengydata?.name;

      console.log("agencyName>>>>", agencyName);

      sgMail.setApiKey(process.env.SENDGRID);
      const msg = {
        to: agencyMail, // Change to your recipient
        from: "info@hire2inspire.com",
        subject: `Hired candidate!`,
        html: `
                      <head>
                          <title>Notification: Candidate Hired - Backend Development Position</title>
                  </head>
                  <body>
                      <p>Dear ${agencyName},</p>
                      <p>I hope this email finds you well. We are writing to formally notify you that the candidate you submitted for the Backend Development position has been successfully hired for the role.</p>
                      <p>After a thorough evaluation of the candidate's qualifications, skills, and experience, we are pleased to inform you that they have met our requirements and are an excellent fit for our team. We were particularly impressed with their expertise in [mention specific skills or technologies], which we believe will greatly contribute to our projects and initiatives.</p>
                      <p>We appreciate the effort you put into identifying and presenting this candidate to us. Your support throughout the recruitment process has been instrumental in helping us find the right candidate for our team.</p>
                      <p>At this point, we kindly request your assistance in initiating the necessary steps to finalize the onboarding process for the candidate. This includes coordinating any remaining paperwork, sharing important company information, and facilitating a smooth transition into their new role.</p>
                      <p>Once again, we extend our gratitude for your collaboration and for connecting us with such a promising candidate. We look forward to future opportunities to work together.</p>
                      <p>If you have any further questions or require additional information, please feel free to reach out to us. We value our partnership and appreciate your prompt attention to this matter.</p>
                      <p>Thank you and best regards,</p>
                      <p> Hire2Inspire </p>
                  </body>
              `,
      };

      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent");
        })
        .catch((error) => {
          console.error(error);
        });

      let sendNotificationData = await sendNotification({
        user: agencyId,
        type: "hired",
        title: "Candidate Hired",
        description: `${candidateFname} ${candidateLname} got a job offer from ${compName} as ${jobRole}`,
      });

      console.log("sendNotificationData", sendNotificationData);

      return res.status(200).send({
        error: false,
        message: "Hiring Detail",
        data: result,
        candidateData,
      });
    } catch (error) {
      next(error);
    }
  },

  updateStatus: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkEmployer = await Employer.findOne({ _id: userId });
      const checkAdmin = await Admin.findOne({ _id: userId });
      if (
        (!checkEmployer || !checkAdmin) &&
        !["employers", "admins"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });

      const jobData = await JobPosting.findOneAndUpdate(
        { _id: req.params.id },
        req.body,
        { new: true }
      );

      if (jobData) {
        return res.status(201).send({
          error: false,
          message: "Hired status update",
          data: jobData,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Hired status failed",
      });
    } catch (error) {
      next(error);
    }
  },

  deleteStatus: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkEmployer = await Employer.findOne({ _id: userId });
      const checkAdmin = await Admin.findOne({ _id: userId });
      if (
        (!checkEmployer || !checkAdmin) &&
        !["employers", "admins"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });

      const jobData = await JobPosting.findOneAndUpdate(
        { _id: req.params.id },
        { is_deleted: true },
        { new: true }
      );

      if (jobData) {
        return res.status(201).send({
          error: false,
          message: "Hired status update",
          data: jobData,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Hired status failed",
      });
    } catch (error) {
      next(error);
    }
  },

  agencyList: async (req, res, next) => {
    try {
      let agencyJobData = await AgencyJobModel.find({ job: req.params.id });
      let agencyIds = agencyJobData.map((e) => e.agency.toString());

      //  console.log("agencyIds",agencyIds)

      let agencies = await Agency.find({ _id: { $in: agencyIds } });
      const agencyReviewsMap = {};
      for (let i = 0 ; i < agencies.length ; i++) {
        const agencyReview = await CandidateJobModel.aggregate([
          {
            // Step 1: Filter out documents where the candidate._id is null or review is missing
            $match: {
              candidate: { $exists: true, $ne: null }, // Ensure candidate._id exists and is not null
              "review.communication_skill": { $exists: true, $ne: null }, // Ensure review fields exist
              "review.position_knwdlg": { $exists: true, $ne: null },
              "review.proffesioalsm": { $exists: true, $ne: null },
              agency_id : agencies[i]._id
            },
          },
          {
            // Step 2: Calculate the average review score for each document
            $addFields: {
              average_review_score: {
                $avg: [
                  { $toDouble: "$review.communication_skill" },
                  { $toDouble: "$review.position_knwdlg" },
                  { $toDouble: "$review.proffesioalsm" },
                ],
              },
            },
          },
          {
            // Step 3: Group by candidate._id and calculate the overall average score for each candidate
            $group: {
              _id: "$candidate",
              avgCandidateScore: { $avg: "$average_review_score" }, // Average review score for each candidate
              count: { $sum: 1 }, // Count of reviews per candidate
            },
          },
          {
            // Step 4: Calculate the total average score across all candidates
            $group: {
              _id: null,
              total_avg_score: { $avg: "$avgCandidateScore" }, // Average of all candidate averages
              totalCandidates: { $sum: 1 }, // Total number of candidates
              sum_of_scores: { $sum: "$avgCandidateScore" }, // Sum of all avgCandidateScores (for reference)
            },
          },
          {
            // Step 5: Project final results
            $project: {
              _id: 0, // Suppress the _id field
              total_avg_score: 1, // The overall average across all candidates
              totalCandidates: 1,
              sum_of_scores: 1,
            },
          },
        ]);
        agencyReviewsMap[agencies[i]._id] = agencyReview[0]?.total_avg_score
        ? parseFloat(agencyReview[0].total_avg_score).toFixed(1)
        : ""
      }

      const agenciesWithReviews = agencies.map((agency) => ({
        ...agency.toObject(), // Convert Mongoose document to plain object
        agencyReview: agencyReviewsMap[agency._id.toString()] // Add agencyReview data
      }));

      return res.status(200).send({
        error: false,
        message: "Agency list",
        data: agenciesWithReviews,
      });
    } catch (error) {
      next(error);
    }
  },

  // Assign recruiter to a job
  assignRecruiter: async (req, res, next) => {
    try {
      // Assign
    } catch (error) {
      next(error);
    }
  },

  addJobPostingData: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkEmployer = await Employer.findOne({ _id: userId });
      const checkAdmin = await Admin.findOne({ _id: userId });
      if (
        (!checkEmployer || !checkAdmin) &&
        !["employers", "admins"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });

      req.body.employer = checkEmployer ? userId : req.body.employer;

      if (checkEmployer && req.body.status == 1) {
        var userCreditData = await UserCredit.aggregate([
          {
            $match: { employer: mongoose.Types.ObjectId(userId) },
          },
          {
            $project: {
              employer: "$employer",
              free_count: { $ifNull: ["$free_count", 0] },
              free_used_count: { $ifNull: ["$free_used_count", 0] },
              purchased_count: { $ifNull: ["$purchased_count", 0] },
              purchased_used_count: { $ifNull: ["$purchased_used_count", 0] },
              remainingFreeCount: {
                $ifNull: [
                  { $subtract: ["$free_count", "$free_used_count"] },
                  { $ifNull: ["$free_count", 0] },
                ],
              },
              remainingPurchasedCount: {
                $ifNull: [
                  { $subtract: ["$purchased_count", "$purchased_used_count"] },
                  { $ifNull: ["$purchased_count", 0] },
                ],
              },
            },
          },
        ]);

        if (
          userCreditData.length <= 0 ||
          (userCreditData[0].remainingFreeCount <= 0 &&
            userCreditData[0].remainingPurchasedCount <= 0)
        ) {
          return res
            .status(400)
            .send({ error: true, message: "You do not have enough credits." });
        }
      }

      // Compensation checking
      if (
        Number(req.body.max_compensation) <= Number(req.body.min_compensation)
      )
        return res.status(400).send({
          error: true,
          message: "Max compensation should be greater than min compensation.",
        });

      // compensation type checking
      switch (req.body.compensation_type) {
        case "lpa":
          if (
            Number(req.body.min_compensation) < 1 ||
            Number(req.body.min_compensation) > 98
          )
            return res.status(400).send({
              error: true,
              message: "Min compensation should be between 1-98 lpa.",
            });
          if (
            Number(req.body.max_compensation) < 2 ||
            Number(req.body.max_compensation) > 99
          )
            return res.status(400).send({
              error: true,
              message: "Max compensation should be between 2-99 lpa.",
            });
          break;

        case "inr":
          if (
            req.body.min_compensation.length < 4 ||
            req.body.min_compensation.length > 7 ||
            req.body.min_compensation.length < 4 ||
            req.body.min_compensation.length > 7
          )
            return res.status(400).send({
              error: true,
              message:
                "Min and Max compensation should be between 1000 - 9999999 INR.",
            });
          break;

        default:
          break;
      }

      const jobPosted = await JobPosting.findOne({ employer: userId });

      var today = new Date();
      req.body.expired_on = new Date(
        new Date().setDate(today.getDate() + (JobPosting ? 45 : 15))
      );

      const jobPostingData = new JobPosting(req.body);
      const result = await jobPostingData.save();

      console.log("result>>>>", result);

      if (result) {
        let userCreditData2;
        if (userCreditData?.length && req.body.status == 1) {
          if (userCreditData[0].remainingFreeCount > 0) {
            userCreditData2 = await UserCredit.findOneAndUpdate(
              { employer: userId },
              { $inc: { free_used_count: 1 } },
              { new: true }
            );
          }
          if (
            userCreditData[0].remainingPurchasedCount > 0 &&
            userCreditData[0].remainingFreeCount <= 0
          ) {
            userCreditData2 = await UserCredit.findOneAndUpdate(
              { employer: userId },
              { $inc: { purchased_used_count: 1 } },
              { new: true }
            );
          }
        }
        return res.status(201).send({
          error: false,
          message: "Job posted successfully.",
          data: result,
          credit: userCreditData2,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Job not posted.",
      });
    } catch (error) {
      next(error);
    }
  },

  // Agency job update
  agencyJobUpdate: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      if (!checkAgency && dataModel != "agency")
        return res
          .status(400)
          .send({ error: true, message: "Agency not found." });

      const jobUpdata = await JobPosting.findOneAndUpdate(
        { _id: req.params.job },
        { is_decline: req.body.is_decline },
        { new: true }
      );

      console.log("jobUpdata", jobUpdata);

      if (jobUpdata) {
        return res.status(201).send({
          error: false,
          message: `Success`,
          data: jobUpdata,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Agency job assign/decline failed",
      });
    } catch (error) {
      next(error);
    }
  },

  // // Agency job update
  // announcementJobUpdate: async (req, res, next) => {
  //   try {
  //     let announcementData = req.body.announcement;
  //     let interviewDate = req.body.interview_date;
  //     let typeData = req.body.type;
  //     let intdate = moment.tz(interviewDate, "Asia/Kolkata");
  //     let formattedDate = intdate.format("DD MM YYYY");
  //     const jobUpdata = await JobPosting.findOneAndUpdate(
  //       { _id: req.params.job },
  //       { announcement: announcementData, interview_date: interviewDate },
  //       { new: true }
  //     );

  //     console.log("jobUpdata", jobUpdata);

  //     const agencyJobUpdate = await AgencyJobModel.findOne({
  //       job: req.params.job,
  //     });

  //     let agencyName = agencyJobUpdate?.agency?.name;
  //     let agencyId = agencyJobUpdate?.agency;
  //     let jobName = jobUpdata?.job_name;
  //     let jobId = jobUpdata?.job_id;

  //     if (typeData == "announcement") {
  //       let sendNotificationData = await sendNotification({
  //         user: agencyId,
  //         // type: "announcement",
  //         type: typeData,
  //         title: `New Announcement for ${jobName} - ${jobId}`,
  //         description: `${announcementData}`,
  //       });
  //     } else {
  //       let sendNotificationData = await sendNotification({
  //         user: agencyId,
  //         // type: "announcement",
  //         type: typeData,
  //         title: `New Announcement for ${jobName} - ${jobId}`,
  //         description: `${formattedDate}`,
  //       });
  //     }

  //     if (jobUpdata) {
  //       return res.status(201).send({
  //         error: false,
  //         message: `Success`,
  //         data: jobUpdata,
  //       });
  //     }
  //     return res.status(400).send({
  //       error: true,
  //       message: "Agency job assign/decline failed",
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  announcementJobUpdate: async (req, res, next) => {
    try {
      let announcementData = req.body.announcement;
      const jobUpdata = await JobPosting.findOneAndUpdate(
        { _id: req.params.job },
        { announcement: announcementData },
        { new: true }
      );

      console.log("jobUpdata", jobUpdata);

      const agencyJobUpdate = await AgencyJobModel.findOne({
        job: req.params.job,
      });

      let agencyName = agencyJobUpdate?.agency?.name;
      let agencyId = agencyJobUpdate?.agency;
      let jobName = jobUpdata?.job_name;
      let jobId = jobUpdata?.job_id;

      let sendNotificationData = await sendNotification({
        user: agencyId,
        type: "announcement",
        title: `New Announcement for ${jobName} - ${jobId}`,
        description: `${announcementData}`,
      });

      console.log("sendNotificationData", sendNotificationData);

      if (jobUpdata) {
        return res.status(201).send({
          error: false,
          message: `Success`,
          data: jobUpdata,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Agency job assign/decline failed",
      });
    } catch (error) {
      next(error);
    }
  },
};

const createError = require("http-errors");
const CandidateModel = require("../models/candidate.model");
const AgencyJobModel = require("../models/agency_job.model");
const CandidateJobModel = require("../models/candidate_job.model");
const Recruiter = require("../models/recruiter.model");
const { getUserViaToken } = require("../helpers/jwt_helper");
const Agency = require("../models/agency.model");
const JobPosting = require("../models/job_posting.model");
const ObjectId = require("mongoose").Types.ObjectId;
var admin = require("firebase-admin");
var serviceAccount = require("../hire2inspire-firebase-adminsdk.json");
const express = require("express");
const app = express();
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

// var transport = nodemailer.createTransport({
//     host: 'smtp.zoho.in',
//     port: 465,
//     secure: true,
//     auth: {
//         user: 'Info@hire2inspire.com',
//         pass: '17X2DnJJiQmm'
//     },
//     requireTLS: true,
// });

const { bucket } = require("./../config/fireBaseConfig");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: process.env.FIREBASE_DATABASE_URL,
//   storageBucket: process.env.BUCKET_URL,
// });
// app.locals.bucket = admin.storage().bucket();

module.exports = {
  /**
   * This method is to submit candidate
   */
  submitCandidate: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      let agencyname = checkAgency?.name;
      const checkRecruiter = await Recruiter.findOne({ _id: userId });
      if (
        (!checkAgency || !checkRecruiter) &&
        !["agency", "recruiters"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });

      // Checking the corresponding agency job exist or not
      const agencyJobExist = await AgencyJobModel.findOne({
        _id: req.body.agency_job,
      });

      console.log("agencyJobExist", agencyJobExist);

      // if corresponding agency job not exist
      if (!agencyJobExist)
        return res
          .status(400)
          .send({ error: true, message: "AGgency job does not exist" });

      // Checking the candidate exist or not
      // const candidateExist = await CandidateModel.findOne({email:req.body.email});
      // const candidateExist1 = await CandidateModel.findOne({phone:req.body.phone})

      let candidateExist = await CandidateModel.findOne({
        $and: [{ email: req.body.email }, { agency_job: req.body.agency_job }],
      });
      let candidateExist1 = await CandidateModel.findOne({
        $and: [{ phone: req.body.phone }, { agency_job: req.body.agency_job }],
      });

      console.log("candidate>>>>>", candidateExist);
      console.log("candidate.id", candidateExist?.agency_job);
      console.log("patrams", req.body.agency_job);
      console.log("candidateExist1", candidateExist1);
      console.log("body", req.body);

      if (candidateExist?.agency_job == req.body.agency_job) {
        console.log("in..");
        return res.status(400).send({
          error: true,
          message: `Candidate data already exist with this email ${candidateExist?.email}`,
        });
      } else if (candidateExist1?.agency_job == req.body.agency_job) {
        return res.status(400).send({
          error: true,
          message: `Candidate data already exist with this phone no ${candidateExist1?.phone}`,
        });
      }

      // if candidate exist

      // if corresponding agency job exist and candidate not exist
      // Submit candidate here
      req.body.agency = agencyJobExist.agency;
      req.body.recruiter = checkRecruiter?._id || undefined;
      req.body.job = agencyJobExist.job;

      // console.log("1", req.body);
      const candidateData = new CandidateModel(req.body);
      // console.log("2", candidateData);

      const candidateDataResult = await candidateData.save();

      const agencyJobUpdate = await AgencyJobModel.findOneAndUpdate(
        { _id: agencyJobExist._id },
        { $push: { candidates: candidateDataResult._id } },
        { new: true }
      );

      req.body.emp_job = candidateDataResult?.job;
      req.body.agency_id = candidateDataResult?.agency;
      req.body.candidate = candidateDataResult?._id;

      const candidateJobData = new CandidateJobModel(req.body);

      const candidateJob = await candidateJobData.save();

      const candidatejobdata = await CandidateJobModel.findOne({
        _id: candidateJob?._id,
      }).populate([
        {
          path: "emp_job",
          select: "",
          populate: {
            path: "employer",
            select: "email fname lname",
          },
        },
      ]);

      const candidatelist = await CandidateModel.findOne({
        _id: candidateDataResult?._id,
      });
      //console.log("agengydata>>>>",agengydata)

      let candidateEmail = candidatelist?.email;
      let candidatefName = candidatelist?.fname;
      let candidatelName = candidatelist?.lname;
      let candidateCv = candidatelist?.resume;

      console.log("candidateCv", candidateCv);

      let companyName = candidatejobdata?.emp_job?.comp_name;

      let jobRole = candidatejobdata?.emp_job?.job_name;

      let jobIDS = candidatejobdata?.emp_job?.job_id;

      let jobId = candidatejobdata?.emp_job;

      let empMail = candidatejobdata?.emp_job?.employer?.email;

      let empFname = candidatejobdata?.emp_job?.employer?.fname;

      console.log("empFname", empFname);

      let empLname = candidatejobdata?.emp_job?.employer?.lname;

      console.log("empLname", empLname);

      let candidateId = candidatejobdata?.candidate;

      console.log("candidateEmail>>>>", candidateEmail);

      sgMail.setApiKey(process.env.SENDGRID);
      const msg = {
        to: candidateEmail, // Change to your recipient
        from: "info@hire2inspire.com",
        subject: `Your Talent Spark: Ignite Opportunity with ${companyName}`,
        html: `
                       <head>
                           <title>Notification: Candidate Hired - Backend Development Position</title>
                   </head>
                   <body>
                       <p>Dear ${candidatefName} ${candidatelName} ,</p>
                       <p>I hope this email finds you well. I am writing to confirm that we have received your application for the ${jobRole} at ${companyName}. We appreciate your interest in joining our team and taking the time to submit your CV. Your application is currently being reviewed by our recruitment team.</p>
       
                       <p>As we move forward in the selection process, we would like to gather some additional information from you. Please take a moment to answer the following screening questions. Your responses will help us better understand your qualifications and suitability for the role. Once we review your answers, we will determine the next steps in the process.</p>
       
                       <p>Find the link 
                       <a href="${process.env.front_url}/candidate/apply-job/${candidateId}" target="blank">Find your job</a>
                     </p>
       
                       <p>Regards,</p>
                       <p>Hire2Inspire</p>
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

      sgMail.setApiKey(process.env.SENDGRID);
      const newmsg = {
        to: empMail, // Change to your recipient
        from: "info@hire2inspire.com",
        subject: `Your Talent Spark: Ignite Opportunity with ${companyName}`,
        html: `
                    <head>
                        <title>Application for ${jobRole} - ${jobIDS}</title>
                    </head>
                    <body>
                    <p>Dear ${empFname} ${empLname},</p>
                    <p>I hope this email finds you well. I am writing to express my strong interest in the ${jobRole} position at ${companyName}, as advertised where you found the job posting.</p>
                    <p>What particularly drew me to this opportunity at ${companyName} is mention something specific about the company that resonates with you. I am eager to be a part of a team that is describe what excites you about the company or its culture.</p>
                    <p>I am impressed by ${companyName}'s commitment to mention any specific initiatives, values, or projects mentioned by the company. I am eager to bring my mention specific skills or experiences to the team and contribute to ${companyName}'s continued success.</p>
                    <p>Thank you for considering my application.
                    <p>I am available for an interview at your earliest convenience and look forward to the opportunity to discuss how my skills and experiences align with the needs of ${companyName}.</p>
                    <p>Warm regards,</p>
                    <p>${candidatefName} ${candidatelName}</p>
                    <p>${agencyname}</p>
                </body>
                   `,
      };

      sgMail
        .send(newmsg)
        .then(() => {
          console.log("Email sent");
        })
        .catch((error) => {
          console.error(error);
        });

      if (candidateDataResult) {
        return res.status(201).send({
          error: false,
          message: "Candidate submitted",
          data: candidateDataResult,
          candidateJob,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Candidate submission failed",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * This method is to submit bulk candidate
   */
  submitBulkCandidate: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      const checkRecruiter = await Recruiter.findOne({ _id: userId });
      if (
        (!checkAgency || !checkRecruiter) &&
        !["agency", "recruiters"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });

      // Checking the corresponding agency job exist or not
      const agencyJobExist = await AgencyJobModel.findOne({
        _id: req.body.agency_job,
      });

      const empJobExist = await JobPosting.findOne({ _id: req.body.job });

      // if corresponding agency job not exist
      if (!agencyJobExist)
        return res
          .status(400)
          .send({ error: true, message: "Candidate submission failed" });

      if (!empJobExist)
        return res
          .status(400)
          .send({ error: true, message: "Candidate submission failed" });

      // if corresponding agency job exist
      // Submit candidate here
      const candidates = req.body.candidates;
      let candidateData = [];

      for (let index = 0; index < candidates.length; index++) {
        // console.log("agencyJobExist >>>>>>>>>>>>>>>>>>> ", agencyJobExist);
        // console.log("candidates[index].email >>>>>>>>>>>>>>>>>>>>>>>>>>>> ", candidates[index].email)
        // Checking the candidate exist or not
        // const candidateExist = await CandidateModel.findOne({$and: [{email: candidates[index].email}]})
        const candidateExist = await CandidateModel.findOne({
          $and: [
            { job: agencyJobExist.job },
            {
              $or: [
                { email: candidates[index].email },
                { phone: candidates[index].phone },
              ],
            },
          ],
        });

        const candidateExist1 = await CandidateModel.findOne({
          $and: [
            { job: empJobExist?._id },
            {
              $or: [
                { email: candidates[index].email },
                { phone: candidates[index].phone },
              ],
            },
          ],
        });
        // console.log("candidateExist >>>>>>>>>>>>>>>>>>> ", candidateExist);
        // if candidate exist
        if (candidateExist)
          return res.status(400).send({
            error: true,
            message: `Candidate data already exist with this email ${candidateExist?.email}`,
          });

        if (candidateExist1)
          return res.status(400).send({
            error: true,
            message: `Candidate data already exist with this email ${candidateExist?.email}`,
          });

        candidates[index].agency = agencyJobExist.agency;
        candidates[index].recruiter = checkRecruiter?._id;
        // candidates[index].job = agencyJobExist.job
        candidates[index].job = empJobExist?._id;
        candidateData.push(candidates[index]);
      }

      // console.log("candidates >>>>>>>>>>>>", candidateData);
      const candidateDataResult = await CandidateModel.insertMany(
        candidateData
      );
      const candidatejobData = await CandidateJobModel.insertMany(
        candidateData
      );

      console.log({ candidatejobData });

      submitted_candidates_id = candidateDataResult.map((e) => e._id);
      const agencyJobUpdate = await AgencyJobModel.findOneAndUpdate(
        { _id: agencyJobExist._id },
        { $push: { candidates: submitted_candidates_id } },
        { new: true }
      );
      // console.log("agencyJobUpdate >>>>>>>>>>>> ", agencyJobUpdate);
      console.log({ candidateDataResult });

      if (candidateDataResult.length) {
        return res.status(201).send({
          error: false,
          message: "Candidate data submitted",
          data: candidateDataResult,
        });
      } else if (candidatejobData.length) {
        return res.status(201).send({
          error: false,
          message: "Candidate data submitted",
          data: candidatejobData,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Candidate submission failed",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * This method is used to update candidate status
   */
  statusUpdate: async (req, res, next) => {
    try {
      // Status update
      const candidateData = await CandidateModel.findOneAndUpdate(
        { _id: req.params.candidateId },
        { status: req.body.status },
        { new: true }
      );

      if (!candidateData)
        return res
          .status(400)
          .send({ error: true, message: "Candidate status is not updated" });

      return res
        .status(200)
        .send({ error: false, message: "Candidate status updated" });
    } catch (error) {
      next(error);
    }
  },

  /**
   * This method is used to upload candidate CV
   */
  resumeUpload: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      const checkRecruiter = await Recruiter.findOne({ _id: userId });
      if (
        (!checkAgency || !checkRecruiter) &&
        !["agency", "recruiters"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });

      if (req.file.mimetype != "application/pdf")
        return res
          .status(400)
          .send({ error: true, message: "Only pdf file is allowed." });

      const fileName = `HIRE2INSPIRE_${Date.now()}_${req.file.originalname}`;

      // const fileData = await app.locals.bucket
      // .file(fileName)
      // .createWriteStream()
      // .end(req.file.buffer);

      const fileData = await bucket
        .file(fileName)
        .createWriteStream()
        .end(req.file.buffer);

      fileurl = `https://firebasestorage.googleapis.com/v0/b/hire2inspire-62f96.appspot.com/o/${fileName}?alt=media`;

      // Status update
      const candidateData = await CandidateModel.findOneAndUpdate(
        { _id: req.params.candidateId },
        { resume: fileurl },
        { new: true }
      );

      if (!candidateData)
        return res
          .status(400)
          .send({ error: true, message: "Candidate resume not uploaded." });

      return res.status(200).send({
        error: false,
        message: "Candidate resume uploaded",
        data: candidateData,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * This method is to find all candidates
   */
  allCandidateWithFilter: async (req, res, next) => {
    try {
      // All candidate data
      let matchTry = {};
      matchTry["$and"] = [];
      var queriesArray = Object.entries(req.query);
      queriesArray.forEach((x) => {
        if (x[1] != "") {
          if (ObjectId.isValid(x[1])) {
            var z = { [x[0]]: { $eq: ObjectId(x[1]) } };
          } else {
            var z = { [x[0]]: { $regex: x[1], $options: "i" } };
          }
          matchTry.$and.push(z);
        }
      });

      const candidates = await CandidateModel.find(matchTry).sort({ _id: -1 });

      return res
        .status(200)
        .send({ error: false, message: "Candidate list", data: candidates });
    } catch (error) {
      next(error);
    }
  },

  /**
   * This method is used to fetch candidate details
   */
  details: async (req, res, next) => {
    try {
      const candidateDetail = await CandidateModel.findOne({
        _id: req.params.id,
      }).populate([
        {
          path: "job",
        },
        {
          path: "agency",
        },
        {
          path: "recruiter",
        },
      ]);
      if (!candidateDetail)
        return res
          .status(400)
          .send({ error: true, message: "Candidate not found" });
      return res.status(200).send({
        error: false,
        message: "Candidate data found",
        data: candidateDetail,
      });
    } catch (error) {
      next(error);
    }
  },

  requestUpdate: async (req, res, next) => {
    try {
      // Status update

      let updateFields = {
        request: req.body.request,
      };

      if (req.body.request == "5") {
        updateFields.noShow = true;
        updateFields.noShowDate = req.body.noShowDate;
        updateFields.noShowReason = req.body.noShowReason
      }

      if (req.body.request == "4") {
        if (!req.body.reasonReject) {
          return res
            .status(400)
            .send({ error: true, message: "Please Provide Reject Reason" });
        }
        updateFields.reasonReject = req.body.reasonReject;
        if (req.body.reasonReject == "other") {
          if (!req.body.otherReason) {
            return res
              .status(400)
              .send({
                error: true,
                message: "Please Provide Other Reason For Rejection",
              });
          }
          updateFields.otherReason = req.body.otherReason;
        }
      }

      let mailSent = false;

      if (req.body?.scheduleDate) {
        updateFields.scheduleDate = req.body.scheduleDate;
        mailSent = true;
      }

      if(req.body?.isScheduled && req.body?.request == "7") {
        updateFields.iScheduled == true
      }

      if(!req.body?.isScheduled && req.body?.request == "8" ) {
        updateFields.iScheduled == false
      }

      const candidateJobData = await CandidateJobModel.findOneAndUpdate(
        { candidate: req.params.candidateId },
        updateFields,
        { new: true }
      ).populate([
        {
          path: "candidate",
          select: "email fname lname",
        }])

        const candidateData = await CandidateModel.findOneAndUpdate(
          { _id: req.params.candidateId },
          { status: candidateJobData?.request , ...updateFields},
          { new: true }
        );

      let dateFormat = req.body?.scheduleDate && await formatDateTime(req.body?.scheduleDate)

      let fullname = `${candidateJobData?.candidate?.fname} ${candidateJobData?.candidate?.lname}`

      if (mailSent) {
        sgMail.setApiKey(process.env.SENDGRID);
        const msg = {
          to: candidateJobData?.candidate?.email, // Change to your recipient
          from: "info@hire2inspire.com",
          subject: `Interview Scheduled for ${fullname}`,
          html: `
          <head>
              <title>Welcome to Hire2Inspire</title>
          </head>
          <body>
          <p>Dear ${fullname},</p>
          <p>Greetings of the day , Your Interview is schedule on ${dateFormat?.formattedDate} at ${dateFormat?.formattedTime} </p>
          <p>Best of luck,</p>
          <p>Regards</p>
          <p>hire2Inspire</p>
          </body>`,
        }

        sgMail
          .send(msg)
          .then(() => {
            console.log("Email sent");
          })
          .catch((error) => {
            console.error(error);
          });
      }

      if (candidateJobData?.request == "1") {
        const jobData = await JobPosting.findOneAndUpdate(
          { _id: candidateJobData?.emp_job },
          { $inc: { reviewing_count: 1 } },
          { new: true }
        );
      } else if (candidateJobData?.request == "2") {
        const jobData = await JobPosting.findOneAndUpdate(
          { _id: candidateJobData?.emp_job },
          { $inc: { interviewin_count: 1 } },
          { new: true }
        );
      } else if (candidateJobData?.request == "3") {
        const jobData = await JobPosting.findOneAndUpdate(
          { _id: candidateJobData?.emp_job },
          { $inc: { offer_count: 1 } },
          { new: true }
        );
      }

      if (!candidateJobData)
        return res
          .status(400)
          .send({ error: true, message: "Candidate status is not updated" });

      return res
        .status(200)
        .send({ error: false, message: "Candidate status updated" });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const resData = await CandidateModel.find({ _id: req.params.id });
      // const result = await CandidateModel.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });

      const result = await CandidateModel.findOneAndUpdate(
        { _id: req.params.id },
        req.body,
        { new: true }
      ).populate([
        {
          path: "job",
          select: "",
        },
      ]);

      if (!result)
        return res
          .status(200)
          .send({ error: false, message: "Candidate not updated" });

      let candidateEmail = result?.email;
      let candidatefName = result?.fname;
      let candidatelName = result?.lname;

      let jobRole = result?.job?.job_name;

      console.log(result, "result");

      let jobId = result?.job;

      let companyName = result?.job?.comp_name;

      let candidateId = result?._id;

      if (result?.final_submit == false && result?.updated_by == "agency") {
        sgMail.setApiKey(process.env.SENDGRID);
        const msg = {
          to: candidateEmail, // Change to your recipient
          from: "info@hire2inspire.com",
          subject: `Subject: Confirmation of CV Resubmission for ${jobRole} - Next Steps`,
          html: `
                      <head>
                          <title>Notification: Candidate Hired - Backend Development Position</title>
                  </head>
                  <body>
                      <p>Dear ${candidatefName} ${candidatelName} ,</p>
                      <p>I hope this email finds you well. I am writing to confirm that we have received your application for the ${jobRole} at ${companyName}. We appreciate your interest in joining our team and taking the time to submit your CV. Your application is currently being reviewed by our recruitment team.</p>
      
                      <p>As we move forward in the selection process, we would like to gather some additional information from you. Please take a moment to answer the following screening questions. Your responses will help us better understand your qualifications and suitability for the role. Once we review your answers, we will determine the next steps in the process.</p>
      
                      <p>Find the link 
                      <a href="${process.env.front_url}/candidate/apply-job/${candidateId}" target="blank">Find your job</a>
                    </p>
      
                      <p>Regards,</p>
                      <p>Hire2Inspire</p>
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
      } else if (
        result?.final_submit == false &&
        resData?.email != result?.email &&
        resData?.phone != result?.phone &&
        result?.updated_by == "agency"
      ) {
        sgMail.setApiKey(process.env.SENDGRID);
        const new_msg = {
          to: candidateEmail, // Change to your recipient
          from: "info@hire2inspire.com",
          subject: `Subject: Confirmation of CV Submission for ${jobRole} - Next Steps`,
          html: `
                      <head>
                          <title>Notification: Candidate Hired - Backend Development Position</title>
                  </head>
                  <body>
                      <p>Dear ${candidatefName} ${candidatelName} ,</p>
                      <p>I hope this email finds you well. I am writing to confirm that we have received your application for the ${jobRole} at ${companyName}. We appreciate your interest in joining our team and taking the time to submit your CV. Your application is currently being reviewed by our recruitment team.</p>
      
                      <p>As we move forward in the selection process, we would like to gather some additional information from you. Please take a moment to answer the following screening questions. Your responses will help us better understand your qualifications and suitability for the role. Once we review your answers, we will determine the next steps in the process.</p>
      
                      <p>Find the link 
                      <a href="${process.env.front_url}/candidate/apply-job/${candidateId}" target="blank">Find your job</a>
                    </p>
      
                      <p>Regards,</p>
                      <p>Hire2Inspire</p>
                  </body>
              `,
        };

        sgMail
          .send(new_msg)
          .then(() => {
            console.log("Email sent");
          })
          .catch((error) => {
            console.error(error);
          });
      }

      let updatedData;
      if (result?.updated_by == "agency") {
        updatedData = await CandidateModel.findOneAndUpdate(
          { _id: req.params.id },
          { reSubmit: true },
          { new: true }
        );
      }

      return res.status(200).send({
        error: false,
        message: "Candidate Updated",
        data: result,
        updatedData,
      });
    } catch (error) {
      next(error);
    }
  },

  candidateJobUpdate: async (req, res, next) => {
    try {
      const candidateJobData = await CandidateJobModel.findOneAndUpdate(
        { candidate: req.params.candidateId },
        req.body,
        { new: true }
      ).populate([
        {
          path: "emp_job",
          select: "",
          populate: {
            path: "employer",
            select: "",
          },
        },
        {
          path: "agency_id",
          select: "",
        },
        {
          path: "candidate",
          select: "",
        },
      ]);

      if (candidateJobData?.final_submit == true) {
        const candidateDataUpdate = await CandidateModel.findOneAndUpdate(
          { _id: req.params.candidateId },
          { final_submit: true },
          { new: true }
        ).populate([
          {
            path: "agency",
            select: "",
          },
          {
            path: "job",
            select: "",
            populate: {
              path: "employer",
              select: "",
            },
          },
        ]);

        let agencyemail = candidateDataUpdate?.agency?.corporate_email;
        console.log({ agencyemail });
        let agencyName = candidateDataUpdate?.agency?.name;
        let empemail = candidateDataUpdate?.job?.employer?.email;
        console.log({ empemail });
        let candidateFName = candidateDataUpdate?.fname;
        let candidateLName = candidateDataUpdate?.lname;
        let jobName = candidateDataUpdate?.job?.job_name;

        sgMail.setApiKey(process.env.SENDGRID);
        const msg = {
          to: agencyemail, // Change to your recipient
          from: "info@hire2Inspire.com",
          subject: `FInal Response from ${candidateFName} ${candidateLName} for JoB name ${jobName}`,
          html: `
                      <body>
                      <p>Dear ${agencyName},</p>
                    
                      <p>I hope this email finds you well. I am writing to inform you that we have received the final response from the candidate you uploaded for the [Job Title] position.</p>
                    
                      <p>After a thorough evaluation process, including multiple rounds of interviews and assessments, we are pleased to share that the candidate has accepted our job offer. We believe that their skills and experience align perfectly with our requirements, and we are confident that they will be a valuable addition to our team.</p>
                    
                      <p>We appreciate your assistance in the recruitment process and would like to express our gratitude for presenting us with such a well-qualified candidate. Your professionalism and dedication to finding the right fit for our organization have not gone unnoticed.</p>
                    
                      <p>Please convey our congratulations to the candidate on their successful acceptance of the offer, and thank them for their commitment to joining our team.</p>
                    
                      <p>We look forward to a successful collaboration and appreciate the ongoing support from your agency.</p>
                    
                      <p>If you have any further questions or if there are additional steps we need to take, please feel free to reach out.</p>
                    
                      <p>Thank you again for your partnership.</p>
                    
                      <p>Regards</p>
                      <p>Hire2Inspire</p>
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

        sgMail.setApiKey(process.env.SENDGRID);
        const new_msg = {
          to: empemail, // Change to your recipient
          from: "info@hire2Inspire.com",
          subject: `FInal Response from ${candidateFName} ${candidateLName} for JoB name ${jobName}`,
          html: `
                        <body>
                        <p>Dear ${empemail},</p>
                      
                        <p>I hope this email finds you well. I am writing to inform you that we have received the final response from the candidate you uploaded for the [Job Title] position.</p>
                      
                        <p>After a thorough evaluation process, including multiple rounds of interviews and assessments, we are pleased to share that the candidate has accepted our job offer. We believe that their skills and experience align perfectly with our requirements, and we are confident that they will be a valuable addition to our team.</p>
                      
                        <p>We appreciate your assistance in the recruitment process and would like to express our gratitude for presenting us with such a well-qualified candidate. Your professionalism and dedication to finding the right fit for our organization have not gone unnoticed.</p>
                      
                        <p>Please convey our congratulations to the candidate on their successful acceptance of the offer, and thank them for their commitment to joining our team.</p>
                      
                        <p>We look forward to a successful collaboration and appreciate the ongoing support from your agency.</p>
                      
                        <p>If you have any further questions or if there are additional steps we need to take, please feel free to reach out.</p>
                      
                        <p>Thank you again for your partnership.</p>
                      
                        <p>Regards</p>
                        <p>Hire2Inspire</p>
                      </body>
                `,
        };

        sgMail
          .send(new_msg)
          .then(() => {
            console.log("Email sent");
          })
          .catch((error) => {
            console.error(error);
          });
      }

      if (candidateJobData?.screening_q_a.length != null) {
        const candidateUpdate = await CandidateModel.findOneAndUpdate(
          { _id: req.params.candidateId },
          { $push: { screening_q_a: candidateJobData?.screening_q_a } },
          { new: true }
        );
      }

      if (!candidateJobData)
        return res
          .status(400)
          .send({ error: true, message: "Candidate status is not updated" });

      return res
        .status(200)
        .send({ error: false, message: "Candidate status updated" });
    } catch (error) {
      next(error);
    }
  },

  candidateJobDetail: async (req, res, next) => {
    try {
      const result = await CandidateJobModel.findOne({
        candidate: req.params.candidateId,
      }).populate([
        {
          path: "emp_job",
          select: "",
          populate: {
            path: "employer",
            select: "",
          },
        },
        {
          path: "agency_id",
          select: "",
        },
        {
          path: "candidate",
          select: "",
        },
      ]);

      return res.status(200).send({
        error: false,
        message: "Detail of candidate job",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // BulkCandidate: async (req, res, next) => {
  //     try {
  //         let token = req.headers["authorization"]?.split(" ")[1];
  //         let { userId, dataModel } = await getUserViaToken(token);
  //         const checkAgency = await Agency.findOne({ _id: userId });
  //         const checkRecruiter = await Recruiter.findOne({ _id: userId });
  //         if (
  //             (!checkAgency || !checkRecruiter) &&
  //             !["agency", "recruiters"].includes(dataModel)
  //         ) return res.status(401).send({ error: true, message: "User unauthorized." })

  //         if (candidateDataResult.length) {
  //             return res.status(201).send({
  //                 error: false,
  //                 message: "Candidate data submitted",
  //                 data: candidateDataResult
  //             })
  //         }
  //         return res.status(400).send({
  //             error: true,
  //             message: "Candidate submission failed"
  //         })
  //     } catch (error) {
  //         next(error)
  //     }
  // },

  submitBulkCandidate: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      const checkRecruiter = await Recruiter.findOne({ _id: userId });
      if (
        (!checkAgency || !checkRecruiter) &&
        !["agency", "recruiters"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });

      // Checking the corresponding agency job exist or not
      const agencyJobExist = await AgencyJobModel.findOne({
        _id: req.body.agency_job,
      });

      const empJobExist = await JobPosting.findOne({ _id: req.body.job });

      // if corresponding agency job not exist
      if (!agencyJobExist)
        return res
          .status(400)
          .send({ error: true, message: "Candidate submission failed" });

      if (!empJobExist)
        return res
          .status(400)
          .send({ error: true, message: "Candidate submission failed" });

      // if corresponding agency job exist
      // Submit candidate here
      const candidates = req.body.candidates;
      let candidateData = [];

      for (let index = 0; index < candidates.length; index++) {
        const candidateExist = await CandidateModel.findOne({
          $and: [
            { job: agencyJobExist.job },
            {
              $or: [
                { email: candidates[index].email },
                { phone: candidates[index].phone },
              ],
            },
          ],
        });

        const candidateExist1 = await CandidateModel.findOne({
          $and: [
            { job: empJobExist?._id },
            {
              $or: [
                { email: candidates[index].email },
                { phone: candidates[index].phone },
              ],
            },
          ],
        });
        // console.log("candidateExist >>>>>>>>>>>>>>>>>>> ", candidateExist);
        // if candidate exist
        if (candidateExist)
          return res.status(400).send({
            error: true,
            message: `Candidate data already exist with this email ${candidateExist?.email}`,
          });

        if (candidateExist1)
          return res.status(400).send({
            error: true,
            message: `Candidate data already exist with this email ${candidateExist?.email}`,
          });

        candidates[index].agency = agencyJobExist.agency;
        candidates[index].recruiter = checkRecruiter?._id;
        // candidates[index].job = agencyJobExist.job
        candidates[index].job = empJobExist?._id;
        candidateData.push(candidates[index]);
      }

      // console.log("candidates >>>>>>>>>>>>", candidateData);
      const candidateDataResult = await CandidateModel.insertMany(
        candidateData
      );
      const candidatejobData = await CandidateJobModel.insertMany(
        candidateData
      );

      console.log({ candidatejobData });

      submitted_candidates_id = candidateDataResult.map((e) => e._id);
      const agencyJobUpdate = await AgencyJobModel.findOneAndUpdate(
        { _id: agencyJobExist._id },
        { $push: { candidates: submitted_candidates_id } },
        { new: true }
      );
      // console.log("agencyJobUpdate >>>>>>>>>>>> ", agencyJobUpdate);
      console.log({ candidateDataResult });

      if (candidateDataResult.length) {
        return res.status(201).send({
          error: false,
          message: "Candidate data submitted",
          data: candidateDataResult,
        });
      } else if (candidatejobData.length) {
        return res.status(201).send({
          error: false,
          message: "Candidate data submitted",
          data: candidatejobData,
        });
      }
      return res.status(400).send({
        error: true,
        message: "Candidate submission failed",
      });
    } catch (error) {
      next(error);
    }
  },

  /////// review list //////////

  reviewList: async (req, res, next) => {
    try {
      const result = await CandidateJobModel.find({
        agency_id: req.params.agencyId,
      })
        .populate([
          {
            path: "emp_job",
            select: "",
            populate: {
              path: "employer",
              select: "",
            },
          },
          {
            path: "agency_id",
            select: "",
          },
          {
            path: "candidate",
            select: "",
          },
        ])
        .sort({ _id: -1 });
      return res
        .status(200)
        .send({ error: false, message: "Candidate review data", data: result });
    } catch (error) {
      next(error);
    }
  },

  ///////// update in candidate job model for interview schedule by empolyer//////////

  interViewScheUpdate: async (req, res, next) => {
    try {
      let interviedDate = req.body.interview_date;
      let interviedStTime = req.body.interview_start_time;
      let interviedEdTime = req.body.interview_end_time;
      let information = req.body.info;
      const result = await CandidateJobModel.findOneAndUpdate(
        {
          _id: req.params.jobId,
        },
        {
          "interview_det.interview_date": interviedDate,
          "interview_det.interview_start_time": interviedStTime,
          "interview_det.interview_end_time": interviedEdTime,
          "interview_det.info": information,
        },
        { new: true }
      );

      const condidateUpdate = await CandidateModel.findOneAndUpdate(
        { _id: result?.candidate },
        {
          "interview_det.interview_date": interviedDate,
          "interview_det.interview_start_time": interviedStTime,
          "interview_det.interview_end_time": interviedEdTime,
          "interview_det.info": information,
        },
        { new: true }
      );

      let agencyemail = result?.agency_id?.corporate_email;
      let agencyName = result?.agency_id?.name;
      let candidateFName = result?.candidate?.fname;
      let candidateLName = result?.candidate?.lname;
      let jobName = result?.emp_job?.job_name;
      let empFName = result?.emp_job?.employer?.fname;
      let empLName = result?.emp_job?.employer?.lname;
      let interviewDate = result?.interview_det?.interview_date;
      let interviewSttime = result?.interview_det?.interview_start_time;
      let interviewentime = result?.interview_det?.interview_end_time;
      let info = result?.interview_det?.info;
      if (!result)
        return res
          .status(200)
          .send({ error: false, message: "Data not updated" });

      sgMail.setApiKey(process.env.SENDGRID);
      const msg = {
        to: agencyemail, // Change to your recipient
        from: "info@hire2Inspire.com",
        subject: `Update For Interview Schedule for JoB name ${jobName}`,
        html: `
          <body>
            <p>Dear ${agencyName},</p>
              <p>I hope this email finds you well. I am writing to update you on the progress of the candidate you uploaded for the ${jobName} position.</p>
              <p>We are pleased to inform you that the candidate has successfully navigated through our interview process and has now accepted our job offer. Below is the detailed schedule of the interviews and assessments that were conducted:</p>
              <ul>
                  <li><strong>Interview Date:${interviewDate} </strong></li>
                  <li><strong>Interview Start Time:${interviewSttime}</strong></li>
                  <li><strong>Interview End Time:${interviewentime}</strong></li>
                  <li><strong>Info:${info}</strong></li>
              </ul>
              <p>Each stage provided valuable insights into the candidate’s qualifications and suitability for our team. The comprehensive evaluation process ensured that we identified the best fit for our organization.</p>
              <p>We would appreciate it if you could convey our congratulations to the candidate on their successful acceptance of the offer. Their commitment to joining our team is greatly valued.</p>
              <p>Thank you for your continued support and professionalism in assisting with our recruitment efforts. Should you have any questions or require further information, please do not hesitate to contact us.</p>
              <p>Regards,</p>
              <p>${empFName} ${empLName}</p>
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

      return res.status(200).send({
        error: false,
        message: "Update successfully",
        data: { result, condidateUpdate },
      });
    } catch (error) {
      next(error);
    }
  },

  mailToCnadidate: async (req, res, next) => {
    try {
      const result = await CandidateJobModel.findOne({
        _id: req.params.jobId,
      });

      let agencyemail = result?.agency_id?.corporate_email;
      let agencyName = result?.agency_id?.name;
      let candidateFName = result?.candidate?.fname;
      let candidateLName = result?.candidate?.lname;
      let candidateEmail = result?.candidate?.email;
      let jobName = result?.emp_job?.job_name;
      let empFName = result?.emp_job?.employer?.fname;
      let empLName = result?.emp_job?.employer?.lname;
      let interviewDate = result?.interview_det?.interview_date;
      let interviewSttime = result?.interview_det?.interview_start_time;
      let interviewentime = result?.interview_det?.interview_end_time;
      let info = result?.interview_det?.info;

      sgMail.setApiKey(process.env.SENDGRID);
      const msg = {
        to: candidateEmail, // Change to your recipient
        from: "info@hire2Inspire.com",
        subject: `Update For Interview Schedule for JoB name ${jobName}`,
        html: `
          <body>
          <p>Dear ${candidateFName} ${candidateLName},</p>
          <p>I hope this email finds you well. We are excited to update you on your application for the ${jobName} position at our company.</p>
          <p>After carefully reviewing your profile and performance through our interview process, we are pleased to inform you that we would like to proceed with the next steps. Below is the schedule for your upcoming interviews and assessments:</p>
          <ul>
              <li><strong>Interview Date:</strong> ${interviewDate}</li>
              <li><strong>Interview Start Time:</strong> ${interviewSttime}</li>
              <li><strong>Interview End Time:</strong> ${interviewentime}</li>
              <li><strong>Additional Information:</strong> ${info}</li>
          </ul>
          <p>Each stage of the interview process will provide us with valuable insights into your qualifications and fit for our team. Please ensure that you are available for the scheduled time and be prepared for the discussions outlined.</p>
          <p>We appreciate your interest in joining our team and are looking forward to your participation in the interview process. Should you have any questions or require further clarification, please feel free to reach out to us.</p>
          <p>Thank you for considering a career with us. We are excited about the possibility of having you as a valuable addition to our organization.</p>
          <p>Regards,</p>
          <p>${agencyName}</p>
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

      return res
        .status(200)
        .send({ error: false, message: "Mail sent", data: result });
    } catch (error) {
      next(error);
    }
  },
};

async function formatDateTime(dateTimeString) {
  // Create a Date object from the input string
  const date = new Date(dateTimeString);

  let obj = {}
  
  // Extract day, month, and year
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  
  // Extract hours and minutes
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // Determine AM or PM
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // If hour is 0, set to 12
  
  // Construct the formatted date and time
  const formattedDate = `${day}/${month}/${year}`;
  const formattedTime = `${hours}:${minutes} ${ampm}`;
  obj.formattedDate = formattedDate
  obj.formattedTime = formattedTime
  
  return obj;
}


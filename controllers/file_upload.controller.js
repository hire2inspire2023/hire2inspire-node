const mongoose = require("mongoose");
const path = require('path')
// var admin = require("firebase-admin");
// var serviceAccount = require("../hire2inspire-firebase-adminsdk.json");
const express = require('express')
const app = express()
const config = require('../config/config')
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: process.env.FIREBASE_DATABASE_URL,
//     storageBucket: process.env.BUCKET_URL
// }, "default");
// app.locals.bucket = admin.storage().bucket()
const {bucket} = require('../config/fireBaseConfig')

const csv = require('csv-parser');
const fs = require('fs');
const Candidate = require("../models/candidate.model");
const AgencyJobModel = require("../models/agency_job.model");
const Agency = require("../models/agency.model");
const { getUserViaToken } = require("../helpers/jwt_helper");
const Recruiter = require("../models/recruiter.model");
const CandidateJobModel = require('../models/candidate_job.model');
const sgMail = require('@sendgrid/mail');

module.exports = {
  /**
   * Basic file upload
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  upload: async (req, res, next) => {
    try {
      const fileName = `HIRE2INSPIRE_${Date.now()}_${req.file.originalname}`;
      // const fileData = await app.locals.bucket.file(fileName).createWriteStream().end(req.file.buffer);
      const fileData = await bucket
        .file(fileName)
        .createWriteStream()
        .end(req.file.buffer);

      fileurl = `https://firebasestorage.googleapis.com/v0/b/hire2inspire-62f96.appspot.com/o/${fileName}?alt=media`;

      res.status(200).send({
        error: false,
        // data: {file: req.file, fileData, fileName, fileurl}
        data: { fileName, fileurl },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * This method is used import CSV file to database
   */
  // saveCsvToDB: async(req, res, next) => {
  //     try {
  //         let token = req.headers["authorization"]?.split(" ")[1];
  //         let { userId, dataModel } = await getUserViaToken(token);
  //         const checkAgency = await Agency.findOne({ _id: userId });
  //         const checkRecruiter = await Recruiter.findOne({ _id: userId });
  //         if (
  //             (!checkAgency || !checkRecruiter) &&
  //             !["agency", "recruiters"].includes(dataModel)
  //         ) return res.status(401).send({ error: true, message: "User unauthorized." })

  //         const results = [];
  //         if(!req?.file || req.file?.mimetype != 'text/csv') return res.status(400).send({error: true, message: "Only CSV file is allowed to upload."})

  //         const fileName = `HIRE2INSPIRE_${Date.now()}_${req.file.originalname}`
  //         fs.writeFile(fileName, Buffer.from(req.file.buffer, req.file.encoding).toString(), (err) => {
  //             if(err) return res.status(400).send({error: true, 'message': String(err)});
  //         });

  //         const agencyJobDetail = await AgencyJobModel.findOne({_id: req.body.agency_job})

  //         fs.createReadStream(fileName, 'utf8')
  //         .pipe(csv({}))
  //         .on('data',(data) => results.push(data))
  //         .on('end', async() => {
  //             let resp;
  //             if (req.params.csvType == 'bulk-candidate') {
  //               //  console.log("ajob", req.body.agency_job)
  //                 results.map((e)=>{
  //                     e.agency_job = req.body.agency_job;
  //                 })

  //                 // results.map(e => {
  //                 //     // e.agency_job = req.body.agency_job;
  //                 //     // e.agency = agencyJobDetail?.agency || undefined;
  //                 //     // e.job = agencyJobDetail?.job || undefined;
  //                 //     // e.recruiter = checkRecruiter?._id || undefined;

  //                 //     // e.must_have_qualification_q_a = [];
  //                 //     // e.must_have_qualification_questions = e.must_have_qualification_questions.split("|").map(e1 => e1.trim())
  //                 //     // e.must_have_qualification_answers = e.must_have_qualification_answers.split("|").map(e => e.trim())
  //                 //     // e.must_have_qualification_questions.forEach((ele, index) => {
  //                 //     //     e.must_have_qualification_q_a.push({
  //                 //     //         question: ele,
  //                 //     //         answer: e.must_have_qualification_answers[index]
  //                 //     //     })
  //                 //     // })
  //                 //     // e.must_have_qualification_answers = undefined
  //                 //     // e.must_have_qualification_questions = undefined

  //                 //     return e;
  //                 // })

  //                 // removing temporary CSV file
  //                 fs.unlink(fileName, (err) => {
  //                     if (err) {
  //                         console.error(err)
  //                         next(err)
  //                     }
  //                 })

  //                 // const checkdata = await Candidate.findOne({
  //                 //     $and: [
  //                 //         { agency_job: req.body.agency_job },
  //                 //         {
  //                 //             email: {
  //                 //                 $in: emails
  //                 //             }
  //                 //         },
  //                 //         {
  //                 //             phone: {
  //                 //                 $in: phones
  //                 //             }
  //                 //         },
  //                 //     ]
  //                 // })
  //                // console.log({results})

  //                let candidateExist ;
  //                let candidateExist1;

  //                 for(let i = 0 ; i<results.length ; i++){
  //                     // console.log(results[i]?.email)
  //                     candidateExist = await Candidate.findOne({$and:[{email:results[i]?.email},{agency_job:req.body.agency_job}]});
  //                     candidateExist1 = await Candidate.findOne({$and:[{phone:results[i]?.phone},{agency_job:req.body.agency_job}]});
  //                 }

  //                // console.log(candidateExist,"res")
  //                 // console.log(candidateExist?.agency_job)
  //                 // console.log(req.body.agency_job)

  //                 // const candidateExist = await Candidate.findOne({email:e.email});
  //                 // console.log(candidateExist)
  //                 // // const candidateExist1 = await Candidate.findOne({phone:req.body.phone});
  //                 // // console.log(candidateExist)

  //                 if(candidateExist){
  //                     console.log('in..')
  //                     return res.status(400).send({ error: true, message: `Candidate data already exist with this email ${candidateExist?.email}` })
  //                 }
  //                 else if(candidateExist1){
  //                     return res.status(400).send({ error: true, message: `Candidate data already exist with this phone no ${candidateExist1?.phone}` })
  //                 }
  //                 // if(checkdata) return res.status(400).send({error: true, message: `Candidate already exist`})

  //                 // Candidate log CSV Uppload
  //                 resp = await Candidate.insertMany(results);
  //                 const candidateIds = resp.map( e => e._id );

  //                 console.log("resp",resp)

  //                 for(let i in resp){
  //                     req.body.emp_job = resp[i]?.job?._id;
  //                     req.body.agency_id = resp[i]?.agency?._id;
  //                     req.body.candidate = resp[i]?._id;
  //                     console.log("resp",resp[i]?.agency?._id)
  //                 };

  //                 conadidateJobData = await CandidateJobModel.insertMany(req.body);

  //                 console.log({conadidateJobData})

  //                 const agencyJobUpdate = await AgencyJobModel.findOneAndUpdate({_id: req.body.agency_job}, {$push: {candidates: candidateIds}}, {new: true})
  //                 // console.log("agencyJobUpdate >>> ", agencyJobUpdate);

  //             } else {
  //                 return res.status(400).send({
  //                     error: true,
  //                     message: `${req.params.csvType} type not valid one. Use (bulk-candidate / single-candidate)`
  //                 })
  //             }

  //             return res.status(201).send({
  //                 error: false,
  //                 message: `${req.params.csvType} Data stored`,
  //                 data: results
  //             })
  //         })
  //     } catch (error) {
  //         // throw error
  //         res.status(200).send({
  //             error: true,
  //             message: String(error)
  //         });
  //     }
  // },

  // saveCsvToDB: async(req, res, next) => {
  //     try {
  //         let token = req.headers["authorization"]?.split(" ")[1];
  //         let { userId, dataModel } = await getUserViaToken(token);
  //         const checkAgency = await Agency.findOne({ _id: userId });
  //         const checkRecruiter = await Recruiter.findOne({ _id: userId });
  //         if (
  //             (!checkAgency || !checkRecruiter) &&
  //             !["agency", "recruiters"].includes(dataModel)
  //         ) return res.status(401).send({ error: true, message: "User unauthorized." })

  //         const results = [];
  //         if(!req?.file || req.file?.mimetype != 'text/csv') return res.status(400).send({error: true, message: "Only CSV file is allowed to upload."})

  //         const fileName = `HIRE2INSPIRE_${Date.now()}_${req.file.originalname}`
  //         fs.writeFile(fileName, Buffer.from(req.file.buffer, req.file.encoding).toString(), (err) => {
  //             if(err) return res.status(400).send({error: true, 'message': String(err)});
  //         });

  //         const agencyJobDetail = await AgencyJobModel.findOne({_id: req.body.agency_job})

  //         fs.createReadStream(fileName, 'utf8')
  //         .pipe(csv({}))
  //         .on('data',(data) => results.push(data))
  //         .on('end', async() => {
  //             let resp;
  //             if (req.params.csvType == 'bulk-candidate') {
  //                console.log("ajob", req.body.agency_job)
  //                 results.map((e)=>{
  //                     e.agency_job = req.body.agency_job;
  //                     e.job = req.body.job;
  //                     e.agency = req.body.agency;
  //                 });

  //                 console.log({results})

  //                 // removing temporary CSV file
  //                 fs.unlink(fileName, (err) => {
  //                     if (err) {
  //                         console.error(err)
  //                         next(err)
  //                     }
  //                 })

  //                let candidateExist ;
  //                let candidateExist1;

  //                 for(let i = 0 ; i<results.length ; i++){
  //                     candidateExist = await Candidate.findOne({$and:[{email:results[i]?.email},{agency_job:req.body.agency_job}]});
  //                     candidateExist1 = await Candidate.findOne({$and:[{phone:results[i]?.phone},{agency_job:req.body.agency_job}]});
  //                 }

  //                 if(candidateExist){
  //                     console.log('in..')
  //                     return res.status(400).send({ error: true, message: `Candidate data already exist with this email ${candidateExist?.email}` })
  //                 }
  //                 else if(candidateExist1){
  //                     return res.status(400).send({ error: true, message: `Candidate data already exist with this phone no ${candidateExist1?.phone}` })
  //                 }

  //                 // Candidate log CSV Uppload
  //                 resp = await Candidate.insertMany(results);
  //                 const candidateIds = resp.map( e => e._id );
  //                 const candidateEmails = resp.map( e => e.email );

  //                // console.log("candidateIds",candidateIds)

  //                 for(let i in resp){
  //                     let Emp_job = resp[i]?.job?._id;
  //                     let Agency_id = resp[i]?.agency?._id;
  //                     let Candidate = resp[i]?._id;
  //                    console.log("Emp_job",Emp_job);

  //                     const candidateJobData = new CandidateJobModel({emp_job:Emp_job,candidate:Candidate,agency_id:Agency_id});
  //                     const condidateJobdatalist = await candidateJobData.save();
  //                 };

  //                 const agencyJobUpdate = await AgencyJobModel.findOneAndUpdate({_id: req.body.agency_job}, {$push: {candidates: candidateIds}}, {new: true})

  //                 sgMail.setApiKey(process.env.SENDGRID)
  //                 const msg = {
  //                     to: candidateEmails, // Change to your recipient
  //                     from: 'info@hire2inspire.com',
  //                     subject: `Your Talent Spark: Ignite Opportunity with ${companyName}`,
  //                     html: `
  //                            <head>
  //                                <title>Notification: Candidate Hired - Backend Development Position</title>
  //                        </head>
  //                        <body>
  //                            <p>Dear Candidates ,</p>
  //                            <p>I hope this email finds you well. I am writing to confirm that we have received your application for the ${jobRole} at ${companyName}. We appreciate your interest in joining our team and taking the time to submit your CV. Your application is currently being reviewed by our recruitment team.</p>

  //                            <p>As we move forward in the selection process, we would like to gather some additional information from you. Please take a moment to answer the following screening questions. Your responses will help us better understand your qualifications and suitability for the role. Once we review your answers, we will determine the next steps in the process.</p>

  //                            <p>Find the link
  //                            <a href="${process.env.front_url}/candidate/apply-job/${candidateId}" target="blank">Find your job</a>
  //                          </p>

  //                            <p>Best regards,</p>
  //                            <p>Hire2Inspire</p>
  //                        </body>
  //                    `
  //                 }

  //                 sgMail
  //                     .sendMultiple(msg)
  //                     .then(() => {
  //                         console.log('Email sent')
  //                     })
  //                     .catch((error) => {
  //                         console.error(error)
  //                     })

  //                     sgMail.setApiKey(process.env.SENDGRID)
  //                     const newmsg = {
  //                         to: empMail, // Change to your recipient
  //                         from: 'info@hire2inspire.com',
  //                         subject: `Your Talent Spark: Ignite Opportunity with ${companyName}`,
  //                         html: `
  //                         <head>
  //                             <title>Application for ${jobRole} - ${jobIDS}</title>
  //                         </head>
  //                         <body>
  //                             <p>Dear ${empFname} ${empLname},</p>
  //                             <p>I hope this email finds you well. I am writing to express my strong interest in the ${jobRole} position at ${companyName}, as advertised where you found the job posting.</p>
  //                             <p>What particularly drew me to this opportunity at ${companyName} is mention something specific about the company that resonates with you. I am eager to be a part of a team that is describe what excites you about the company or its culture.</p>
  //                             <p>I am impressed by ${companyName}'s commitment to mention any specific initiatives, values, or projects mentioned by the company. I am eager to bring my mention specific skills or experiences to the team and contribute to ${companyName}'s continued success.</p>
  //                             <p>Thank you for considering my application. I have attached my resume for your review. I am available for an interview at your earliest convenience and look forward to the opportunity to discuss how my skills and experiences align with the needs of ${companyName}.</p>
  //                             <p>Warm regards,</p>
  //                             <p>Hire2Inspires</p>
  //                         </body>
  //                        `
  //                     }

  //                     sgMail
  //                         .send(newmsg)
  //                         .then(() => {
  //                             console.log('Email sent')
  //                         })
  //                         .catch((error) => {
  //                             console.error(error)
  //                         })

  //             } else {
  //                 return res.status(400).send({
  //                     error: true,
  //                     message: `${req.params.csvType} type not valid one. Use (bulk-candidate / single-candidate)`
  //                 })
  //             }

  //             return res.status(201).send({
  //                 error: false,
  //                 message: `${req.params.csvType} Data stored`,
  //                 data: results
  //             })
  //         })
  //     } catch (error) {
  //         // throw error
  //         res.status(200).send({
  //             error: true,
  //             message: String(error)
  //         });
  //     }
  // }

  saveCsvToDB: async (req, res, next) => {
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

      const results = [];
      const expectedHeaders = [
        "First Name*",
        "Last Name*",
        "Phone Number*",
        "Email*",
        "Country",
        "City",
        "State",
        "Pin Code",
        "Linkedin Url",
        "Current Ctc(In lakhs)",
        "Expected Ctc(In lakhs)",
        "Notice Period(In Days)",
        "Negotiable(In Days)",
        "Total Experience(In Number)",
        "Relevant Experience(In Number)",
      ];
      const headers = [];

      const fileName = `HIRE2INSPIRE_${Date.now()}_${req.file.originalname}`;
      fs.writeFile(
        fileName,
        Buffer.from(req.file.buffer, req.file.encoding).toString(),
        (err) => {
          if (err)
            return res.status(400).send({ error: true, message: String(err) });
        }
      );

      fs.createReadStream(fileName, "utf8")
        .pipe(csv({}))
        .on("data", (data) => results.push(data))
        .on("headers", (csvHeaders) => {
          headers.push(...csvHeaders);
        })
        .on("end", async () => {
          let resp;
          let filterResult = [];
          if (req.params.csvType == "bulk-candidate") {

            const isValidHeaders = expectedHeaders.every((header) =>
              headers.includes(header)
            );

            if (!isValidHeaders) {
              await fs.promises.unlink(fileName); // Clean up temporary file
              return res
                .status(400)
                .send({ error: true, message: "Invalid CSV headers." });
            }

            const agencyJobExist = await AgencyJobModel.findOne({
              _id: req.body.agency_job,
            });
      
            // if corresponding agency job not exist
            if (!agencyJobExist)
              return res
                .status(400)
                .send({ error: true, message: "AGgency job does not exist" });

            results.map((e) => {
              e.agency_job = agencyJobExist?._id;
              e.job = agencyJobExist?.job;
              e.agency = agencyJobExist?.agency;
              e.fname = e["First Name*"];
              (e.lname = e["Last Name*"]),
                (e.phone = e["Phone Number*"]),
                (e.email = e["Email*"]),
                (e.country = e["Country"]),
                (e.city = e["City"]),
                (e.state = e["State"]),
                (e.pin = e["Pin Code"]),
                (e.linkedin_url = e["Linkedin Url"]),
                (e.current_CTC = e["Current Ctc(In lakhs)"]),
                (e.expected_CTC = e["Expected Ctc(In lakhs)"]),
                (e.notice_period = e["Notice Period(In Days)"]),
                (e.negotiable_upto = e["Negotiable(In Days)"]),
                (e.total_experience = e["Total Experience(In Number)"]),
                (e.relevant_experience = e["Relevant Experience(In Number)"]);
            });

            // If firstname , lastname , phone , email is not empty then only insert row
            filterResult = results.filter(
              (entry) =>
                entry.fname && entry.lname && entry.phone && entry.email
            );

            // removing temporary CSV file
            fs.unlink(fileName, (err) => {
              if (err) {
                console.error(err);
                next(err);
              }
            });

            let candidateExist;
            let candidateExist1;

            for (let i = 0; i < filterResult.length; i++) {
              candidateExist = await Candidate.findOne({
                $and: [
                  { email: filterResult[i]?.email },
                  { agency_job: req.body.agency_job },
                ],
              });
              candidateExist1 = await Candidate.findOne({
                $and: [
                  { phone: filterResult[i]?.phone },
                  { agency_job: req.body.agency_job },
                ],
              });
            }

            if (candidateExist) {
              console.log("in..");
              return res.status(400).send({
                error: true,
                message: `Candidate data already exist with this email ${candidateExist?.email}`,
              });
            } else if (candidateExist1) {
              return res.status(400).send({
                error: true,
                message: `Candidate data already exist with this phone no ${candidateExist1?.phone}`,
              });
            }

            // Candidate log CSV Uppload
            resp = await Candidate.insertMany(filterResult);
            const candidateIds = resp.map((e) => e._id);
            const candidateEmails = resp.map((e) => e.email);

            for (let i in resp) {

              const candidateJobData = new CandidateJobModel({
                emp_job: resp[i]?.job,
                candidate: resp[i]?._id,
                agency_id: resp[i]?.agency,
              });

              const candidateJobId = await candidateJobData.save();

              const condidateJobdatalist = await CandidateJobModel
                .findOne({
                  _id: candidateJobId?._id
                })
                .populate([
                  {
                    path: "emp_job",
                    select: "comp_name job_name",
                    populate: {
                      path: "employer",
                      select: "email",
                    },
                  },
                ]); 

              let companyName = condidateJobdatalist?.emp_job?.comp_name;
              let jobRole = condidateJobdatalist?.emp_job?.job_name;
              let empMail = condidateJobdatalist?.emp_job?.employer?.email;

              sgMail.setApiKey(process.env.SENDGRID);
              const msg = {
                cc: empMail,
                to: resp[i].email, // Change to your recipient
                from: 'info@hire2inspire.com',
                subject: `Your Talent Spark: Ignite Opportunity with ${companyName}`,
                html: `
                                 <head>
                                     <title>Notification: Candidate Hired - Backend Development Position</title>
                             </head>
                             <body>
                                 <p>Dear Candidates ,</p>
                                 <p>I hope this email finds you well. I am writing to confirm that we have received your application for the ${jobRole} at ${companyName}. We appreciate your interest in joining our team and taking the time to submit your CV. Your application is currently being reviewed by our recruitment team.</p>
                 
                                 <p>As we move forward in the selection process, we would like to gather some additional information from you. Please take a moment to answer the following screening questions. Your responses will help us better understand your qualifications and suitability for the role. Once we review your answers, we will determine the next steps in the process.</p>
                 
                                 <p>Find the link 
                                 <a href="${process.env.front_url}/candidate/apply-job/${condidateJobdatalist.Candidate}" target="blank">Find your job</a>
                               </p>
                 
                                 <p>Best regards,</p>
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

            }

            const agencyJobUpdate = await AgencyJobModel.findOneAndUpdate(
              { _id: req.body.agency_job },
              { $push: { candidates: candidateIds } },
              { new: true }
            );
          } else {
            return res.status(400).send({
              error: true,
              message: `${req.params.csvType} type not valid one. Use (bulk-candidate / single-candidate)`,
            });
          }

          return res.status(201).send({
            error: false,
            message: `${req.params.csvType} Data stored`,
            data: filterResult,
          });
        });
    } catch (error) {
      // throw error
      res.status(200).send({
        error: true,
        message: String(error),
      });
    }
  },
};
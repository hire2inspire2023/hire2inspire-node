const createError = require("http-errors");
const Agency = require("../models/agency.model");
const Employer = require("../models/employer.model");
const {
  recruiterLoginSchema,
  recruiterChangePasswordSchema,
} = require("../validators/validation_schema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getUserViaToken,
} = require("../helpers/jwt_helper");
const bcrypt = require("bcrypt");
const RecruiterModel = require("../models/recruiter.model");
const Admin = require('../models/admin.model')
const { v4: uuidv4 } = require("uuid");

const nodemailer = require("nodemailer");

const sgMail = require('@sendgrid/mail');

// var transport = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_NAME,
//     pass: process.env.EMAIL_PASSWORD
//   },
//   requireTLS: true,
// });


module.exports = {
  login: async (req, res, next) => {
    try {
      const result = await recruiterLoginSchema.validateAsync(req.body);
      let recruiterData = await RecruiterModel.findOne({
        email: result.email,
        status: true,
      }).populate([
        {
          path:"agency",
          select:""
        }
      ]);
      if (!recruiterData)
        throw createError.NotFound("recruiter not registered");

      if (recruiterData?.is_loggedIn == true)throw createError.NotFound("You are already logged in");

      const isMatch = await recruiterData.isValidPassword(result.password);
      if (!isMatch) throw createError.BadRequest("Password not valid");

      const updatedRecruiter = await RecruiterModel.findOneAndUpdate({_id:recruiterData.id},{"is_loggedIn":true},{new:true});

      const accessToken = await signAccessToken(recruiterData.id, "recruiters");
      const refreshToken = await signRefreshToken(
        recruiterData.id,
        "recruiters"
      );

      recruiterData.password = undefined;
      recruiterData.confirm_password = undefined;
      recruiterData.otp = undefined;

      if (recruiterData.invitation_status == 0) {
        recruiterData = await RecruiterModel.findOneAndUpdate(
          { email: result.email },
          { invitation_status: 1, accepted_on: Date.now() },
          { new: true }
        );
      }

      return res.status(200).send({
        error: false,
        message: "Recruiter logged in",
        data: {
          accessToken,
          refreshToken,
        },
        user: recruiterData,
        updatedRecruiter
      });
    } catch (error) {
      if (error.isJoi === true)
        return next(createError.BadRequest("Invalid Email/Password"));
      next(error);
    }
  },

  addByAgency: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      console.log("{ userId, dataModel } >>> ", { userId, dataModel });
      const checkAgency = await Agency.findOne({ _id: userId });
      let agencyName = checkAgency?.name;
      if (!checkAgency && dataModel != "agency")
        return res
          .status(401)
          .send({ error: true, message: "User unauthorize." });

      const emails = req.body.email;

      const data = [];

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("secret", salt);

      for (let index = 0; index < emails.length; index++) {
        const checkInvitation = await RecruiterModel.findOne({
          agency: userId,
          email: emails[index],
        });
        if (checkInvitation)
          return res
            .status(200)
            .send({
              error: true,
              message: `${emails[index]} is already invited as a recruiter`,
            });
        data.push({
          email: emails[index],
          password: hashedPassword,
          agency: userId,
          token: uuidv4(),
        });
      }

      const recruiterInvite = await RecruiterModel.insertMany(data);
      const invitedRecruiters = await RecruiterModel.find({
        agency: userId,
      }).select("-otp -password").sort({ _id: -1 });

      // const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID)
      console.log(emails, 'emails')

      const msg = {
        to: emails, // replace these with your email addresses
        from: 'info@hire2inspire.com',
        subject: `Welcome Onboard-Leverage Intelligence with H2I Marketplace`,
        html: `
        <head>
            <title>Welcome to Hire2Inspire</title>
        </head>
    <body>
    <p>Dear Recruiter,</p>

    <p>
        I hope this message finds you well. We're thrilled to extend a warm and exclusive invitation to your esteemed recruiter
        to become a part of the Hire2inspire platform - a dynamic community dedicated to connecting exceptional agencies with
        clients seeking top-notch services.
    </p>

    <p>
        At Hire2inspire, we believe in the power of collaboration and innovation, and we see your recruiter as a perfect fit for
        our community. We are impressed by your talents and capabilities, and we are confident that your involvement will
        greatly enrich our platform.
    </p>

    <p>
        To start this exciting journey, all you need to do is click the link below to create your recruiter's profile on our
        platform. The onboarding process is designed to be straightforward, and our support team is available to assist you at
        every step.
    </p>
    <p>Find the link 
    <a href="http://hire2inspire.com/recruiter/login" target="blank">Registration Link</a>
  </p>
  <p>
   password: secret
</p>
        <p>Thank you and best regards,</p>
        <p> Hire2Inspire </p>
    </body>
`
      };

      sgMail.sendMultiple(msg).then(() => {
        console.log('emails sent successfully!');
      }).catch(error => {
        console.log(error);
      });

      let adminData = await Admin.findOne({});

      let adminName = adminData?.name;


    //  const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID);
     // console.log(emails, 'emails')

      const new_msg = {
        to: "hire2inspireh2i@gmail.com", // replace these with your email addresses
        from: 'info@hire2inspire.com',
        subject: `Notification for Agency-Recruiter Invitation`,
        html: `
        <head>
            <title>Notification for Agency-Recruiter Invitation</title>
        </head>
    <body>
    <body>
        <p>Dear ${adminName},</p>
        <p>I hope this email finds you well. I'm reaching out to provide a consolidated list of invitation emails sent by recruiters who have been invited by agency ${agencyName}. Below, you'll find a summary of the invitations along with relevant details:
        emails are ${emails}</p>
        <p>Please review the invitations and their statuses. Let me know if there are any discrepancies or if further action is required from my end.</p>
        <p>Thank you for your attention to this matter.</p>
        <p>Best regards,<br>
        Hire2Inspire</p>
    </body>
`
      };

      sgMail.send(new_msg).then(() => {
        console.log('emails sent successfully!');
      }).catch(error => {
        console.log(error);
      });




      //       var mailOptions = {
      //         from: 'Info@hire2inspire.com',
      //         subject: `Recruiter Invitation`,
      //         html:`
      //         <head>
      //             <title>Welcome to Hire2Inspire</title>
      //         </head>
      //     <body>
      //     <p>Dear Recruiter,</p>

      //     <p>
      //         I hope this message finds you well. We're thrilled to extend a warm and exclusive invitation to your esteemed recruiter
      //         to become a part of the Hire2inspire platform - a dynamic community dedicated to connecting exceptional agencies with
      //         clients seeking top-notch services.
      //     </p>

      //     <p>
      //         At Hire2inspire, we believe in the power of collaboration and innovation, and we see your recruiter as a perfect fit for
      //         our community. We are impressed by your talents and capabilities, and we are confident that your involvement will
      //         greatly enrich our platform.
      //     </p>

      //     <p>
      //         To start this exciting journey, all you need to do is click the link below to create your recruiter's profile on our
      //         platform. The onboarding process is designed to be straightforward, and our support team is available to assist you at
      //         every step.
      //     </p>
      //     <p>Find the link 
      //     <a href="https://hire2inspire-dev.netlify.app/recruiter/login" target="blank">Registration Link</a>
      //   </p>
      //   <p>
      //    password: secret
      // </p>
      //         <p>Thank you and best regards,</p>
      //         <p> Hire2Inspire </p>
      //     </body>
      // `
      // }; 


      // data.forEach((recipient) => {
      //   mailOptions.to = recipient?.email;

      //   transport.sendMail(mailOptions, (error, info) => {
      //     if (error) {
      //       console.error(`Error sending email to ${recipient}: ${error}`);
      //     } else {
      //       console.log(`Email sent to ${recipient?.email}: ${info.response}`);
      //     }
      //   });
      // });

      return res.status(200).send({
        error: false,
        message: "Invitation sent successfully",
        invitation_links: recruiterInvite.map((e) => {
          return { [e.email]: `${req.body.callback}?token=${e.token}` };
        }),
        invitedRecruiters: invitedRecruiters
      });
    } catch (error) {
      next(error);
    }
  },

  detail: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      const checkRecruiter = await RecruiterModel.findOne({ _id: userId }).populate([
        {
          path:"agency",
          select:""
        }
      ]);
      if (
        (!checkAgency || !checkRecruiter) &&
        !["agency", "recruiters"].includes(dataModel)
      )
        return res
          .status(401)
          .send({ error: true, message: "User Unauthorized" });

      const recruiterData = await RecruiterModel.findOne({
        _id: req.params.id,
      }).select("-password -otp").populate([
        {
          path:"agency",
          select:""
        }
      ]);

      return res.status(200).send({
        error: false,
        message: "Recruiter detail found",
        data: recruiterData,
      });
    } catch (error) {
      next(error);
    }
  },

  statusUpdate: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      if (!checkAgency && !["agency"].includes(dataModel))
        return res
          .status(400)
          .send({ error: true, message: "User Unauthorized" });

      const recruiterData = await RecruiterModel.findOneAndUpdate(
        { _id: req.params.id },
        { status: req.body.status },
        { new: true }
      );

      if (recruiterData) {
        return res.status(200).send({
          error: false,
          message: "Recruiter status updated.",
        });
      } else {
        return res.status(400).send({
          error: true,
          message: "Recruiter status not updated.",
        });
      }
    } catch (error) {
      next(error);
    }
  },

  list: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      if (!checkAgency && !["agency"].includes(dataModel))
        return res
          .status(400)
          .send({ error: true, message: "User Unauthorized" });

      const recruiterData = await RecruiterModel.find({ agency: userId }).select(
        "-password -otp"
      );

      return res.status(200).send({
        error: false,
        message: "Recruiter list found",
        data: recruiterData,
      });
    } catch (error) {
      next(error);
    }
  },
  //////////////////////// list of recruiter by emp /////////////////////////
  empReqlist: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkemp = await Employer.findOne({ _id: userId });
      if (!checkemp && !["employer"].includes(dataModel))
        return res
          .status(400)
          .send({ error: true, message: "User Unauthorized" });

      const recruiterData = await RecruiterModel.find({ employer: userId })

      return res.status(200).send({
        error: false,
        message: "Recruiter list found",
        data: recruiterData,
      });
    } catch (error) {
      next(error);
    }
  },

  //////////////////////// list of recruiter by emp /////////////////////////

  addByEmp: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkEmp = await Employer.findOne({ _id: userId });
      let empFName = checkEmp?.fname;
      let empLName = checkEmp?.lname;
      if (!checkEmp && dataModel != "employer")
        return res
          .status(401)
          .send({ error: true, message: "User unauthorize." });

      const emails = req.body.email;

      const data = [];

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("secret", salt);

      for (let index = 0; index < emails.length; index++) {
        const checkInvitation = await RecruiterModel.findOne({
          $and: [
            { employer: userId },
            { email: emails[index] }
          ]
        });
        if (checkInvitation)
          return res
            .status(200)
            .send({
              error: true,
              message: `${emails[index]} already invited as a recruiter`,
            });
        data.push({
          email: emails[index],
          password: hashedPassword,
          employer: userId,
          token: uuidv4(),
        });
      }

      // Recruiter_issue

      for (let j = 0 ; j < data.length ; j++) {
        let createEmployerr = {
          status: checkEmp?.status,
          isDeleted: checkEmp?.isDeleted,
          verified: checkEmp?.verified,
          type : checkEmp?.type,
          email: data[j]?.email,
          password: data[j]?.password,
          comp_name : checkEmp?.comp_name,
          recruiter_id : userId || ""
        }
        await Employer.insertMany(createEmployerr);
      }

      const recruiterInvite = await RecruiterModel.insertMany(data);
      const invitedRecruiters = await RecruiterModel.find({
        employer: userId,
      }).select("-otp -password").sort({ _id: -1 });

      console.log({ recruiterInvite });
      console.log({ invitedRecruiters });
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID)
      console.log(emails, 'emails')

      const msg = {
        to: emails, // replace these with your email addresses
        from: 'info@hire2inspire.com',
        subject: `Welcome Onboard-Leverage Intelligence with H2I Marketplace`,
        html: `
        <head>
            <title>Welcome to Hire2Inspire</title>
        </head>
    <body>
    <p>Dear Recruiter,</p>

    <p>
        I hope this message finds you well. We're thrilled to extend a warm and exclusive invitation to your esteemed recruiter
        to become a part of the Hire2inspire platform - a dynamic community dedicated to connecting exceptional agencies with
        clients seeking top-notch services.
    </p>

    <p>
        At Hire2inspire, we believe in the power of collaboration and innovation, and we see your recruiter as a perfect fit for
        our community. We are impressed by your talents and capabilities, and we are confident that your involvement will
        greatly enrich our platform.
    </p>

    <p>
        To start this exciting journey, all you need to do is click the link below to create your recruiter's profile on our
        platform. The onboarding process is designed to be straightforward, and our support team is available to assist you at
        every step.
    </p>
    <p>Find the link 
    <a href="http://hire2inspire.com/employer/login" target="blank">Registration Link</a>
  </p>
  <p>
   password: secret
</p>
        <p>Thank you and best regards,</p>
        <p> Hire2Inspire </p>
    </body>
`
      };

      sgMail.sendMultiple(msg).then(() => {
        console.log('emails sent successfully!');
      }).catch(error => {
        console.log(error);
      });  
      
      let adminData = await Admin.findOne({});

      let adminName = adminData?.name;


    //  const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID);
     // console.log(emails, 'emails')

      const new_msg = {
        to: "hire2inspireh2i@gmail.com", // replace these with your email addresses
        from: 'info@hire2inspire.com',
        subject: `Notification for Employer-Recruiter Invitation`,
        html: `
        <head>
            <title>Notification for Employer-Recruiter Invitation</title>
        </head>
    <body>
    <body>
        <p>Dear ${adminName},</p>
        <p>I hope this email finds you well. I'm reaching out to provide a consolidated list of invitation emails sent by recruiters who have been invited by agency ${empFName} ${empLName}. Below, you'll find a summary of the invitations along with relevant details:
        emails are ${emails}</p>
        <p>Please review the invitations and their statuses. Let me know if there are any discrepancies or if further action is required from my end.</p>
        <p>Thank you for your attention to this matter.</p>
        <p>Best regards,<br>
        Hire2Inspire</p>
    </body>
`
      };

      sgMail.send(new_msg).then(() => {
        console.log('emails sent successfully!');
      }).catch(error => {
        console.log(error);
      });

//       var mailOptions = {
//         from: 'Info@hire2inspire.com',
//         subject: `Recruiter Invitation`,
//         html: `
//         <head>
//             <title>Welcome to Hire2Inspire</title>
//         </head>
//     <body>
//     <p>Dear Recruiter,</p>

//     <p>
//         I hope this message finds you well. We're thrilled to extend a warm and exclusive invitation to your esteemed recruiter
//         to become a part of the Hire2inspire platform - a dynamic community dedicated to connecting exceptional agencies with
//         clients seeking top-notch services.
//     </p>

//     <p>
//         At Hire2inspire, we believe in the power of collaboration and innovation, and we see your recruiter as a perfect fit for
//         our community. We are impressed by your talents and capabilities, and we are confident that your involvement will
//         greatly enrich our platform.
//     </p>

//     <p>
//         To start this exciting journey, all you need to do is click the link below to create your recruiter's profile on our
//         platform. The onboarding process is designed to be straightforward, and our support team is available to assist you at
//         every step.
//     </p>
//     <a href="${process.env.front_url}/recruiter/login" target="blank">Registration Link</a>
//   </p>
//   <p>
//    password: secret
// </p>
//         <p>Thank you and best regards,</p>
//         <p> Hire2Inspire </p>
//     </body>
// `
//       };


//       data.forEach((recipient) => {
//         mailOptions.to = recipient?.email;

//         transport.sendMail(mailOptions, (error, info) => {
//           if (error) {
//             console.error(`Error sending email to ${recipient}: ${error}`);
//           } else {
//             console.log(`Email sent to ${recipient?.email}: ${info.response}`);
//           }
//         });
//       });
      return res.status(200).send({
        error: false,
        message: "Invitation sent successfully",
        invitation_links: recruiterInvite.map((e) => {
          return { [e.email]: `${req.body.callback}?token=${e.token}` };
        }),
        invitedRecruiters: invitedRecruiters
      });
    } catch (error) {
      next(error);
    }
  },

  /////////////////////////// status update by emp ///////////////////

  statusEmpUpdate: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkEmp = await Employer.findOne({ _id: userId });
      if (!checkEmp && !["employer"].includes(dataModel))
        return res
          .status(400)
          .send({ error: true, message: "User Unauthorized" });

      const recruiterData = await RecruiterModel.findOneAndUpdate(
        { _id: req.params.id },
        { status: req.body.status },
        { new: true }
      );

      if (recruiterData) {
        return res.status(200).send({
          error: false,
          message: "Recruiter status updated.",
        });
      } else {
        return res.status(400).send({
          error: true,
          message: "Recruiter status not updated.",
        });
      }
    } catch (error) {
      next(error);
    }
  },


  changePassword: async (req, res, next) => {
    try {
      let token = req.headers['authorization']?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token)

      const checkRecruiter = await RecruiterModel.findOne({ _id: userId })
      // return res.status(200).send({userId, dataModel, checkRecruiter})
      if (!checkRecruiter && dataModel != "recruiters") return res.status(400).send({ error: true, message: "Recruiter not authorized." })

      if (req.body.old_password && req.body.new_password) {
        if (req.body.old_password === req.body.new_password) {
          message = {
            error: true,
            message: "Old and new password can not be same"
          }
          return res.status(200).send(message);
        }

        passwordCheck = await bcrypt.compare(req.body.old_password, checkRecruiter.password);
        if (passwordCheck) {
          const result = await RecruiterModel.findOneAndUpdate({
            _id: userId
          }, {
            password: req.body.new_password
          }, { new: true });
          message = {
            error: false,
            message: "Recruiter password changed!"
          }
        } else {
          message = {
            error: true,
            message: "Old password is not correct!"
          }
        }
      } else {
        message = {
          error: true,
          message: "Old password, new password are required!"
        }
      }
      return res.status(200).send(message);
    } catch (error) {
      if (error.isJoi === true) error.status = 422
      next(error)
    }
  },

  forgetPassword: async (req, res, next) => {
    try {
      if (!req.body.email) return res.status(400).send({ error: true, message: "Email required" });

      const RecruiterData = await RecruiterModel.findOneAndUpdate({ email: req.body.email }, { otp: 1234 });
      if (!RecruiterData) return res.status(404).send({ error: true, message: 'Recruiter not found' });

      return res.status(200).send({ error: false, message: 'Otp sent successfully' });

    } catch (error) {
      next(error)
    }
  },

  verifyOtp: async (req, res, next) => {
    try {
      if (!req.body.email && !req.body.otp) return res.status(400).send({ error: true, message: "Email and OTP required" });

      const RecruiterData = await RecruiterModel.findOne({
        $and: [
          { email: req.body.email },
          { otp: req.body.otp }
        ]
      });
      if (!RecruiterData) return res.status(404).send({ error: true, message: 'Recruiter not found / OTP not correct' });

      return res.status(200).send({ error: false, message: 'OTP verfied successfully' });

    } catch (error) {
      next(error)
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      if (req.body.new_password && req.body.confirm_password) {
        if (req.body.new_password !== req.body.confirm_password) {
          message = {
            error: true,
            message: "new and confirm password are not equal"
          }
          return res.status(400).send(message);
        }
        const RecruiterData = await RecruiterModel.findOne({
          email: req.body.email
        });

        if (RecruiterData === null) {
          message = {
            error: true,
            message: "Recruiter not found!"
          }
          return res.status(404).send(message);

        } else {
          const isMatch = await bcrypt.compare(req.body.new_password, RecruiterData.password)
          // return res.send("isMatch")
          if (isMatch)
            throw createError[400]('You can not use your old password as new.')

          const result = await RecruiterModel.findOneAndUpdate({
            email: req.body.email
          }, {
            password: req.body.new_password
          });

          console.log("result", result);

          message = {
            error: false,
            message: "Recruiter password reset successfully!"
          }
          return res.status(200).send(message);
        }
      } else {
        message = {
          error: true,
          message: "new password, confirm password are required!"
        }
        return res.status(404).send(message);
      }

    } catch (error) {
      next(error)
    }
  },

  logout: async (req, res, next) => {
    try {
      let token = req.headers['authorization']?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token)
      const checkRecruiter = await RecruiterModel.findOne({ _id: userId })

      if (checkRecruiter?.is_loggedIn == false) throw createError.NotFound('You are not already logged In yet');

      let recruiterData = await RecruiterModel.findOneAndUpdate({_id:userId},{"is_loggedIn":false},{new:true});
      
      return res.status(200).send({
        error: false,
        message: "Recruiter logout.",
        data: recruiterData
      })
    } catch (error) {
      next(error)
    }
  },

  updateLogout: async(req,res,next) => {
    try{
      let recruiterData = await RecruiterModel.findOneAndUpdate({email:req.body.email},{"is_loggedIn":false},{new:true});

      return res.status(200).send({
        error: false,
        message: "Recruiter logout.",
        data: recruiterData
      })
    }catch (error){
      next(error)
    }
  }
};

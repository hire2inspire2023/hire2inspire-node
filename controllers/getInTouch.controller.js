const mongoose = require("mongoose");
const GetInTouch = require("../models/getInTouch.model");
const nodemailer = require("nodemailer");

// var transport = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: 587,
//   //  secure: true,
//     auth: {
//         user: process.env.EMAIL_NAME,
//         pass: process.env.EMAIL_PASSWORD
//     },
//    // requireTLS: true,
// });

module.exports = {
    create: async (req, res, next) => {
        try {
            const getIntouchData = new GetInTouch(req.body)
            const result = await getIntouchData.save();


            let getData = await GetInTouch.findOne({_id:result?._id});


            let getName = getData?.name;
            let getEmail = getData?.emailId;
            let getSubject = getData?.subject;
            let getQuery = getData?.query

            const sgMail = require('@sendgrid/mail')
            sgMail.setApiKey('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')
           // console.log(process.env.SENDGRID)
            let msg = {
                to: 'subhra.onenesstechs@gmail.com', // Change to your recipient
                from: 'subhra.onenesstechs@gmail.com', // Change to your verified sender
                subject: `Employer Email Register`,
                html: `
              <head>
                  <title>Welcome to Hire2Inspire</title>
              </head>
          <body>
              
              <p>Thank you for choosing Hire2Inspire - the platform that connects talented job seekers with employers like you!</p>
              <p>If you have any questions or need assistance, feel free to contact our support team at [Support Email Address].</p>
              <p>We look forward to helping you find the perfect candidates for your job openings!</p>
              <p>Thank you and best regards,</p>
              <p> Hire2Inspire </p>
          </body>
      `
            }

            sgMail
                .send(msg)
                .then(() => {
                    console.log('Email sent')
                })
                .catch((error) => {
                    console.error(error)
                })


//             var mailOptions = {
//                 from: 'info@hire2inspire.com',
//                 to: 'info@hire2inspire.com',
//                 subject: `${getSubject}`,
//                 html:`
//             <body>
//                 <p>Dear Hire2Inspire,</p>
//                 <p>${getQuery}</p>
//                 <p>Thank you and best regards,</p>
//                 <p> ${getName} </p>
//             </body>
//         `
//  };   
            // transport.sendMail(mailOptions, function(error, info){
            //     if (error) {
            //       console.log(error);
            //     } else {
            //       console.log('Email sent: ' + info.response);
            //     }
            // });




            return res.status(200).send({
                error: false,
                message: "Thank you for submit your query",
                data: result
            })
        } catch (error) {
            next(error)
        }
    },
}

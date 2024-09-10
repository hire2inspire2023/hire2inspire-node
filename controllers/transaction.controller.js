const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const AgencyTransaction = require("../models/agency_transaction.model");
const Agency = require("../models/agency.model");
const { getUserViaToken, verifyAccessToken } = require("../helpers/jwt_helper");
const sgMail = require("@sendgrid/mail");
const fetch = require('node-fetch')

module.exports = {
  list: async (req, res, next) => {
    try {
      const transaction_data = await Transaction.find({}).populate([
        {
          path: "employer",
          select: "fname lname comp_name mobile",
        },
        {
          path: "passbook_amt.candidate",
          select: "fname lname agency",
          populate: {
            path: "agency",
            select: "name corporate_email gst agency_account_info",
            populate: {
              path: "AgencyUserAccountInfo",
              select: "agency_location personal_phone",
            },
          },
        },
        {
          path: "passbook_amt.billing_id",
          select: " ",
          populate: {
            path: "hire_id",
            select: " ",
            populate: {
              path: "job",
              select: "",
            },
          },
        },
        {
          path: "proforma_passbook_amt.candidate",
          select: "fname lname agency",
          populate: {
            path: "agency",
            select: "name corporate_email gst agency_account_info",
            populate: {
              path: "AgencyUserAccountInfo",
              select: "agency_location personal_phone",
            },
          },
        },
        {
          path: "proforma_passbook_amt.billing_id",
          select: " ",
          populate: {
            path: "hire_id",
            select: " ",
          },
        },
      ]);

      const agency_transaction_data = await AgencyTransaction.find({}).populate(
        [
          {
            path: "agency",
            select: "name",
          },
          {
            path: "passbook_amt.candidate",
            select: "fname lname",
            populate: {
              path: "agency",
              select: "name corporate_email gst agency_account_info",
              populate: {
                path: "AgencyUserAccountInfo",
                select: "first_name last_name personal_phone agency_location",
              },
            },
          },
          {
            path: "passbook_amt.billing_id",
            select: " ",
            populate: {
              path: "hire_id",
              select: " ",
              populate: {
                path: "job",
                select: "",
              },
            },
          },
          {
            path: "passbook_amt.employer",
            select: "fname lname email mobile",
          },
          {
            path: "proforma_passbook_amt.candidate",
            select: "fname lname",
            populate: {
              path: "agency",
              select: "name corporate_email gst agency_account_info",
              populate: {
                path: "AgencyUserAccountInfo",
                select: "first_name last_name personal_phone agency_location",
              },
            },
          },
          {
            path: "proforma_passbook_amt.billing_id",
            select: " ",
            populate: {
              path: "hire_id",
              select: " ",
              populate: {
                path: "job",
                select: "",
              },
            },
          },
          {
            path: "proforma_passbook_amt.employer",
            select: "fname lname email mobile",
          },
        ]
      );

      return res.status(200).send({
        error: false,
        message: "Transaction list",
        data: transaction_data,
        agency_transaction_data,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      let transactionId = req.query.transactionId;
      let invoice_file = req.body.invoice_file;

      let emp_id = req.params.id;

      console.log(invoice_file, "msg");

      const getEmpData = await Transaction.find({ employer: req.params.id });

      function addInvoiceKey(transactions, targetTransactionId, invoiceValue) {
        for (let i = 0; i < transactions.length; i++) {
          if (transactions[i].transaction_id == targetTransactionId) {
            transactions[i]["invoice_file"] = invoiceValue;
          }
        }
        return transactions;

        //    console.log(transactions,'transactions')
      }

      const updatedData = addInvoiceKey(
        getEmpData[0].passbook_amt,
        transactionId,
        invoice_file
      );
      //   console.log(req.body,"msg")
      console.log(updatedData);

      const result = await Transaction.findOneAndUpdate(
        { employer: req.params.id },
        { passbook_amt: updatedData },
        { new: true }
      );

      console.log("result>>>>", result);

      return res.status(200).send({
        error: false,
        message: "Invoice uploaded",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // list: async (req, res, next) => {
  //     try {
  //         const transaction_data = await Transaction.aggregate([
  //             { $sort: { _id: -1 } },])
  //         // ]).populate([
  //         //     {
  //         //         path:"employer",
  //         //         select:"fname lname"
  //         //     },
  //         //     {
  //         //         path:"passbook_amt.candidate",
  //         //         select:"fname lname agency",
  //         //         populate:{
  //         //             path:"agency",
  //         //             select:"name corporate_email",
  //         //         }
  //         //     },
  //         //     {
  //         //         path:"passbook_amt.billing_id",
  //         //         select:" ",
  //         //         populate:{
  //         //           path:"hire_id",
  //         //           select:" "
  //         //         }
  //         //       }
  //         // ]);

  //        // console.log("sorted data",transaction_data)

  //         const agency_transaction_data = await AgencyTransaction.find({}).populate([
  //             {
  //                 path:"agency",
  //                 select:"name"
  //             },
  //             {
  //                 path:"passbook_amt.candidate",
  //                 select:"fname lname",
  //                 populate:{
  //                     path:"agency",
  //                     select:"name corporate_email agency_account_info",
  //                     populate:{
  //                         path:"AgencyUserAccountInfo",
  //                         select:"first_name last_name personal_phone agency_location"
  //                     }
  //                 }
  //             },
  //             {
  //                 path:"passbook_amt.billing_id",
  //                 select:" ",
  //                 populate:{
  //                   path:"hire_id",
  //                   select:" "
  //                 }
  //               }
  //         ]);

  //         return res.status(200).send({
  //             error: false,
  //             message: "Transaction list",
  //             data: transaction_data,
  //             agency_transaction_data

  //         })
  //     } catch (error) {
  //         next(error);
  //     }
  // },

  agencylist: async (req, res, next) => {
    try {
      let token = req.headers["authorization"]?.split(" ")[1];
      let { userId, dataModel } = await getUserViaToken(token);
      const checkAgency = await Agency.findOne({ _id: userId });
      if (!checkAgency && dataModel != "admins")
        return res
          .status(401)
          .send({ error: true, message: "User unauthorized." });
      const agency_transaction_data = await AgencyTransaction.findOne({
        agency: userId,
      }).populate([
        {
          path: "agency",
          select: "name",
        },
        {
          path: "passbook_amt.candidate",
          select: "fname lname",
          populate: {
            path: "agency",
            select: "name corporate_email gst agency_account_info",
            populate: {
              path: "AgencyUserAccountInfo",
              select: "first_name last_name personal_phone agency_location",
            },
          },
        },
        {
          path: "passbook_amt.billing_id",
          select: " ",
          populate: {
            path: "hire_id",
            select: " ",
            populate: {
              path: "job",
              select: "job_id job_name min_work_exp max_work_exp",
            },
          },
        },
        {
          path: "passbook_amt.employer",
          select: "fname lname email mobile",
        },
        {
          path: "proforma_passbook_amt.candidate",
          select: "fname lname",
          populate: {
            path: "agency",
            select: "name corporate_email gst agency_account_info",
            populate: {
              path: "AgencyUserAccountInfo",
              select: "first_name last_name personal_phone agency_location",
            },
          },
        },
        {
          path: "proforma_passbook_amt.billing_id",
          select: " ",
          populate: {
            path: "hire_id",
            select: " ",
            populate: {
              path: "job",
              select: "job_id job_name min_work_exp max_work_exp",
            },
          },
        },
        {
          path: "proforma_passbook_amt.employer",
          select: "fname lname email mobile",
        },
      ]);

      // console.log({agency_transaction_data})

      return res.status(200).send({
        error: false,
        message: "Transaction list",
        data: agency_transaction_data,
      });
    } catch (error) {
      next(error);
    }
  },

  transactionempUpdate: async (req, res, next) => {
    try {
      const transactionId = req.body.transactionId;
      const empId = req.params.id;

      const getEmpData = await Transaction.findOne({ employer: empId });

      // Update passbook_amt array
      getEmpData.passbook_amt.forEach((transaction) => {
        if (transaction.transaction_id === transactionId) {
          transaction.is_active = false;
        }
      });

      // Update proforma_passbook_amt array
      getEmpData.proforma_passbook_amt.forEach((transaction) => {
        if (transaction.transaction_id === transactionId) {
          transaction.is_active = false;
        }
      });

      // Save the updated document
      const result = await getEmpData.save();

      //     console.log({result})

      return res.status(200).send({
        error: false,
        message: "Invoice cancel successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  transactionagencyUpdate: async (req, res, next) => {
    try {
      const transactionId = req.body.transactionId;
      const agencyId = req.params.id;

      const getAgeData = await AgencyTransaction.findOne({ agency: agencyId });

      // Update passbook_amt array
      getAgeData.passbook_amt.forEach((transaction) => {
        if (transaction.transaction_id === transactionId) {
          transaction.is_active = false;
        }
      });

      // Update proforma_passbook_amt array
      getAgeData.proforma_passbook_amt.forEach((transaction) => {
        if (transaction.transaction_id === transactionId) {
          transaction.is_active = false;
        }
      });

      // Save the updated document
      const result = await getAgeData.save();

      // console.log({result})

      return res.status(200).send({
        error: false,
        message: "Invoice cancel successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  sendMail: async (req, res, next) => {
    try {
      let transactionId = req.body.transactionId;
      let recipents = [];
      recipents = req.body.recipents;
      let file = req.body.file;

      let transctionData = await Transaction.findOne({
        "passbook_amt.transaction_id": transactionId,
      }).populate({
        path : 'employer',
        select : 'email'
      });

      console.log({ transctionData });

      let invoiceNo;
      transctionData.passbook_amt.forEach((transaction) => {
        if (transaction.transaction_id === transactionId) {
          console.log("hii");
          invoiceNo = transaction?.invoice_No;
        }
      });

      // let invoiceNo = transctionData?.passbook_amt?.invoice_No;

      console.log({ invoiceNo });

      const response = await fetch(file);
      const fileBuffer = await response.buffer(); // Get the file as a buffer
      const base64File = fileBuffer.toString('base64');

      sgMail.setApiKey(process.env.SENDGRID);
      const newmsg = {
        cc : transctionData?.employer?.email || '',
        to: recipents, // Change to your recipient
        from: "info@hire2inspire.com",
        subject: `Tax Invoice for Candidate hired ${invoiceNo}`,
        html: `
        <p>Hello,</p>
        <p>I hope this email finds you well. You can download the invoice for the [Product/Service] provided to you by clicking on the link below:</p>
        <p>Download Invoice Link: <a href="${file}" target="_blank">Click here to download your invoice or</a></p> or copy the link and paste : ${file}
        <p>[Include any specific details or notes about the invoice No: ${invoiceNo}]</p>
        <p>Should you have any questions or require further clarification regarding the invoice, please don't hesitate to reach out to me.</p>
        <p>Thank you for your prompt attention to this matter.</p>
        <p>Regards,<br/>Hire2Inspire</p>
        `,
        attachments: [
          {
            content: base64File,
            filename: 'taxinvoice.pdf',
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ],
        
      };

      sgMail
        .sendMultiple(newmsg)
        .then(() => {
          console.log("Email sent");
        })
        .catch((error) => {
          console.error(error);
        });

      return res.status(200).send({
        error: false,
        message: "Mail send",
      });
    } catch (error) {
      next(error);
    }
  },
};

const express = require("express");
const EmployerController = require("../controllers/employer.controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");
const EmployerRouter = express.Router();
const fileUpload = require('./../utils/pdfUpload')

EmployerRouter.get("/list", verifyAccessToken, EmployerController.list);

EmployerRouter.get("/all-list", EmployerController.alllist);

EmployerRouter.get("/detail/:id", verifyAccessToken, EmployerController.detail);

EmployerRouter.post("/register", EmployerController.register);

EmployerRouter.post("/login", EmployerController.login);

EmployerRouter.get(
  "/proile-detail",
  verifyAccessToken,
  EmployerController.profileDetail
);

EmployerRouter.post("/forget-password", EmployerController.forgetPassword);

EmployerRouter.post("/verify-otp", EmployerController.verifyOtp);

EmployerRouter.patch("/reset-password", EmployerController.resetPassword);

EmployerRouter.patch(
  "/update-profile",
  verifyAccessToken,
  EmployerController.updateProfile
);

EmployerRouter.patch(
  "/change-password",
  verifyAccessToken,
  EmployerController.changePassword
);

EmployerRouter.post("/refresh-token", EmployerController.refreshToken);

EmployerRouter.post("/billing", EmployerController.billingAdd);

EmployerRouter.delete("/logout", EmployerController.logout);

EmployerRouter.get(
  "/dashboard",
  verifyAccessToken,
  EmployerController.dashboard
);

EmployerRouter.patch("/verify-email/:userId", EmployerController.verifyEmail);

EmployerRouter.post("/resend-email", EmployerController.resendEmail);

EmployerRouter.delete("/delete/:empId", EmployerController.empdelete);

EmployerRouter.post("/subScriptionUpload/:id", fileUpload.single('subScriptionUpload'), EmployerController.subScriptionUpload);

EmployerRouter.post("/creditNoteUpload/:id", fileUpload.single('creditNoteUpload'), EmployerController.creditNoteUpload);

module.exports = EmployerRouter;

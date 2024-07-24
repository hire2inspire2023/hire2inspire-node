const express = require("express");
const AdminNotificationController = require("../controllers/adminNotification.controller");
const AdminNotificationRouter = express.Router();
const { verifyAccessToken } = require("../helpers/jwt_helper");


AdminNotificationRouter.post("/add", );

AdminNotificationRouter.get("/get-by-user/:id", AdminNotificationController.listByUser);

//AdminNotificationRouter.get("/get-by-user-last-10/:id",  AdminNotificationController.listByUserLast10);

AdminNotificationRouter.get("/notification-status-change/:id", AdminNotificationController.statusChange);

AdminNotificationRouter.get("/notification-clear/:id",  AdminNotificationController.clearNotification);

//notificationRouter.get("/list-by-agency/:id", NotificationController.listByAgency);


module.exports = AdminNotificationRouter;
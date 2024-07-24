const mongoose = require("mongoose");
const AdminNotification = require("../models/adminNotification.model");

module.exports = {
    listByUser: async (req, res, next) => {
        try {
            const adminnotifications = await AdminNotification.find({
                $and: [
                    { cleared: false },
                    { user: req.params.id }
                ]
            }).sort({_id: -1})
    
            return res.status(200).send({
                error: false,
                message: "Notification list",
                data: adminnotifications
            })
        } catch (error) {
            next(error);
        }
    },

    // listByUserLast10: async (req, res, next) => {
    //     try {
    //         const notifications = await Notification.find({
    //             $and: [
    //                 { cleared: false },
    //                 { user: req.params.id }
    //             ]
    //         }).sort({_id: -1}).limit(10);
    
    //         return res.status(200).send({
    //             error: false,
    //             message: "Notification list",
    //             data: notifications
    //         })
    //     } catch (error) {
    //         next(error);
    //     }
    // },

    statusChange: async (req, res, next) => {
        try {
            let adminnotificationData = await AdminNotification.findOneAndUpdate({_id:req.params.id},{seen:true},{new:true})
            message = {
                error: false,
                message: "All notification status updated",
                data:adminnotificationData
            };
            res.status(200).send(message);
        } catch (error) {
            next(error)
        }
    },

    clearNotification: async (req, res, next) => {
        try {
            let adminnotificationData = await AdminNotification.findOneAndUpdate({_id:req.params.id},{cleared:true},{new:true})
            message = {
                error: false,
                message: "Notification cleared",
                data:adminnotificationData
            };
            res.status(200).send(message);
        } catch (error) {
            next(error)
        }
    },

    // listByAgency: async (req, res, next) => {
    //     try {
    //         const notifications = await Notification.find({
    //             $and: [
    //                 { cleared: false },
    //                 { agency: req.params.id }
    //             ]
    //         }).sort({_id: -1})
    
    //         return res.status(200).send({
    //             error: false,
    //             message: "Notification list",
    //             data: notifications
    //         })
    //     } catch (error) {
    //         next(error);
    //     }
    // },
}


const mongoose = require("mongoose");
const Logo = require("../models/logo.model");

module.exports = {
    
    create: async (req, res, next) => {
        try {
            const logo_data = new Logo(req.body)
            const result = await logo_data.save();

            return res.status(200).send({
                error: false,
                message: "Logo create successfully",
                data: result
            })
        } catch (error) {
            next(error)
        }
    },

    list: async (req, res, next) => {
        try {
            const logo_data = await Logo.find({});
    
            return res.status(200).send({
                error: false,
                message: "List of all packages",
                data: logo_data
            })
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            const result = await Logo.findOneAndUpdate({_id: req.params.id}, req.body, {new: true});
    
            if(!result) return res.status(200).send({ error: false, message: "Logo not updated" })

            return res.status(200).send({
                error: false,
                message: "Logo data Updated",
                data: result
            })
        } catch (error) {
            next(error)
        }
    },

    detail: async (req, res, next) => {
        try {
            const result = await Logo.findOne({_id: req.params.id});
            return res.status(200).send({
                error: false,
                message: "Detail of Logo",
                data: result
            })
        } catch (error) {
            next(error)
        }
    }
}


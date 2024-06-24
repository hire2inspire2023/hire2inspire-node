const express = require('express')
const GetInTouchController = require('../controllers/getInTouch.controller')
const GetInTouchRouter = express.Router()

GetInTouchRouter.post('/add', GetInTouchController.create)
// GetInTouchRouter.post("/testmail", GetInTouchController.testmail);


module.exports = GetInTouchRouter
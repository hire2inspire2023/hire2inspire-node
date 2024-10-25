const express = require('express')
const TemplateController = require('../controllers/template.controller')
const TemplateRouter = express.Router()

TemplateRouter.get('/templateDownload', TemplateController.termsAndCondition);

module.exports = TemplateRouter
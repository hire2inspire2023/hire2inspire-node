const express = require('express')
const LogoController = require('../controllers/logo.controller')
const LogoRouter = express.Router()

LogoRouter.post('/add', LogoController.create)

LogoRouter.get('/list', LogoController.list)

LogoRouter.get('/detail/:id', LogoController.detail)

LogoRouter.patch('/update/:id', LogoController.update)

module.exports = LogoRouter
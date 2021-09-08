const express = require('express')
const bodyParser = require('body-parser')
const search = require('../middlewares/search')
const paging = require('../middlewares/paging')
const health = require('../middlewares/health')
const auth = require('../middlewares/auth')
const utils = require('../services/utilService')
const controllers = require('../controllers')

module.exports = (app) => {
    // Base config
    app.use(utils.logger.request)
    app.use(auth.middleware)
    app.use(bodyParser.json())
    app.use(search)
    app.use(paging)

    // Api route config
    controllers.forEach((item) => {
        const router = express.Router()
        const instance = new item(router)
        // if (instance.path) {
        //     app.use(`${instance.path}`, router)
        // }
        app.use(router)
    })

    app.use('/ping', health)

    return app
}

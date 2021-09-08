const mongoose = require('mongoose')
const app = require('./app')
const utils = require('./services/utilService')
const UserService = require('./services/userService')
const config = require('./config')

// If everything OK -> start server
app.listen(config.port, async () => {
    try {
        await mongoose.connect(config.db.uri, {
            dbName: config.db.name,
            useNewUrlParser: true
        })
        utils.logger.log(`Database name: ${config.db.name}, uri: ${config.db.uri}, status: Ready`)
        utils.logger.log(`API on fire at http://localhost:${config.port}`)
        // setup root account
        const service = new UserService()
        await service.setupRootAccount()
    } catch (error) {
        utils.logger.error(error)
    }
})

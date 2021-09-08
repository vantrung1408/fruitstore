const bodyCheck = require('../middlewares/body')
const UserService = require('../services/userService')
const config = require('../config')
const auth = require('../middlewares/auth')

class UserController {
    constructor(router) {
        let service = new UserService()
        router.post('/signup', auth.valid(config.roles.ANONYMOUS), bodyCheck, service.add.bind(service))
        router.post('/refresh', auth.valid(config.roles.ANONYMOUS), bodyCheck, service.refresh.bind(service))

        router.post('/login', auth.valid(config.roles.ANONYMOUS), bodyCheck, service.login.bind(service))
        router.post('/logout', auth.valid(config.roles.CUSTOMER), service.logout.bind(service))
    }
}

module.exports = UserController

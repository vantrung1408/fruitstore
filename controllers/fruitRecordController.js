const bodyCheck = require('../middlewares/body')
const FruitRecordService = require('../services/fruitRecordService')
const config = require('../config')
const auth = require('../middlewares/auth')

class FruitRecordController {
    constructor(router) {
        let service = new FruitRecordService()
        router.post('/admin/records', auth.valid(config.roles.ADMIN), bodyCheck, service.add.bind(service))
    }
}

module.exports = FruitRecordController

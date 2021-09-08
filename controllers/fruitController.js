const bodyCheck = require('../middlewares/body')
const FruitService = require('../services/fruitService')
const config = require('../config')
const auth = require('../middlewares/auth')

class FruitController {
    constructor(router) {
        let service = new FruitService()
        router.get('/fruits', auth.valid(config.roles.ANONYMOUS), service.getList.bind(service))
        router.get('/fruits/:id', auth.valid(config.roles.ANONYMOUS), service.get.bind(service))

        router.get('/admin/fruits', auth.valid(config.roles.ADMIN), service.getListByAdmin.bind(service))
        router.get('/admin/fruits/:id', auth.valid(config.roles.ADMIN), service.getByAdmin.bind(service))

        router.put('/admin/fruits/:id', auth.valid(config.roles.ADMIN), bodyCheck, service.updatePrice.bind(service))

        router.delete('/admin/fruits/:id', auth.valid(config.roles.ADMIN), service.del.bind(service))
        router.delete('/admin/fruits', auth.valid(config.roles.ADMIN), bodyCheck, service.del.bind(service))
    }
}

module.exports = FruitController

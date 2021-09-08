const bodyCheck = require('../middlewares/body')
const OrderService = require('../services/orderService')
const config = require('../config')
const auth = require('../middlewares/auth')

class OrderController {
    constructor(router) {
        let service = new OrderService()
        router.get('/order', auth.valid(config.roles.CUSTOMER), service.getList.bind(service))
        router.get('/order/:id', auth.valid(config.roles.CUSTOMER), service.get.bind(service))

        router.post('/order', auth.valid(config.roles.CUSTOMER), service.add.bind(service))
        router.get('/admin/order', auth.valid(config.roles.ADMIN), service.getListByAdmin.bind(service))
        router.get('/admin/order/:id', auth.valid(config.roles.ADMIN), service.getByAdmin.bind(service))
    }
}

module.exports = OrderController

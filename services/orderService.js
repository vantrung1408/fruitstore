const OrderModel = require('../models/orderModel').instance
const FruitModel = require('../models/fruitModel').instance
const ObjectId = require('mongoose').Types.ObjectId
const utils = require('./utilService')
const config = require('../config')

class OrderService {
    async getList(req, res) {
        try {
            //TODO: more condition filter in v2
            req.conditions.created_user = req.user._id
            let data = await utils.prepareDocumentGetRequest(OrderModel.find(req.conditions), req, false).select(['-updated_user', '-created_user']).lean().exec()
            let total = await OrderModel.countDocuments(req.conditions).exec()
            res.status(200).json(utils.pagination(data, total, req.pagination))
        } catch (error) {
            res.status(500).json(utils.validationErrorMessage(error))
        }
    }

    async getListByAdmin(req, res) {
        try {
            let data = await utils.prepareDocumentGetRequest(OrderModel.find(req.conditions), req, true).lean().exec()
            let total = await OrderModel.countDocuments(req.conditions).exec()
            res.status(200).json(utils.pagination(data, total, req.pagination))
        } catch (error) {
            res.status(500).json(utils.validationErrorMessage(error))
        }
    }

    async get(req, res) {
        try {
            let data = await OrderModel.findOne({ _id: req.params.id, created_user: req.user._id }).select(['-updated_user', '-created_user']).lean().exec()
            if (data) {
                res.status(200).json(data)
            } else {
                res.sendStatus(404)
            }
        } catch (error) {
            res.status(500).json(utils.validationErrorMessage(error))
        }
    }

    async getByAdmin(req, res) {
        try {
            let data = await utils.populateUser(OrderModel.findById(req.params.id)).lean().exec()
            if (data) {
                res.status(200).json(data)
            } else {
                res.sendStatus(404)
            }
        } catch (error) {
            res.status(500).json(utils.validationErrorMessage(error))
        }
    }

    async add(req, res) {
        try {
            let { fruits = [] } = req.body
            let ids = fruits.map((c) => c.fruit_id).filter((c) => c && ObjectId.isValid(c))
            if (ids.length) {
                let currents = await FruitModel.find({ _id: ids }).exec()
                let requestedNumber = fruits.length
                let requestedTotal = 0
                let validFruits = []
                for (let { fruit_id, amount } of fruits) {
                    let current = currents.find((d) => d._id.toString() === fruit_id)
                    if (current && current.amount) {
                        requestedTotal += this.calculatePrice(current, amount)
                        validFruits.push({
                            fruit_id: fruit_id,
                            amount: Math.min(amount, current.amount),
                            price: current.price,
                            name: current.name,
                            discount: current.discount
                        })
                    }
                }
                let total = validFruits.reduce((a, b) => a + this.calculatePrice(b, b.amount), 0)
                if (validFruits.length !== requestedNumber || requestedTotal !== total) {
                    // send back lastest data
                    res.status(200).json({
                        data: validFruits,
                        state: 'CART_UPDATED',
                        message: 'Order không thành công. Chúng tôi đã cập nhật lại giỏ hàng'
                    })
                } else {
                    let model = new OrderModel({
                        fruits: validFruits,
                        // TODO: update when implement online payment in v2
                        // payment_status: req.body.payment_status,
                        shipping: req.body.shipping,
                        total: total,
                        created_user: req.user._id,
                        updated_user: req.user._id
                    })
                    await model.save()

                    for (let current of currents) {
                        let ordered = validFruits.find((c) => c.fruit_id === current._id.toString())
                        current.amount -= ordered.amount
                        current.updated_user = req.user._id
                        await current.save()
                    }

                    res.status(201).json({ id: model._id.toString(), message: 'Order thành công.' })
                }
            } else {
                res.sendStatus(400)
            }
        } catch (error) {
            res.status(error.errors ? 400 : 500).json(utils.validationErrorMessage(error))
        }
    }

    calculatePrice(fruit, amount) {
        return (fruit.price - fruit.price * (fruit.discount || 0)) * amount
    }
}

module.exports = OrderService

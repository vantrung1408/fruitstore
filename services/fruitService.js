const FruitModel = require('../models/fruitModel').instance
const utils = require('./utilService')
const config = require('../config')

class FruitService {
    async getList(req, res) {
        try {
            //TODO: more condition filter in v2
            req.conditions.amount = {
                $gt: 0
            }
            req.conditions.price = {
                $gt: 0
            }
            let data = await utils.prepareDocumentGetRequest(FruitModel.find(req.conditions), req, false).lean().exec()
            let total = await FruitModel.countDocuments(req.conditions).exec()
            res.status(200).json(utils.pagination(data, total, req.pagination))
        } catch (error) {
            res.status(500).json(utils.validationErrorMessage(error))
        }
    }

    async getListByAdmin(req, res) {
        try {
            let data = await utils.prepareDocumentGetRequest(FruitModel.find(req.conditions), req, true).lean().exec()
            let total = await FruitModel.countDocuments(req.conditions).exec()
            res.status(200).json(utils.pagination(data, total, req.pagination))
        } catch (error) {
            res.status(500).json(utils.validationErrorMessage(error))
        }
    }

    async get(req, res) {
        try {
            let data = await FruitModel.findById(req.params.id).select(['-updated_user', '-created_user']).lean().exec()
            if (data && data.amount && data.price) {
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
            let data = await utils.populateUser(FruitModel.findById(req.params.id)).lean().exec()
            if (data) {
                res.status(200).json(data)
            } else {
                res.sendStatus(404)
            }
        } catch (error) {
            res.status(500).json(utils.validationErrorMessage(error))
        }
    }

    async updatePrice(req, res) {
        try {
            let data = await utils.populateUser(FruitModel.findById(req.params.id)).exec()
            if (data) {
                data.price = req.body.price
                data.updated_user = req.user._id
                await data.save()
                res.status(200).json({ data, message: `Cập nhật giá ${data.name} thành công.` })
            } else {
                throw 'fruit does not exist'
            }
        } catch (error) {
            res.status(error.errors ? 400 : 500).json(utils.validationErrorMessage(error))
        }
    }

    async del(req, res) {
        try {
            const ids = req.body.ids || [req.params.id]
            if (Array.isArray(ids) && ids.length) {
                await FruitModel.deleteMany({ _id: ids })
                res.status(200).json({
                    message: ids.length > 1 ? 'Xóa danh sách thành công.' : 'Xóa thành công.'
                })
            } else {
                res.sendStatus(404)
            }
        } catch (error) {
            res.status(500).json(utils.validationErrorMessage(error))
        }
    }
}

module.exports = FruitService

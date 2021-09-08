const FruitRecordModel = require('../models/fruitRecordModel').instance
const FruitModel = require('../models/fruitModel').instance
const utils = require('./utilService')
const config = require('../config')

class FruitRecordService {
    async add(req, res) {
        try {
            let { fruit_id, name, price, amount } = req.body
            if (!fruit_id) {
                let fruit = new FruitModel({
                    name,
                    amount,
                    created_user: req.user._id,
                    updated_user: req.user._id
                })
                await fruit.save()
                fruit_id = fruit._id.toString()
            } else {
                let fruit = await FruitModel.findById(fruit_id).exec()
                if (fruit) {
                    fruit.amount = Math.max(0, fruit.amount + amount)
                    fruit.updated_user = req.user._id
                    await fruit.save()
                } else {
                    throw 'fruit does not exist'
                }
            }
            let model = new FruitRecordModel({
                fruit_id,
                price,
                amount,
                created_user: req.user._id,
                updated_user: req.user._id
            })
            await model.save()
            res.status(201).json({ id: fruit_id, message: 'Thêm hoa quả thành công.' })
        } catch (error) {
            res.status(error.errors ? 400 : 500).json(utils.validationErrorMessage(error))
        }
    }
}

module.exports = FruitRecordService

const mongoose = require('mongoose')
const Schema = require('./')
const ObjectId = mongoose.Schema.Types.ObjectId

const schema = Schema({
    fruit_id: { type: ObjectId, ref: 'fruit' },
    amount: {
        type: Number,
        required: [true, 'Số lượng nhập kho không được bỏ trống'],
        validate: {
            validator: (v) => v,
            message: (_) => 'Số lượng nhập kho không hợp lệ'
        }
    },
    price: {
        type: Number,
        required: [true, 'Giá tiền không được bỏ trống'],
        validate: {
            validator: (v) => v,
            message: (_) => 'Giá tiền không hợp lệ'
        }
    }
})

module.exports = {
    schema,
    instance: mongoose.model('fruit_record', schema)
}

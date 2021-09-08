const mongoose = require('mongoose')
const Schema = require('./')
const ObjectId = mongoose.Schema.Types.ObjectId

const shipping = Schema({
    status: {
        type: String,
        enum: ['READY', 'PICKED_UP', 'ON_GOING', 'DELIVERED'],
        default: 'READY'
    },
    phone_number: {
        type: String,
        required: [true, 'SĐT giao hàng không được bỏ trống']
    },
    address: {
        type: String,
        required: [true, 'Địa chỉ giao hàng không được bỏ trống']
    },
    driver_phone_number: String
})

const fruit = Schema({
    fruit_id: { type: ObjectId, ref: 'fruit' },
    amount: {
        type: Number,
        validate: {
            validator: (v) => v > 0,
            message: (_) => 'Lượng order không hợp lệ'
        }
    },
    price: Number,
    name: String,
    discount: Number
})

const schema = Schema({
    fruits: {
        type: [fruit],
        validate: {
            validator: (v) => v.length,
            message: (_) => 'Giỏ hàng trống'
        }
    },
    total: Number,
    payment_status: {
        type: String,
        enum: ['PAID', 'UNPAID'],
        required: [true, 'Trạng thái thanh toán không được bỏ trống'],
        default: 'UNPAID'
    },
    shipping: {
        type: shipping,
        required: [true, 'Thông tin giao hàng không được bỏ trống']
    },
    note: String,
    status: {
        type: String,
        enum: ['CANCELED', 'CONFIRMED', 'ON_GOING', 'DONE'],
        required: [true, 'Trạng thái không được bỏ trống'],
        default: 'CONFIRMED'
    }
})

module.exports = {
    schema,
    instance: mongoose.model('order', schema)
}

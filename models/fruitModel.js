const mongoose = require('mongoose')
const Schema = require('./')

const image = Schema({
    url: String,
    thumbnail: String,
    height: Number,
    width: Number
})

const schema = Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên quả không được bỏ trống'],
            maxLength: [255, 'Tên quả phải nhỏ hơn 255 ký tự'],
            trim: true
        },
        description: String,
        images: [image],
        amount: {
            type: Number,
            required: [true, 'Số lượng tồn không được bỏ trống'],
            validate: {
                validator: (v) => v >= 0,
                message: (_) => 'Số lượng tồn không hợp lệ'
            }
        },
        price: Number,
        discount: {
            type: Number,
            min: [0, 'Discount nằm trong khoảng 0 - 100%'],
            max: [1, 'Discount nằm trong khoảng 0 - 100%'],
            default: 0
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

schema.virtual('price_final').get(function () {
    return this.price - this.price * (this.discount || 0)
})

module.exports = {
    schema,
    instance: mongoose.model('fruit', schema)
}

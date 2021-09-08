const mongoose = require('mongoose')
const Schema = require('./')
const ObjectId = mongoose.Schema.Types.ObjectId
const config = require('../config')
const utils = require('../services/utilService')

const schema = Schema(
    {
        phone_number: {
            type: String,
            required: [true, 'SĐT không được bỏ trống'],
            trim: true,
            unique: true,
            validate: {
                validator: (v) => config.phone_number_regex.test(v),
                message: (_) => 'Định dạng sđt không chính xác'
            }
        },
        email: {
            type: String,
            required: [true, 'Email không được bỏ trống'],
            maxLength: [255, 'Email phải nhỏ hơn 255 ký tự'],
            trim: true,
            unique: true,
            validate: {
                validator: (v) => config.email_regex.test(v),
                message: (_) => 'Định dạng email không chính xác'
            }
        },
        password: {
            type: String,
            required: [true, 'Mật khẩu không được bỏ trống'],
            select: false
        },
        first_name: {
            type: String,
            required: [true, 'Họ đệm không được bỏ trống'],
            maxLength: [21, 'Họ đệm phải nhỏ hơn 21 ký tự'],
            trim: true
        },
        last_name: {
            type: String,
            required: [true, 'Tên không được bỏ trống'],
            maxLength: [10, 'Tên phải nhỏ hơn 10 ký tự'],
            trim: true
        },
        address: String,
        verified_date: Date,
        last_login: Date,
        last_logout: Date,
        is_admin: { type: Boolean, default: false }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

schema.virtual('name').get(function () {
    return [this.first_name, this.last_name].filter((c) => c).join(' ')
})

schema.pre('validate', function (next) {
    this.phone_number = this.phone_number.replace('+84', '0')
    next()
})

module.exports = {
    schema,
    instance: mongoose.model('user', schema)
}

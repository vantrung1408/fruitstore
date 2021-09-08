const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

module.exports = (definition, options) => {
    const schema = new Schema(
        {
            ...definition,
            created_date: { type: Date, default: Date.now },
            updated_date: Date,
            created_user: {
                type: ObjectId,
                ref: 'user'
            },
            updated_user: {
                type: ObjectId,
                ref: 'user'
            }
        },
        options
    )

    schema.pre('save', function (next) {
        this.updated_date = new Date()
        next()
    })
    schema.post('save', function (error, doc, next) {
        if (error.code === 11000) {
            let path = Object.keys(error.keyValue)[0]
            let customError = {
                errors: {
                    [path]: {
                        path,
                        message: `${path} không được trùng lặp`,
                        kind: 'duplicated'
                    }
                }
            }
            next(customError)
        } else {
            next(error)
        }
    })
    return schema
}

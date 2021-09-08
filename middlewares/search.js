const moment = require('moment')
const ObjectId = require('mongoose').Types.ObjectId
const utils = require('../services/utilService')

module.exports = async (req, res, next) => {
    try {
        if (req.method === 'GET' && req.query) {
            let q = JSON.parse(JSON.stringify(req.query))

            const ignoreKeys = ['page', 'limit', 'order']
            const booleanValue = [true, false, 'true', 'false']

            let nq = {}
            for (let key in q) {
                if (ignoreKeys.indexOf(key) === -1 && !ObjectId.isValid(q[key])) {
                    let query = JSON.parse(q[key])
                    switch (query.type) {
                        case 'text':
                            if (booleanValue.indexOf(query.value) === -1) {
                                if (query.value) {
                                    nq[key] = {
                                        $regex: query.value,
                                        $options: 'i'
                                    }
                                }
                            } else {
                                nq[key] = query.value
                            }
                            break
                        case 'daterange':
                            break
                        case 'linked':
                            break
                    }
                }
            }
            req.conditions = nq
        }
        next()
    } catch (error) {
        next(error)
    }
}

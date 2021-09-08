const UserModel = require('../models/userModel').instance
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const config = require('../config')

const loggerLevels = {
    levels: {
        error: 0,
        info: 1,
        request: 2
    },
    colors: {
        error: 'red',
        info: 'green',
        request: 'blue'
    }
}

const logger = winston.createLogger({
    levels: loggerLevels.levels,
    level: 'request',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.splat(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({
                    all: true,
                    colors: loggerLevels.colors
                })
            ),
            silent: process.env.NODE_ENV === 'test'
        }),
        new DailyRotateFile({
            filename: 'logs/%DATE%.log',
            datePattern: 'YYYYMMDD'
        })
    ]
})

module.exports = {
    logger: {
        log: (info) => {
            if (config.logger.log) {
                if (typeof info === 'object') {
                    logger.info('%j', info)
                } else {
                    logger.info(info)
                }
            }
        },
        error: (error) => {
            if (config.logger.error) {
                if (typeof error === 'object') {
                    logger.error('%o', error)
                } else {
                    logger.error(error)
                }
            }
        },
        request: (req, res, next) => {
            let start = new Date()
            const resJson = res.json.bind(res)
            res.json = (json) => {
                if (config.logger.request) {
                    // Log header, url, query, body, method from req
                    // Log header, responseTime, status, body from res
                    let duration = new Date() - start
                    let info = {
                        request: {
                            ip: req.ip,
                            method: req.method,
                            url: req.originalUrl,
                            header: req.header,
                            cookies: req.cookies,
                            query: req.query,
                            body: req.body,
                            user: req.user,
                            conditions: req.conditions,
                            pagination: req.pagination
                        },
                        response: {
                            status: res.statusCode,
                            duration: duration,
                            header: res.header,
                            body: json
                        }
                    }
                    logger.log('request', '%j', info)
                }

                resJson(json)
            }

            res.sendStatus = (status) => {
                res.status(status)
                res.json()
            }

            next()
        }
    },
    pagination: (arr = [], total, settings) => {
        return {
            pagination: {
                page: settings.page + 1, // -1 ở paging.js cần +1 để về số cũ
                limit: settings.limit,
                start: settings.skip + 1,
                end: Math.min(settings.skip + settings.limit, total),
                total: total
            },
            items: arr
        }
    },
    jwt: {
        encode: (data, key, opts) => jwt.sign(data, key || config.secretKey, opts),
        verify: (data, key, opts) => jwt.verify(data, key || config.secretKey, opts)
    },
    bcrypt: {
        encrypt: (data) => bcrypt.hashSync(data, config.saltlength),
        compare: (data, hash) => bcrypt.compareSync(data, hash)
    },
    validationErrorMessage: function (error) {
        try {
            return Object.keys(error.errors).map((c) => ({
                path: error.errors[c].path,
                kind: error.errors[c].kind,
                message: error.errors[c].message
            }))
        } catch {
            this.logger.error(error)
            return [
                {
                    message: 'internal server error'
                }
            ]
        }
    },
    prepareDocumentGetRequest: function (model, req, includeUser) {
        if (model) {
            model.sort(req.pagination.order).skip(req.pagination.skip).limit(req.pagination.limit)
            if (includeUser) {
                this.populateUser(model)
            }
        }
        return model
    },
    populateUser: (model) => {
        if (model) {
            model.populate('updated_user', ['first_name', 'last_name']).populate('created_user', ['first_name', 'last_name'])
        }
        return model
    }
}

const UserModel = require('../models/userModel').instance
const utils = require('../services/utilService')
const config = require('../config')

class Auth {
    constructor() {
        this.parseUser = this.parseUser.bind(this)
        this.middleware = this.middleware.bind(this)
        this.valid = this.valid.bind(this)
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new Auth()
        }
        return this.instance
    }

    async parseUser(token) {
        const info = utils.jwt.verify(token, null, {
            algorithm: config.jwt_algorithm
        })
        if (info && info.id) {
            const data = await UserModel.findById(info.id).exec()
            if (data) {
                let last_login = data.last_login && data.last_login.getTime()
                let last_logout = data.last_logout && data.last_logout.getTime()
                let isValidAuthorization = data.verified_date && (!last_logout || last_login > last_logout)
                if (isValidAuthorization) {
                    return data
                } else {
                    throw { status: 403 }
                }
            } else {
                throw { status: 401 }
            }
        } else {
            throw { status: 401 }
        }
    }

    async middleware(req, res, next) {
        const token = (req.headers.authorization || '').replace('Bearer ', '')
        if (token) {
            try {
                req.user = await this.parseUser(token)
                next()
            } catch (error) {
                res.sendStatus(error.status || 401)
            }
        } else {
            next()
        }
    }

    valid(role) {
        return (req, res, next) => {
            switch (role) {
                case config.roles.ANONYMOUS:
                    next()
                    break
                case config.roles.CUSTOMER:
                    req.user ? next() : res.sendStatus(401)
                    break
                case config.roles.ADMIN:
                    req.user ? (req.user.is_admin ? next() : res.sendStatus(403)) : res.sendStatus(401)
                    break
                default:
                    res.sendStatus(401)
                    break
            }
        }
    }
}

module.exports = Auth.getInstance()

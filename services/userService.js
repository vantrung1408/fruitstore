const UserModel = require('../models/userModel').instance
const utils = require('./utilService')
const config = require('../config')

class UserService {
    generateAccessToken(user) {
        let payload = {
            id: user.id,
            phone_number: user.phone_number,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            name: user.name,
            is_admin: user.is_admin
        }
        return utils.jwt.encode(payload, null, {
            algorithm: config.jwt_algorithm,
            expiresIn: process.env.ACCESS_TOKEN_EXPIRE || config.access_token_expire
        })
    }

    generateRefreshToken(user) {
        return utils.jwt.encode(
            {
                _: utils.bcrypt.encrypt(user)
            },
            config.secretKey,
            {
                algorithm: config.bcrypt_algorithm,
                expiresIn: process.env.REFRESH_TOKEN_EXPIRE || config.refresh_token_expire
            }
        )
    }

    async add(req, res) {
        try {
            if (!req.body.password) {
                throw 'password is required'
            }
            let model = new UserModel(req.body)
            model.is_admin = false
            model.password = utils.bcrypt.encrypt(req.body.password)
            // TODO: v2 email verification
            model.verified_date = new Date()
            await model.save()
            res.status(201).json({ message: 'Thêm tài khoản thành công.' })
        } catch (error) {
            res.status(error.errors ? 400 : 500).json(utils.validationErrorMessage(error))
        }
    }

    async login(req, res) {
        try {
            let { username, password } = req.body
            let query = config.email_regex.test(username) ? { email: { $regex: username, $options: 'i' } } : { 'phone_number': username.replace('+84', '0') }
            let user = await UserModel.findOne(query).select('+password').exec()
            if (user) {
                let result = utils.bcrypt.compare(password, user.password)
                if (!result) {
                    throw 'password not match'
                } else {
                    user.last_login = new Date()
                    await user.save()
                    res.status(200).json({
                        accessToken: this.generateAccessToken(user),
                        refreshToken: this.generateRefreshToken(user.id)
                    })
                }
            } else {
                throw 'user does not exist'
            }
        } catch (error) {
            res.status(error.errors ? 400 : 500).json(utils.validationErrorMessage(error))
        }
    }

    async logout(req, res) {
        try {
            req.user.last_logout = new Date()
            await req.user.save()
            res.status(200).json({ message: 'Đăng xuất thành công.' })
        } catch (error) {
            res.status(error.errors ? 400 : 500).json(utils.validationErrorMessage(error))
        }
    }

    async refresh(req, res) {
        const { id, refreshToken } = req.body
        try {
            const _ = utils.jwt.verify(refreshToken, config.secretKey, {
                algorithm: config.bcrypt_algorithm
            })
            if (_ && _._) {
                let valid = utils.bcrypt.compare(id, _._)
                if (valid) {
                    const user = await UserModel.findById(id).exec()
                    res.status(200).json({
                        id,
                        accessToken: this.generateAccessToken(user)
                    })
                } else {
                    throw 'token not match'
                }
            } else {
                throw 'can not validate token'
            }
        } catch (error) {
            res.sendStatus(500)
        }
    }

    async setupRootAccount() {
        let user = {
            'phone_number': '0962535551',
            'email': 'admin@fruitstore.com',
            'first_name': 'Dong',
            'last_name': 'Van Trung',
            'is_admin': true,
            'password': '123456',
            'verified_date': new Date()
        }
        let admin = await UserModel.findOne({ email: user.email }).lean().exec()
        if (!admin) {
            let model = new UserModel(user)
            model.password = utils.bcrypt.encrypt(user.password)
            await model.save()
        }
        return user
    }
}

module.exports = UserService

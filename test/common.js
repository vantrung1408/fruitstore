const request = require('supertest')
const mongoose = require('mongoose')
const config = require('../config')
const app = require('../app')
const UserModel = require('../models/userModel').instance
const UserService = require('../services/userService')

module.exports = {
    db: null,
    user: null,
    phoneNumbers: [...new Array(1000)].map((c, i) => `096253${i + 1000}`),
    emails: [...new Array(1000)].map((c, i) => `vantrung${i + 1000}@gmail.com`),
    initDatabase: async function () {
        this.db = await mongoose.connect('mongodb://localhost:27017', {
            dbName: `${config.db.name}Test${Math.floor(Math.random() * 100) + 1}`,
            useNewUrlParser: true
        })
    },
    dropDatabase: function () {
        if (this.db) {
            this.db.connection.db.dropDatabase()
        }
    },
    getUser: async function () {
        let user = await UserModel.findOne({ email: this.user.email }).lean().exec()
        if (user) {
            this.user = user
        }
        return user
    },
    getAvailablePhoneNumber: function () {
        return this.phoneNumbers.pop()
    },
    getAvailableEmail: function () {
        return this.emails.pop()
    },
    createUser: async function (user, log = false) {
        this.user = {
            'phone_number': this.getAvailablePhoneNumber(),
            'email': this.getAvailableEmail(),
            'password': '123456',
            'first_name': 'Dong',
            'last_name': 'Van Trung',
            ...user
        }
        if (log) {
            console.log(this.user)
        }
        return await request(app).post('/signup').send(this.user)
    },
    createAdminUser: async function () {
        const service = new UserService()
        this.user = await service.setupRootAccount()
    },
    deleteUser: async function () {
        await UserModel.collection.drop()
    },
    login: async function (user) {
        let response = await request(app).post('/login').send({
            username: user.username,
            password: user.password
        })
        return response
    },
    triggerAfter: async (fn, ms) => {
        return new Promise((resolve) => {
            setTimeout(async () => {
                await fn()
                resolve()
            }, ms)
        })
    },
    random: (a, b) => Math.floor(Math.random() * b) + a,
    generateFruitsDataSet: async function (name) {
        let n = this.random(5, 10)
        let endpoint = '/admin/records'
        // create new admin user
        await this.createAdminUser()
        // login and get token of admin user
        token = await this.login({
            username: this.user.email,
            password: this.user.password
        })
        for (let i = 0; i < n; i++) {
            let body = {
                fruit_id: null, // will create new
                name: name + i,
                price: this.random(10000, 100000),
                amount: this.random(1, 100)
            }
            // insert new fruit record and also fruit
            let response = await request(app)
                .post(endpoint)
                .send(body)
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            expect(response.statusCode).toEqual(201)
            // update price of fruit
            response = await request(app)
                .put(`/admin/fruits/${response.body.id}`)
                .send({
                    price: body.price + 10000
                })
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            expect(response.statusCode).toEqual(200)
        }
        return n
    },
    prepareBodyForOrder: function (source) {
        return {
            fruits: source.map(({ _id, amount }) => ({
                fruit_id: _id,
                amount: this.random(1, amount)
            })),
            shipping: {
                phone_number: '0962535551',
                address: 'TP Hà Nội'
            }
        }
    },
    checkAmountLeft: function (source, target, ordered) {
        ordered.forEach((c) => {
            let d = target.find((d) => d._id === c.fruit_id)
            let e = source.find((e) => e._id === c.fruit_id)
            expect(e).not.toEqual(undefined)
            if (c.amount !== e.amount) {
                expect(d).not.toEqual(undefined)
                expect(d.amount).toEqual(Math.max(e.amount - c.amount, 0))
            }
        })
    }
}

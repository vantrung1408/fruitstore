const request = require('supertest')
const app = require('../../app')
const common = require('../common')
const UserModel = require('../../models/userModel').instance
const OrderModel = require('../../models/orderModel').instance
const FruitRecordModel = require('../../models/fruitRecordModel').instance
const FruitModel = require('../../models/fruitModel').instance

describe('ORDER controller', () => {
    beforeAll(async () => {
        await common.initDatabase()
    })
    afterAll(() => {
        common.dropDatabase()
    })
    afterEach(async () => {
        UserModel.collection.drop(() => {})
        FruitModel.collection.drop(() => {})
        FruitRecordModel.collection.drop(() => {})
    })
    test('customer create some order with correct data', async () => {
        // let create some fruits
        let n = await common.generateFruitsDataSet('Mango')
        // Fetch all fruits -> length of it will be n
        let response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)
        let fruits = response.body.items
        let body = common.prepareBodyForOrder(fruits)

        await UserModel.collection.drop()
        await common.createUser()
        let token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })

        // purchase with logged account
        response = await request(app)
            .post('/order')
            .send(body)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        let order_id = response.body.id
        expect(response.statusCode).toEqual(201)
        expect(order_id).not.toEqual(undefined)

        // if purchase success -> check amount left
        response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        newFruits = response.body.items
        common.checkAmountLeft(fruits, newFruits, body.fruits)

        // check order exist
        response = await request(app)
            .get(`/order/${order_id}`)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).toEqual(200)
        expect(response.body._id).not.toEqual(undefined)

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
    test('customer create some order with invalid data', async () => {
        // let create some fruits
        let n = await common.generateFruitsDataSet('Mango')
        // Fetch all fruits -> length of it will be n
        let response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)
        let fruits = response.body.items

        await UserModel.collection.drop()
        await common.createUser()
        let token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })

        let body = common.prepareBodyForOrder(fruits)
        let testcase = [
            // don't pick anything
            {
                value: [null, undefined, [], ''],
                expect: ({ statusCode }) => expect(statusCode).not.toEqual(200)
            },
            {
                value: [
                    // some fruits does not exist in db anymore or send fake id
                    body.fruits.map((c, i) => (i ? c : { ...c, fruit_id: '123456' })),
                    // request amount does not fit with current
                    body.fruits.map((c, i) => (i ? c : { ...c, amount: 999999999 }))
                ],
                expect: ({ statusCode, body }) => {
                    expect(statusCode).toEqual(200)
                    expect(body.state).toEqual('CART_UPDATED')
                }
            }
        ]
        for (let item of testcase) {
            for (let value of item.value) {
                body.fruits = value
                response = await request(app)
                    .post('/order')
                    .send(body)
                    .set('Authorization', 'Bearer ' + token.body.accessToken)
                await item.expect(response)
            }
        }

        // trying to send invalid body
        body = null
        response = await request(app)
            .post('/order')
            .send(body)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).not.toEqual(200)

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
    test('customer create some order and try modify price and discount', async () => {
        // let create some fruits
        let n = await common.generateFruitsDataSet('Mango')
        // Fetch all fruits -> length of it will be n
        let response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)
        let fruits = response.body.items

        await UserModel.collection.drop()
        await common.createUser()
        let token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })

        let body = common.prepareBodyForOrder(fruits)

        // trying to modify price and discount from client
        // success insert but price no change
        body.fruits = body.fruits.map((c, i) => (i ? c : { ...c, price: 0, discount: 1 }))
        response = await request(app)
            .post('/order')
            .send(body)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        let order_id = response.body.id
        expect(response.statusCode).toEqual(201)
        expect(order_id).not.toEqual(undefined)

        // check price
        response = await request(app)
            .get(`/order/${order_id}`)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).toEqual(200)
        expect(response.body.total).not.toEqual(0)

        // if purchase success -> check amount left
        response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        newFruits = response.body.items
        common.checkAmountLeft(fruits, newFruits, body.fruits)

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
    test('customer 1 create new order and customer 2 try to request it', async () => {
        // let create some fruits
        let n = await common.generateFruitsDataSet('Mango')
        // Fetch all fruits -> length of it will be n
        let response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)
        let fruits = response.body.items
        let body = common.prepareBodyForOrder(fruits)

        await UserModel.collection.drop()
        await common.createUser()
        let token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })

        // purchase with logged account
        response = await request(app)
            .post('/order')
            .send(body)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        let order_id = response.body.id
        expect(response.statusCode).toEqual(201)
        expect(order_id).not.toEqual(undefined)

        // request my histories and request detail page
        let urls = [`/order/${order_id}`, '/order']
        for (let url of urls) {
            response = await request(app)
                .get(url)
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            expect(response.statusCode).toEqual(200)
        }

        // create new user and let try again
        await UserModel.collection.drop()
        await common.createUser()
        token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })

        for (let url of urls) {
            response = await request(app)
                .get(url)
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            if (url === '/order') {
                expect(response.statusCode).toEqual(200)
                expect(response.body.items.length).toEqual(0)
            } else {
                expect(response.statusCode).not.toEqual(200)
            }
        }

        // this time create admin user and let try again -> will success
        await UserModel.collection.drop()
        await common.createAdminUser()
        token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })

        urls = [`/admin/order/${order_id}`, '/admin/order']
        for (let url of urls) {
            response = await request(app)
                .get(url)
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            expect(response.statusCode).toEqual(200)
        }

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
})

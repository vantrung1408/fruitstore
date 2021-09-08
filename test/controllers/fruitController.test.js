const request = require('supertest')
const app = require('../../app')
const common = require('../common')
const UserModel = require('../../models/userModel').instance
const OrderModel = require('../../models/orderModel').instance
const FruitRecordModel = require('../../models/fruitRecordModel').instance
const FruitModel = require('../../models/fruitModel').instance

describe('FRUIT controller', () => {
    beforeAll(async () => {
        await common.initDatabase()
    })
    afterAll(() => {
        common.dropDatabase()
    })
    // afterEach(async () => {
    //     UserModel.collection.drop(() => {})
    //     FruitModel.collection.drop(() => {})
    //     FruitRecordModel.collection.drop(() => {})
    // })
    jest.setTimeout(10000)
    test('admin insert some fruit via fruit record', async () => {
        let body = {
            fruit_id: null, // will create new
            name: 'Mango',
            price: 20000,
            amount: 50
        }
        let endpoint = '/admin/records'

        // create without login
        let response = await request(app).post(endpoint).send(body)
        expect(response.statusCode).toEqual(401)

        // create with customer account
        await common.createUser()
        let token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })
        response = await request(app)
            .post(endpoint)
            .send(body)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).toEqual(403)
        await common.deleteUser()

        // create with store owner account
        await common.createAdminUser()
        token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })
        response = await request(app)
            .post(endpoint)
            .send(body)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).toEqual(201)

        let fruit_id = response.body.id
        expect(fruit_id).not.toEqual(undefined)
        expect(fruit_id).not.toEqual(null)

        // request created fruit detail
        response = await request(app)
            .get('/admin/fruits/' + fruit_id)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).toEqual(200)
        expect(response.body._id).toEqual(fruit_id)

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
    test('anonymous fetch fruits list and fruit detail', async () => {
        // insert n fruits records
        let n = await common.generateFruitsDataSet('Mango')

        // Fetch all fruits -> length of it will be n
        let response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)

        // Search fruit by name and it match Mango_0 -> only one
        response = await request(app)
            .get('/fruits')
            .query({
                name: JSON.stringify({ 'type': 'text', 'value': 'Mango0' })
            })
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(1)

        // Search fruit by name and it match Mango_ -> all
        response = await request(app)
            .get('/fruits')
            .query({
                name: JSON.stringify({ 'type': 'text', 'value': 'Mango' })
            })
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)

        // Search fruit by name and it match Orange -> nothing
        response = await request(app)
            .get('/fruits')
            .query({
                name: JSON.stringify({ 'type': 'text', 'value': 'Orange' })
            })
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(0)

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
    test('get fruit detail', async () => {
        // insert n fruits records
        let n = await common.generateFruitsDataSet('Mango')

        // Fetch all fruits -> length of it will be n
        let response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)
        let fruits = response.body.items

        // Fetch detail
        response = await request(app).get(`/fruits/${fruits[0]._id}`)
        expect(response.statusCode).toEqual(200)
        expect(response.body.name).toEqual(fruits[0].name)

        // test with non exist id
        let testcase = [null, undefined, '', '123456']
        for (let value in testcase) {
            response = await request(app).get(`/fruits/${value}`)
            expect(response.statusCode).toEqual(500)
        }

        // update price or amount of fruit to 0 then fetch again
        testcase = ['price', 'amount']
        for (let i = 0; i < testcase.length; i++) {
            await common.createAdminUser()
            let token = await common.login({
                username: common.user.phone_number,
                password: common.user.password
            })
            // update price and amount to 0
            response = await request(app)
                .put(`/admin/fruits/${fruits[i]._id}`)
                .send({
                    [testcase[i]]: 0
                })
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            expect(response.statusCode).toEqual(200)
            // then fetch detail again, it will not found because no one ll sell not existed item
            response = await request(app).get(`/fruits/${fruits[i]._id}`)
            expect(response.statusCode).toEqual(404)
        }

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
    test('admin get fruits', async () => {
        // admin will be able fetch all fruits
        let n = await common.generateFruitsDataSet('Mango')

        // Fetch all fruits -> length of it will be n
        let response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)
        let fruits = response.body.items

        // update price and amount of first two item to 0 -> admin will able get n item, user ll n-2 items
        testcase = ['price', 'amount']
        for (let i = 0; i < testcase.length; i++) {
            await common.createAdminUser()
            let token = await common.login({
                username: common.user.phone_number,
                password: common.user.password
            })
            // update price and amount to 0
            response = await request(app)
                .put(`/admin/fruits/${fruits[i]._id}`)
                .send({
                    [testcase[i]]: 0
                })
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            expect(response.statusCode).toEqual(200)
            // then fetch detail again, it will not found because no one ll sell not existed item
            response = await request(app).get(`/fruits/${fruits[i]._id}`)
            expect(response.statusCode).toEqual(404)
            // but admin still can retrive detail
        }

        //user will receive n-2 items
        response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n - 2)

        //admin will receive n-2 items
        let token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })
        response = await request(app)
            .get('/admin/fruits')
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
    test('delete fruits', async () => {
        // insert n fruits records
        let n = await common.generateFruitsDataSet('Mango')

        // Fetch all fruits -> length of it will be n
        let response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n)
        let fruits = response.body.items

        // let delete first item
        let token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })
        response = await request(app)
            .delete(`/admin/fruits/${fruits[0]._id}`)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).toEqual(200)

        // refresh list and expect only one being deleted -> total = n-1
        response = await request(app).get('/fruits')
        expect(response.statusCode).toEqual(200)
        expect(response.body.pagination.total).toEqual(n - 1)

        // multi delete
        let testcase = [
            {
                ids: [],
                expect: 404
            },
            {
                ids: {},
                expect: 404
            },
            {
                ids: ['123456'],
                expect: 500
            },
            {
                ids: fruits.map((c) => c._id.toString()),
                expect: 200
            }
        ]
        for (let item of testcase) {
            response = await request(app)
                .delete(`/admin/fruits`)
                .send({
                    ids: item.ids
                })
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            expect(response.statusCode).toEqual(item.expect)
        }

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
    test('incorrect data insert', async () => {
        let testcase = {
            amount: [0, null, undefined, ''],
            price: [0, null, undefined, '']
        }
        let endpoint = '/admin/records'

        await common.createAdminUser()
        token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })

        // check invalid prop in body
        for (let key in testcase) {
            for (let value of testcase[key]) {
                let body = {
                    fruit_id: null, // will create new
                    name: 'Mango',
                    price: 20000,
                    amount: 50,
                    [key]: value
                }
                response = await request(app)
                    .post(endpoint)
                    .send(body)
                    .set('Authorization', 'Bearer ' + token.body.accessToken)
                expect(response.statusCode).not.toEqual(201)
            }
        }

        // check invalid body
        response = await request(app)
            .post(endpoint)
            .send(null)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).not.toEqual(201)

        await UserModel.collection.drop()
    })
    test('update fruit by insert new fruit record', async () => {
        let body = {
            fruit_id: null, // will create new
            name: 'Mango',
            price: 20000,
            amount: 50
        }
        let endpoint = '/admin/records'

        // create with store owner account
        await common.createAdminUser()
        token = await common.login({
            username: common.user.phone_number,
            password: common.user.password
        })
        response = await request(app)
            .post(endpoint)
            .send(body)
            .set('Authorization', 'Bearer ' + token.body.accessToken)
        expect(response.statusCode).toEqual(201)

        let fruit_id = response.body.id
        let amount = body.amount
        expect(fruit_id).not.toEqual(undefined)
        expect(fruit_id).not.toEqual(null)

        // check case increase, downcrease, or down to 0
        body.fruit_id = fruit_id
        let testcase = [20, -14, -99]
        for (let value of testcase) {
            body.amount = value
            amount += value
            // update new amount
            response = await request(app)
                .post(endpoint)
                .send(body)
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            expect(response.statusCode).toEqual(201)

            // request created fruit detail
            response = await request(app)
                .get('/admin/fruits/' + fruit_id)
                .set('Authorization', 'Bearer ' + token.body.accessToken)
            expect(response.statusCode).toEqual(200)
            expect(response.body.amount).toEqual(Math.max(amount, 0))
        }

        await UserModel.collection.drop()
        await FruitModel.collection.drop()
        await FruitRecordModel.collection.drop()
    })
})

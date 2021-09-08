const request = require('supertest')
const app = require('../../app')
const common = require('../common')
const UserModel = require('../../models/userModel').instance

describe('USER controller', () => {
    beforeAll(async () => {
        await common.initDatabase()
    })
    afterAll(() => {
        common.dropDatabase()
    })
    test('regist new account with correct body', async () => {
        // should success when create new user
        const response = await common.createUser()
        expect(response.statusCode).toEqual(201)

        // should exist user in database when query
        const inserted = await common.getUser()
        expect(inserted).not.toEqual(null)

        // delete user
        await common.deleteUser()
        const deleted = await common.getUser()
        expect(deleted).toEqual(null)
    })
    test('regist new account with incorrect body', async () => {
        // check incorrect data insert
        let testcase = {
            phone_number: [null, undefined, '', 'abcdef', '1234567890'],
            email: [null, undefined, '', 'abcdef', 'vantrung1408@', `${[...new Array(256)].map((c) => 'a').join('')}@gmail.com`, 'こんにちは@gmail.com'],
            password: [null, undefined, ''],
            first_name: [null, undefined, '', [...new Array(22)].map((c) => 'a').join('')],
            last_name: [null, undefined, '', [...new Array(11)].map((c) => 'a').join('')]
        }

        for (let key in testcase) {
            for (let value of testcase[key]) {
                // should response with error
                const response = await common.createUser({
                    [key]: value
                })
                expect(response.statusCode).not.toEqual(201)

                // should not exist user in database when query
                const data = await common.getUser()
                expect(data).toEqual(null)
            }
        }
    })
    test('regist with duplicate email or phone', async () => {
        // let testcase = {
        //     phone_number: common.getAvailablePhoneNumber(),
        //     email: common.getAvailableEmail()
        // }
        // for (let key in testcase) {
        //     let body = {
        //         [key]: testcase[key]
        //     }
        //     // Should create new user
        //     let response = await common.createUser(body, true)
        //     expect(response.statusCode).toEqual(201)

        //     // should exist user in database when query
        //     const inserted = await common.getUser()
        //     expect(inserted).not.toEqual(null)

        //     if (key === 'phone_number') {
        //         body['email'] = common.getAvailableEmail()
        //     } else {
        //         body['phone_number'] = common.getAvailablePhoneNumber()
        //     }

        //     // Should response with error
        //     response = await common.createUser(body, true)
        //     expect(response.statusCode).not.toEqual(201)

        //     // delete user
        //     await common.deleteUser()
        //     const deleted = await common.getUser()
        //     expect(deleted).toEqual(null)
        // }
    })
    test('regist with untrim email or phone, special phone', async () => {
        let testcase = {
            phone_number: [`${common.getAvailablePhoneNumber()} `, ` ${common.getAvailablePhoneNumber()} `, ` ${common.getAvailablePhoneNumber()}`, `+84${common.getAvailablePhoneNumber().substr(1)}`],
            email: [` ${common.getAvailableEmail()}`, ` ${common.getAvailableEmail()} `, ` ${common.getAvailableEmail()}`]
        }
        for (let key in testcase) {
            for (let value of testcase[key]) {
                let body = {
                    [key]: value
                }

                // Should create new user
                let response = await common.createUser(body)
                expect(response.statusCode).toEqual(201)

                // should exist user in database when query
                const inserted = await common.getUser()
                expect(inserted).not.toEqual(null)

                // delete user
                await common.deleteUser()
                const deleted = await common.getUser()
                expect(deleted).toEqual(null)
            }
        }
    })
    test('login with registed account', async () => {
        let testcase = {
            phone_number: common.getAvailablePhoneNumber(),
            email: common.getAvailableEmail()
        }
        for (let key in testcase) {
            let body = {
                [key]: testcase[key],
                username: testcase[key],
                password: '123456'
            }

            // Should create new user
            let response = await common.createUser({ [key]: testcase[key] })
            expect(response.statusCode).toEqual(201)

            // should success login
            response = await common.login(body)
            expect(response.statusCode).toEqual(200)
            expect(response.body.accessToken).not.toEqual(null)
            expect(response.body.refreshToken).not.toEqual(null)

            // delete user
            await common.deleteUser()
            const deleted = await common.getUser()
            expect(deleted).toEqual(null)

            // can not login again
            response = await common.login(body)
            expect(response.statusCode).not.toEqual(200)
        }
    })
    test('login with registed account but will use incorrect password', async () => {
        let testcase = {
            phone_number: common.getAvailablePhoneNumber(),
            email: common.getAvailableEmail()
        }
        for (let key in testcase) {
            let body = {
                username: testcase[key],
                password: '123456'
            }

            // Should create new user
            let response = await common.createUser({ [key]: testcase[key] })
            expect(response.statusCode).toEqual(201)

            // should success login
            let passwords = [null, undefined, '', '654321']
            for (let password of passwords) {
                body.password = password
                response = await common.login(body)
                expect(response.statusCode).not.toEqual(200)
            }

            // delete user
            await common.deleteUser()
            const deleted = await common.getUser()
            expect(deleted).toEqual(null)
        }
    })
    test('login then logout', async () => {
        let body = {
            username: common.getAvailablePhoneNumber(),
            password: '123456'
        }

        // Should create new user
        let response = await common.createUser({ phone_number: body.username, password: body.password })
        expect(response.statusCode).toEqual(201)

        // should success login
        response = await common.login(body)
        expect(response.statusCode).toEqual(200)
        expect(response.body.accessToken).not.toEqual(null)
        expect(response.body.refreshToken).not.toEqual(null)

        // should logout success
        response = await request(app)
            .post('/logout')
            .set('Authorization', 'Bearer ' + response.body.accessToken)
        expect(response.statusCode).toEqual(200)

        // should logout fail because token is invalid
        response = await request(app)
            .post('/logout')
            .set('Authorization', 'Bearer ' + response.body.accessToken)
        expect(response.statusCode).not.toEqual(200)

        // delete user
        await common.deleteUser()
        const deleted = await common.getUser()
        expect(deleted).toEqual(null)
    })
    test('access token expired, wrong check', async () => {
        let body = {
            username: common.getAvailablePhoneNumber(),
            password: '123456'
        }

        // Should create new user
        let response = await common.createUser({ phone_number: body.username, password: body.password })
        expect(response.statusCode).toEqual(201)

        let user = await common.getUser()
        process.env.ACCESS_TOKEN_EXPIRE = 3000

        // should success login
        response = await common.login(body)
        expect(response.statusCode).toEqual(200)

        let { accessToken, refreshToken } = response.body
        expect(accessToken).not.toEqual(null)
        expect(refreshToken).not.toEqual(null)

        // should request success
        response = await request(app)
            .get('/order')
            .set('Authorization', 'Bearer ' + accessToken)
        expect(response.statusCode).toEqual(200)

        await common.triggerAfter(async () => {
            // should request fail because token is expired
            response = await request(app)
                .get('/order')
                .set('Authorization', 'Bearer ' + accessToken)
            expect(response.statusCode).toEqual(401)

            // request new access token by refresh token
            response = await request(app).post('/refresh').send({
                id: user._id.toString(),
                refreshToken: refreshToken
            })
            expect(response.statusCode).toEqual(200)
            expect(response.body.accessToken).not.toEqual(null)

            // should request success with new access token
            response = await request(app)
                .get('/order')
                .set('Authorization', 'Bearer ' + response.body.accessToken)
            expect(response.statusCode).toEqual(200)
        }, process.env.ACCESS_TOKEN_EXPIRE)

        // delete user
        await common.deleteUser()
        const deleted = await common.getUser()
        expect(deleted).toEqual(null)
    })
    test('refresh token expired, wrong check', async () => {
        let body = {
            username: common.getAvailablePhoneNumber(),
            password: '123456'
        }

        // Should create new user
        let response = await common.createUser({ phone_number: body.username, password: body.password })
        expect(response.statusCode).toEqual(201)

        let user = await common.getUser()
        process.env.REFRESH_TOKEN_EXPIRE = 1500

        // should success login
        response = await common.login(body)
        expect(response.statusCode).toEqual(200)

        let { accessToken, refreshToken } = response.body
        expect(accessToken).not.toEqual(null)
        expect(refreshToken).not.toEqual(null)

        // try to sending fake refresh token
        let testcase = [null, undefined, '', 'refreshToken']
        for (let value of testcase) {
            response = await request(app).post('/refresh').send({
                id: user._id.toString(),
                refreshToken: value
            })
            expect(response.statusCode).toEqual(500)
            expect(response.body.accessToken).toEqual(undefined)
        }

        await common.triggerAfter(async () => {
            // should error because refresh token expired
            response = await request(app).post('/refresh').send({
                id: user._id.toString(),
                refreshToken: refreshToken
            })
            expect(response.statusCode).toEqual(500)
            expect(response.body.accessToken).toEqual(undefined)
        }, process.env.ACCESS_TOKEN_EXPIRE)

        // delete user
        await common.deleteUser()
        const deleted = await common.getUser()
        expect(deleted).toEqual(null)
    })
})

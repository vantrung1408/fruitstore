module.exports = {
    secretKey: 'FruitStore',
    db: {
        uri: process.env.DB_CONNECTION_STRING || 'mongodb://localhost:27017/',
        name: 'FruitStore',
        user: '',
        password: ''
    },
    access_token_expire: 3600,
    refresh_token_expire: 3600 * 24 * (Math.floor(Math.random() * 60) + 14),
    port: process.env.PORT || 3000,
    host: '',
    basePath: '',
    apiBasePath: '/api',
    jwt_algorithm: 'HS512',
    bcrypt_algorithm: 'HS256',
    saltlength: 10,
    logger: {
        log: true,
        error: true, // log error
        request: true // log request
    },
    email_regex: /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
    phone_number_regex: /^[0]\d{9}$/,
    roles: {
        ANONYMOUS: 0,
        CUSTOMER: 1,
        ADMIN: 2
    }
}

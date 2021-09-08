const express = require('express')
const cors = require('cors')

const app = require('./routes')(express())

app.use(cors())
// export log folder
app.use('/logs', express.static('logs'))

module.exports = app

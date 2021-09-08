module.exports = (req, res, next) => {
    if (req.body && Object.keys(req.body).length) {
        next()
    } else {
        res.sendStatus(400)
    }
}

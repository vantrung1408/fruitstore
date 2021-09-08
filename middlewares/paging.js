module.exports = (req, res, next) => {
    if (req.method === 'GET' && req.query) {
        let q = req.query

        let { page, limit, order } = q
        delete req.query['page']
        delete req.query['limit']
        delete req.query['order']

        try {
            if (order === JSON.stringify({})) {
                order = null
            } else {
                order = JSON.parse(order)
            }
        } catch (error) {
            order = null
        }

        let pagination = {
            page: parseInt(page || 1) - 1,
            limit: parseInt(limit || 10),
            order: order || { created_date: -1 }
        }
        req.pagination = {
            ...pagination,
            skip: pagination.page * pagination.limit
        }
    }
    next()
}

class db {
    constructor(namespace) {
        this.db = new (require('keyv'))('sqlite://database.sqlite', { namespace: namespace })
    }

    async get(key, options) {
        return await this.db.get(key, options)
    }

    async set(key, value, ttl) {
        return await this.db.set(key, value, ttl)
    }
}

module.exports = db
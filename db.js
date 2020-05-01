class db {
    constructor(namespace) {
        this.db = new (require('enmap'))({ name: namespace })
    }

    async get(key, path) {
        await this.db.defer
        return await this.db.get(key, path)
    }

    async set(key, value, path) {
        await this.db.defer
        return await this.db.set(key, value, path)
    }

    async delete(key, path) {
        await this.db.defer
        return await this.db.delete(key, path)
    }

    async ensure(key, value, path) {
        await this.db.defer
        return await this.db.ensure(key, value, path)
    }
}

module.exports = db
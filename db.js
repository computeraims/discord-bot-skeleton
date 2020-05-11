function objToStrMap(obj) {
    let strMap = new Map();
    for (let k of Object.keys(obj)) {
        strMap.set(k, obj[k]);
    }
    return strMap;
}

const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./database.sqlite"
    },
    useNullAsDefault: true
});

class db {
    constructor(table) {
        this.table = table
        this.knex = knex
    }

    async ensureTable() {
        let exists = await this.knex.schema.hasTable(this.table)
        if (!exists) {
            await this.knex.schema.createTable(this.table, t => {
                t.string('key').primary();
                t.json('value')
            })
            console.log(`Creating table ${this.table}`)
        }
    }

    async get(key) {
        let rows = await this.knex.select('*').from(this.table).where({ key: key })
        if (!rows.length) return null

        let data = JSON.parse(rows[0].value)

        return data

    }

    async set(key, value) {
        let rows = await this.knex.select('*').from(this.table).where({ key: key })
        if (!rows.length) {
            await this.knex(this.table).insert({ key: key, value: JSON.stringify(value) })
        } else {
            await this.knex(this.table).where({ key: key }).update({ value: JSON.stringify(value) })
        }
    }

    async delete(key) {
        await this.knex(this.table).where('key', key).del()
    }

    async ensure(key, value) {
        let rows = await this.knex.select('*').from(this.table).where({ key: key })
        if (!rows.length) {
            await this.knex(this.table).insert({ key: key, value: JSON.stringify(value) })
        }
    }

    async array() {
        let rows = await this.knex.select('*').from(this.table)
        let toObj = {}
        for (let row of rows) {
            let key = row.key
            let value = JSON.parse(row.value)
            toObj[key] = value
        }
        let map = objToStrMap(toObj)
        return Array.from(map.values());
    }
}

module.exports = db
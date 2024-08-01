

const util = require('util');
const mysql = require('mysql');
const jf = require('mysql-json');
console.log(jf);
require('dotenv').config();
const conn = mysql.createConnection({
    host: process.env.FSQL_HOST,
    user: process.env.FSQL_USER,
    password: process.env.FSQL_PASSWORD,
    database: 'INFORMATION_SCHEMA'
});
conn.connect(() => {
    console.log('Connected to Schema MySQL');
})
const iquery = util.promisify(conn.query).bind(conn);

const fquery = async (sql, db) => {
    const query = util.promisify(db.query).bind(db);

    let outQuery = await query(sql);
    let processQuery = null;
    let columns = [];
    if (sql.includes('LEFT JOIN')) {
        const queryParse = sql.split(' ');
        queryParse.map(async (que, index) => {
            if (que == 'JOIN') {
                const table_name = queryParse[index + 1];
                const infoQuery = await iquery(`
                        SELECT COLUMN_NAME 
                        FROM COLUMNS 
                        WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?;
                    `, [table_name, process.env.DB_NAME])
                columns = [...columns, ...infoQuery];
                columns = columns.map(cl => cl.COLUMN_NAME);
                processQuery = outQuery.map(st => {
                    const keys = Object.keys(st);
                    st[table_name] = {};

                    keys.map(k => {
                        if (columns.includes(k) && k !== 'id') {
                            st[table_name][k] = st[k];
                            delete st[k]
                        }
                    });

                    return st;
                });
            }
        });
    };
    return processQuery || outQuery || null;


}

module.exports = fquery




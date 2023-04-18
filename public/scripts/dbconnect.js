const OracleDB = require("oracledb");
require('dotenv').config();

var connection;

async function connect() {
    try {
        console.log('connecting to database...');
        connection = await OracleDB.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_PATH
        });
        console.log(`connection opened`);
        return connection;
    } catch (err) {
        console.error("ERROR: ", err.message);
        finalResult = `ERROR: ${err.message}`;
    }
    return null;
}
async function disconnect() {
    if (connection) {
        try {
            console.log('disconnecting...');
            await connection.close();
            console.log(`connection closed`);
        } catch(err) {
            console.error(err.message);
            finalResult = err.message;
        }
    } else {
        console.log('invalid connection... cancelling disconnect');
    }
}
async function commit() {
    console.log('committing...');
    await connection.execute('COMMIT');
    console.log('committed');
    return;
}

async function insert(table, attributes, values) {
    console.log(`INSERT INTO ${table} ${attributes} VALUES ${values}`);
    var finalResult;
    try {
        finalResult = await connection.execute(`INSERT INTO ${table} ${attributes} VALUES ${values}`);
        console.log(`inserted into ${table}`);
    } catch (err) {
        console.error(err.message);
        finalResult = `ERROR: ${err.message}`;
    }
    return finalResult;
}

async function select(table, values, condition) {
    console.log(`SELECT ${values} FROM ${table} WHERE ${condition}`);
    var finalResult;
    try {
        finalResult = await connection.execute(`SELECT ${values} FROM ${table} WHERE ${condition}`);
        console.log(`selected from ${table}`);
    } catch (err) {
        console.error(err.message);
        finalResult = `ERROR: ${err.message}`;
    }
    return finalResult;
}

module.exports = { connect, disconnect, commit, insert, select };
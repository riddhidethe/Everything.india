const mysql = require('mysql');

function dbConnection() {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'everythi_everything',
        password: 'N5QMb0nJhe#g',
        database: 'everythi_everythingstore'
    })
    connection.connect();
        return connection;
}

module.exports = dbConnection;
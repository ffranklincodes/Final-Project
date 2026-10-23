var mysql = require('mysql2');
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'worksheet_builder'
})

conn.connect(function(err) {
    if (err) throw err;
    console.log('Database connected');
});

module.exports = conn;
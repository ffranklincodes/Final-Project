<<<<<<< HEAD
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

=======
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

>>>>>>> bd9f5453353f1bff29df9513174b94aab2f07707
module.exports = conn;
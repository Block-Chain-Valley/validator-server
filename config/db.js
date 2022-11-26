require("dotenv").config();

const mysql = require("mysql2/promise");

// console.log("HOST:", process.env.DB_HOST);
// console.log("USER:", process.env.DB_USER);
// console.log("PASS:", process.env.DB_DATABASE);

const dbInfo = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

module.exports = {
    getPool: function () {
        return mysql.createPool(dbInfo);
    },
};

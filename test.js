const mysql = require("mysql2/promise");

const cors = require("cors");

var express = require("express");
var app = express();
//ar dbConfig = require(__dirname + "/config/db.js");

const dbInfo = {
    host: "localhost",
    port: "3306",
    user: "root",
    password: "@koreanumber1",
    database: "dreampluz",
};

var pool = mysql.createPool(dbInfo);
const port = 3000;

async function gogo() {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();

        var sql = "select * from URL where URl = 'www.11111'";
        const [rows, field] = await connection.query(sql);

        console.log(rows);

        await connection.commit();
        console.log("success!");
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}
gogo();

"use strict";
const mariadb = require("mariadb");

const managerPool = mariadb.createPool({
    database: "Bank",
    host: "localhost",
    user: "manager",
    password: "54321",
    connectionLimit: 5
});
const customerPool = mariadb.createPool({
    database: "Bank",
    host: "localhost",
    user: "customer",
    password: "12345",
    connectionLimit: 5
});

async function doesSsnExist(ssn) {
    // Verify that SSN is a string of 9 numbers
    if (! /^[0-9]{9}$/.test(ssn)) {
        return false;
    }

    let conn;
    try {
        conn = await customerPool.getConnection();
        const rows = await conn.query(`select Ssn from CUSTOMER where Ssn=${ssn}`);
        return (rows.length != 0);
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function getBioData(ssn) {
    if (! await doesSsnExist(ssn))
        throw Error("SSN does not exist");

    let conn;
    try {
        conn = await customerPool.getConnection();
        const row = await conn.query(`select * from CUSTOMER where Ssn=${ssn}`);
        const table = `<p>Name: ${row[0].Name}<br/>Phone number: ${row[0].Phone}<br/>Address: ${row[0].Address}`;
        return table;
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

module.exports.doesSsnExist = doesSsnExist;
module.exports.getBioData = getBioData;

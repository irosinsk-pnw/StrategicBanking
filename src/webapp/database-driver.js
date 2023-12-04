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

async function getAccounts(ssn) {
    let conn;
    try {
        conn = await customerPool.getConnection();
        const rows = await conn.query(`select Acct_num,Acct_type,Balance,Amount*100 as Percent from (DEPOSIT natural join CUST_ACCT join RATE on Rate = Rate_type) where Ssn = ${ssn}`);
        if (rows.length == 0)
            return "<p>No deposit accounts found.";

        let table = "<table><tr><th>Account number</th><th>Account type</th><th>Balance</th><th>Interest rate</th></tr>";
        for (let i in rows) {
            table += `<tr><td>${rows[i].Acct_num}</td><td>${rows[i].Acct_type}</td><td>${rows[i].Balance}</td><td>${rows[i].Percent}\%</td></tr>`;
        }
        table += "</table>";
        return table;
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function getLoans(ssn) {
    let conn;
    try {
        conn = await customerPool.getConnection();
        const rows = await conn.query(`select Loan_num, Loan_type, Balance, Payment_due, Months_remaining, Amount*100 as Percent from (LOAN natural join CUST_LOAN join RATE on Rate = RATE.Rate_type) where Ssn = ${ssn}`);
        if (rows.length == 0)
            return ["<p>No loans found.", ""];

        let table = "<table><tr><th>Account number</th><th>Loan type</th><th>Balance</th><th>Next payment due</th><th>Months remaining</th><th>Interest rate</th></tr>";
        for (let i in rows) {
            table += `<tr><td>${rows[i].Loan_num}</td><td>${rows[i].Loan_type}</td><td>${rows[i].Balance}</td><td>${rows[i].Payment_due}</td><td>${rows[i].Months_remaining}</td><td>${rows[i].Percent}\%</td></tr>`;
        }
        table += "</table>";

        let paymentForm = `<p>Make a payment:\n<form method="POST">`;
        for (let i in rows) {
            paymentForm += `<input type="radio" id="${i}" name="lnum" value="${rows[i].Loan_num}">`
            paymentForm += `<label for="${i}">${rows[i].Loan_num}</label><br>`
        }
        paymentForm += `<label for="amount">Amount: $</label>\
                        <input type="text" id="amount" name="amount"><br>\
                        <input type="submit" value="Submit"></form>`;
        return [table, paymentForm];
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function makePayment(ssn, lnum, amount) {
    // Ensure loan num is 10 digits and amount matches money format
    if (! /^[0-9]{10}$/.test(lnum) || ! /^[0-9]+(\.[0-9]{2})?$/.test(amount))
        return false;

    let conn;
    try {
        conn = await customerPool.getConnection();
        const row = await conn.query(`select Balance, Payment_due from (LOAN natural join CUST_LOAN) where Ssn = ${ssn} and Loan_num = ${lnum}`);
        if (row.length != 1)
            return false;

        const balance = Number(row[0].Balance);
        const paymentDue = Number(row[0].Payment_due);
        const payment = Number(amount);

        if (payment > balance)
            return false;

        const result = await conn.query(`update LOAN set Balance=${balance-payment}, Payment_due=${Math.max(0, paymentDue-payment)} where Loan_num = ${lnum}`);
        if (result.affectedRows == 0)
            return false;
        if (result.affectedRows != 1 || result.warningStatus != 0)
            console.log(`SSN: ${ssn} | Loan number: ${lnum} | Amount: ${amount} | Result: ${JSON.stringify(result)}`);
        return true;
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}


module.exports.doesSsnExist = doesSsnExist;
module.exports.getBioData = getBioData;
module.exports.getAccounts = getAccounts;
module.exports.getLoans = getLoans;
module.exports.makePayment = makePayment;

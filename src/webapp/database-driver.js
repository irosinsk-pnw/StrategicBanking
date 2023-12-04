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
            table += `<tr><td>${rows[i].Acct_num}</td><td>${rows[i].Acct_type}</td><td>\$${rows[i].Balance}</td><td>${rows[i].Percent}\%</td></tr>`;
        }
        table += "</table>";

        let transacForm = `<p>Make a transaction:\n<form method="POST">
                           <input type="radio" id="deposit" name="type" value="deposit"> \
                           <label for="deposit">Deposit</label><br>
                           <input type="radio" id="withdraw" name="type" value="withdraw"> \
                           <label for="withdraw">Withdraw</label><br><br>`;
        for (let i in rows) {
            transacForm += `<input type="radio" id="${i}" name="anum" value="${rows[i].Acct_num}">`
            transacForm += `<label for="${i}">${rows[i].Acct_num}</label><br>`
        }

        transacForm += `<label for="amount">Amount: $</label>\
                        <input type="text" id="amount" name="amount"><br>\
                        <input type="submit" value="Submit"></form>`;
        return [table, transacForm];
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
            table += `<tr><td>${rows[i].Loan_num}</td><td>${rows[i].Loan_type}</td><td>\$${rows[i].Balance}</td><td>\$${rows[i].Payment_due}</td><td>${rows[i].Months_remaining}</td><td>${rows[i].Percent}\%</td></tr>`;
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

async function transact(ssn, anum, amount, type) {
    // Ensure account num is 10 digits and amount matches money format
    if (! /^[0-9]{10}$/.test(anum) || ! /^[0-9]+(\.[0-9]{2})?$/.test(amount))
        return false;

    let conn;
    try {
        conn = await customerPool.getConnection();
        const row = await conn.query(`select Balance, Fee from (DEPOSIT natural join CUST_ACCT) where Ssn = ${ssn} and Acct_num = ${anum}`);
        if (row.length != 1)
            return false;

        const balance = Number(row[0].Balance);
        let fee = Number(row[0].Fee);
        if (type == "withdraw")
            amount = -Number(amount);
        else if (type == "deposit")
            amount = Number(amount);
        else
            return false;

        if (amount < 0 && balance + amount < 0)
            fee += 25;

        const result = await conn.query(`update DEPOSIT set Balance=${balance+amount}, Fee=${fee} where Acct_num = ${anum}`);
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

async function getBankData() {
    let conn;
    try {
        conn = await managerPool.getConnection();

        // Holy linewrap, Batman!
        const aoc = await conn.query(`WITH FFLOAN(Balance, Percent) AS (SELECT Balance, Amount AS Percent FROM (LOAN JOIN RATE ON Rate = Rate_type) WHERE Loan_num IN (SELECT Loan_num FROM FED_FUNDS_LOAN)), FFDEP(Balance, Percent) AS (SELECT Balance, Amount AS Percent FROM (DEPOSIT JOIN RATE ON Rate = Rate_type) WHERE Deposit_type = "fedfunds") SELECT 4 * SUM(FFDEP.Balance * (1+FFDEP.Percent)) - SUM(FFLOAN.Balance * (1+FFLOAN.Percent)) AS Operating_cost FROM FFLOAN, FFDEP`);

        const equity = await conn.query(`SELECT SUM(LOAN.Balance) + SUM(CUST_LOAN.Fee) + SUM(DEPOSIT.Fee) - SUM(DEPOSIT.Balance) AS Equity FROM LOAN, CUST_LOAN, DEPOSIT`);

        let bankdata = `Total bank equity: \$${equity[0].Equity}<br>Operating cost (annualized): \$${aoc[0].Operating_cost}`;
        return bankdata;
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function getCustomers() {
    let conn;
    try {
        conn = await managerPool.getConnection();
        const rows = await conn.query("select * from CUSTOMER");
        if (rows.length == 0)
            return "<p>No customers found.";

        let table = "<table><tr><th>SSN</th><th>Name</th><th>Phone number</th><th>Address</th></tr>";
        for (let i in rows) {
            table += `<tr><td>${rows[i].Ssn}</td><td>${rows[i].Name}</td><td>${rows[i].Phone}</td><td>${rows[i].Address}</td></tr>`;
        }
        table += "</table>";

        let form = `<p>Add a customer:\n<form method="POST">\
                    <label for="ssn">SSN:</label>\
                    <input type="text" id="ssn" name="ssn"><br>\
                    <label for="name">Name:</label>\
                    <input type="text" id="name" name="name"><br>\
                    <label for="phone">Phone number:</label>\
                    <input type="text" id="phone" name="phone"><br>\
                    <label for="address">Address:</label>\
                    <input type="text" id="address" name="address"><br>\
                    <input type="submit" value="Submit">
                    </form>`;

        return [table, form];
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function createCustomer(ssn, name, phone, address) {
    if (! /^[0-9]{9}$/.test(ssn))
        return "<p>Invalid SSN. Must be 9 digits.";
    if (! /^[0-9]{1,15}$/.test(phone))
        return "<p>Invalid phone number. Must be 1 to 15 digits.";
    if (! /^[a-zA-Z0-9 \-\.]{1,255}$/.test(name))
        return "<p>Invalid name. Must only contain alphanumerics, spaces, hyphens, and periods.";
    if (! /^[a-zA-Z0-9 \-\.,]{1,255}$/.test(address))
        return "<p>Invalid address. Must only contain alphanumerics, spaces, hyphens, commas, and periods.";

    let conn;
    try {
        conn = await managerPool.getConnection();
        const person = await conn.query(`select Ssn from CUSTOMER where Ssn = ${ssn}`);
        if (person.length != 0)
            return "<p>Customer with this SSN already exists.";

        const result = await conn.query(`insert into CUSTOMER SET Ssn = ${ssn}, Name = "${name}", Phone = ${phone}, Address = "${address}"`);

        if (result.warningStatus != 0)
            return "<p>An unknown error has occurred.";
        return "<p>Customer added successfully.";
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
module.exports.transact = transact;
module.exports.getBankData = getBankData;
module.exports.getCustomers = getCustomers;
module.exports.createCustomer = createCustomer;

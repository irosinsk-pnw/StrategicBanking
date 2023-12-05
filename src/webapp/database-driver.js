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
    if (! /^[0-9]{10}$/.test(anum) || ! /^[0-9]*(\.[0-9]{2})?$/.test(amount))
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
    if (! /^[0-9]{10}$/.test(lnum) || ! /^[0-9]*(\.[0-9]{2})?$/.test(amount))
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

        let form = `<form method="POST">\
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

async function getAllAccounts() {
    let conn;
    try {
        conn = await managerPool.getConnection();
        const rows = await conn.query("select * from (DEPOSIT natural join CUST_ACCT)");
        if (rows.length == 0)
            return "<p>No loans found.";

        let table = "<table><tr><th>SSN</th><th>Account number</th><th>Balance</th><th>Account type</th><th>Rate class</th></tr>";
        for (let i in rows) {
            table += `<tr><td>${rows[i].Ssn}</td><td>${rows[i].Acct_num}</td><td>\$${rows[i].Balance}</td><td>${rows[i].Acct_type}</td><td>${rows[i].Rate}</td></tr>`;
        }
        table += "</table>";

        let form = `<form method="POST">\
                    <label for="ssn">SSN:</label>\
                    <input type="text" id="ssn" name="ssn"><br>\
                    <label for="anum">Account number:</label>\
                    <input type="text" id="anum" name="anum"><br>\
                    <label for="balance">Balance: $</label>\
                    <input type="text" id="balance" name="balance"><br>\
                    <label for="rate">Interest rate class:</label>\
                    <input type="text" id="rate" name="rate"><br>\
                    <label for="ltype">Account type:</label>\
                    <input type="text" id="atype" name="atype"><br>\
                    <input type="submit" value="Submit">\
                    </form>`;

        return [table, form];
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function createAccount(ssn, anum, balance, rate, atype) {
    if (! /^[0-9]{9}$/.test(ssn))
        return "<p>Invalid SSN. Must be 9 digits.";
    if (! /^[0-9]{10}$/.test(anum))
        return "<p>Invalid account number. Must be 10 digits.";
    if (! /^[0-9]*(\.[0-9]{2})?$/.test(balance))
        return "<p>Invalid money format.";
    if (! /^[a-zA-Z0-9]{1,255}$/.test(rate))
        return "<p>Invalid rate class.";
    if (! /^[a-zA-Z0-9 \-]{1,255}$/.test(atype))
        return "<p>Account type may only contain alphanumerics, spaces, or hyphens.";

    balance = Number(balance);
    let conn;
    try {
        conn = await managerPool.getConnection();
        let empty = await conn.query(`select Ssn from CUSTOMER where Ssn = "${ssn}"`);
        if (empty.length == 0)
            return "<p>Customer does not yet exist.";

        empty = await conn.query(`select Rate_type from RATE where Rate_type = "${rate}"`);
        if (empty.length == 0)
            return "<p>No such interest rate class.";

        empty = await conn.query(`select Acct_num from DEPOSIT where Acct_num = "${anum}"`);
        if (empty.length != 0)
            return "<p>Account number already in use.";

        await conn.query(`insert into DEPOSIT set Acct_num="${anum}", Balance=${balance}, Rate="${rate}", Acct_type="${atype}", Fee=0, Deposit_type="customer"`);
        await conn.query(`insert into CUST_ACCT set Ssn="${ssn}", Acct_num="${anum}"`);
        return "<p>Account created successfully.";
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function getAllLoans() {
    let conn;
    try {
        conn = await managerPool.getConnection();
        const rows = await conn.query("select * from (LOAN natural join CUST_LOAN)");
        if (rows.length == 0)
            return "<p>No loans found.";

        let table = "<table><tr><th>SSN</th><th>Loan number</th><th>Balance</th><th>Next payment due</th><th>Months remaining</th><th>Rate class</th><th>Loan type</th></tr>";
        for (let i in rows) {
            table += `<tr><td>${rows[i].Ssn}</td><td>${rows[i].Loan_num}</td><td>\$${rows[i].Balance}</td><td>\$${rows[i].Payment_due}</td><td>${rows[i].Months_remaining}</td><td>${rows[i].Rate}</td><td>${rows[i].Loan_type}</td></tr>`;
        }
        table += "</table>";

        let form = `<form method="POST">\
                    <label for="ssn">SSN:</label>\
                    <input type="text" id="ssn" name="ssn"><br>\
                    <label for="lnum">Loan number:</label>\
                    <input type="text" id="lnum" name="lnum"><br>\
                    <label for="balance">Amount: $</label>\
                    <input type="text" id="balance" name="balance"><br>\
                    <label for="rate">Interest rate class:</label>\
                    <input type="text" id="rate" name="rate"><br>\
                    <input type="radio" id="fixed" name="rtype" value="fixed">\
                    <label for="fixed">Fixed-rate</label><br>\
                    <input type="radio" id="variable" name="rtype" value="variable">\
                    <label for="variable">Variable</label><br>\
                    <label for="ltype">Loan type:</label>\
                    <input type="text" id="ltype" name="ltype"><br>\
                    <label for="months">Months:</label>\
                    <input type="text" id="months" name="months"><br>\
                    <label for="rate">Payment per month: $</label>\
                    <input type="text" id="paymentDue" name="paymentDue"><br>\
                    <input type="submit" value="Submit">\
                    </form>`;

        return [table, form];
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function createLoan(ssn, lnum, balance, rate, ltype, rtype, months, paymentDue) {
    if (! /^[0-9]{9}$/.test(ssn))
        return "<p>Invalid SSN. Must be 9 digits.";
    if (! /^[0-9]{10}$/.test(lnum))
        return "<p>Invalid loan number. Must be 10 digits.";
    if (! /^[0-9]*(\.[0-9]{2})?$/.test(balance))
        return "<p>Invalid money format.";
    if (! /^[a-zA-Z0-9]{1,255}$/.test(rate))
        return "<p>Invalid rate class.";
    if (! /^[a-zA-Z0-9 \-]{1,255}$/.test(ltype))
        return "<p>Account type may only contain alphanumerics, spaces, or hyphens.";
    if (rtype != "fixed" && rtype != "variable")
        return "<p>Quit messing with the HTML.";
    if (! /^[0-9]+$/.test(months))
        return "<p>Invalid months.";
    if (! /^[0-9]*(\.[0-9]{2})?$/.test(paymentDue))
        return "<p>Invalid money format.";

    balance = Number(balance);
    months = Number(months);
    paymentDue = Number(paymentDue);
    let conn;
    try {
        conn = await managerPool.getConnection();
        let empty = await conn.query(`select Ssn from CUSTOMER where Ssn = "${ssn}"`);
        if (empty.length == 0)
            return "<p>Customer does not yet exist.";

        empty = await conn.query(`select Rate_type from RATE where Rate_type = "${rate}"`);
        if (empty.length == 0)
            return "<p>No such interest rate class.";

        empty = await conn.query(`select Loan_num from LOAN where Loan_num = "${lnum}"`);
        if (empty.length != 0)
            return "<p>Loan number already in use.";

        await conn.query(`insert into LOAN set Loan_num="${lnum}", Balance=${balance}, Payment_due=${paymentDue}, Rate="${rate}"`);
        await conn.query(`insert into CUST_LOAN set Loan_num="${lnum}", Ssn="${ssn}", Months_remaining=${months}, Rate_type="${rtype}", Loan_type="${ltype}", Fee=0`);
        return "<p>Loan created successfully.";
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function getFedFunds() {
    let conn;
    try {
        conn = await managerPool.getConnection();
        const lendrows = await conn.query("select Loan_num, Balance, Bank_name from (LOAN natural join FED_FUNDS_LOAN)");
        if (lendrows.length == 0)
            return "<p>No loans found.";

        let lendtable = "<table><tr><th>Loan number</th><th>Bank</th><th>Balance</th></tr>";
        for (let i in lendrows) {
            lendtable += `<tr><td>${lendrows[i].Loan_num}</td><td>${lendrows[i].Bank_name}</td><td>\$${lendrows[i].Balance}</td></tr>`;
        }
        lendtable += "</table>";

        const borrowrows = await conn.query("select Acct_num, Balance, Bank_name from DEPOSIT where Deposit_type = \"fedfunds\"");
        if (borrowrows.length == 0)
            return "<p>No borrows found.";

        let borrowtable = "<table><tr><th>Deposit number</th><th>Bank</th><th>Balance</th></tr>";
        for (let i in borrowrows) {
            borrowtable += `<tr><td>${borrowrows[i].Acct_num}</td><td>${borrowrows[i].Bank_name}</td><td>\$${borrowrows[i].Balance}</td></tr>`;
        }
        borrowtable += "</table>";

        let form = `<form method="POST">\
                    <input type="radio" id="lend" value="lend" name="type">\
                    <label for="lend">Lend</label><br>\
                    <input type="radio" id="borrow" value="borrow" name="type">\
                    <label for="borrow">Borrow</label><br>\
                    <label for="name">Bank:</label>\
                    <input type="text" id="name" name="name"><br>\
                    <label for="address">Bank address:</label>\
                    <input type="text" id="address" name="address"><br>\
                    <label for="lnum">Account number:</label>\
                    <input type="text" id="lnum" name="lnum"><br>\
                    <label for="balance">Amount: $</label>\
                    <input type="text" id="balance" name="balance"><br>\
                    <input type="submit" value="Submit">\
                    </form>`;

        return [lendtable, borrowtable, form];
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function createFedFunds(name, address, lnum, balance, type) {
    // Check for valid fields
    if (! /^[a-zA-Z0-9 \-\.]{1,255}$/.test(name))
        return "<p>Invalid name. Must only contain alphanumerics, spaces, hyphens, and periods.";
    if (! /^[a-zA-Z0-9 \-\.,]{1,255}$/.test(address))
        return "<p>Invalid address. Must only contain alphanumerics, spaces, hyphens, commas, and periods.";
    if (! /^[0-9]{10}$/.test(lnum))
        return "<p>Invalid account number. Must be 10 digits.";
    if (! /^[0-9]*(\.[0-9]{2})?$/.test(balance))
        return "<p>Invalid money format.";
    if (!(type == "lend") && !(type == "borrow"))
        return "<p>Quit editing the HTML.";

    balance = Number(balance);

    const lend = (type == "lend")
    let conn;
    try {
        conn = await managerPool.getConnection();
        const bank = await conn.query(`select Name from EXTERN_BANK where Name = "${name}"`);
        if (bank.length != 0)
            return "<p>Each bank can only borrow or lend once.";

        let account;
        if (lend) {
            account = await conn.query(`select Loan_num from LOAN where Loan_num = ${lnum}`);
        } else {
            account = await conn.query(`select Acct_num from DEPOSIT where Acct_num = ${lnum}`);
        }
        if (account.length != 0)
            return "<p>Account number is already in use.";

        await conn.query(`insert into EXTERN_BANK set Name="${name}", Address="${address}"`);
        if (lend) {
            await conn.query(`insert into LOAN set Loan_num="${lnum}", Balance=${balance}, Rate="FedFundsOvernight"`);
            await conn.query(`insert into FED_FUNDS_LOAN set Loan_num="${lnum}", Bank_name="${name}"`);
        } else {
            await conn.query(`insert into DEPOSIT set Acct_num="${lnum}", Balance=${balance}, Rate="FedFundsOvernight", Bank_name="${name}", Deposit_type="fedfunds"`);
        }
        return "<p>Addition successful.";
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function getRates() {
    let conn;
    try {
        conn = await managerPool.getConnection();
        const rows = await conn.query("select Rate_type, Amount*100 as Percent from RATE");
        if (rows.length == 0)
            return "<p>No rates found.";

        let table = "<table><tr><th>Rate class</th><th>Amount</th></tr>";
        for (let i in rows) {
            table += `<tr><td>${rows[i].Rate_type}</td><td>${rows[i].Percent}%</td></tr>`;
        }
        table += "</table>";

        let form = `<form method="POST">\
                    <label for="rtype">Class:</label>\
                    <input type="text" id="rtype" name="rtype"><br>\
                    <label for="amount">Amount:</label>\
                    <input type="text" id="amount" name="amount">%<br>\
                    <input type="submit" value="Submit">
                    </form>`;
        return [table, form];
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

async function modifyRate(rtype, amount) {
    if (! /^[a-zA-Z]{1,255}$/.test(rtype))
        return "<p>Invalid rate class.";
    if (! /^[0-9]{0,2}(\.[0-9]{1,4})?$/.test(amount))
        return "<p>Invalid rate.";

    amount = Number(amount)/100;

    let conn;
    try {
        conn = await managerPool.getConnection();
        let oldRate = await conn.query(`select * from RATE where Rate_type = "${rtype}"`);

        if (oldRate.length == 0)
            return "<p>No such rate class.";

        oldRate = Number(oldRate[0].Amount);

        const result = await conn.query(`WITH TEMP(Balance, Percent) AS (SELECT Balance, Amount AS Percent FROM (LOAN JOIN RATE ON Rate = Rate_type) WHERE Rate_type = "${rtype}") SELECT SUM(Balance * (${amount})) - SUM(Balance * Percent) AS Profit FROM TEMP`);

        await conn.query(`update RATE set Amount=${amount} where Rate_type = "${rtype}"`);
        return `<p>Annual profit will change by \$${result[0].Profit}`;
    } catch (e) {
        throw e;
    } finally {
        if (conn) conn.end();
    }
}

module.exports = {
    doesSsnExist: doesSsnExist,
    getBioData: getBioData,
    getAccounts: getAccounts,
    getLoans: getLoans,
    makePayment: makePayment,
    transact: transact,
    getBankData: getBankData,
    getCustomers: getCustomers,
    createCustomer: createCustomer,
    getAllAccounts: getAllAccounts,
    createAccount: createAccount,
    getAllLoans: getAllLoans,
    createLoan: createLoan,
    getFedFunds: getFedFunds,
    createFedFunds: createFedFunds,
    getRates: getRates,
    modifyRate: modifyRate
};

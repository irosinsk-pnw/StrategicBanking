"use strict";

const driver = require("./database-driver.js");

const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");
const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded());
app.use(cookieSession({
    name: "session",
    keys: ["secret-key"],
    sameSite: true
}));
app.set("views", "./views");
app.set("view engine", "pug");

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "html", "index.html"));
});

app.get("/stylesheet.css", function(req, res) {
    res.sendFile(path.join(__dirname, "stylesheet.css"));
});

// If user is not logged in, show a login page.
// Otherwise, redirect to /customer
app.get("/login", function (req, res) {
    if (!req.session.ssn)
        res.render("login", {failed: false});
    else
        res.redirect("/customer");
});

// Log user in
app.post("/login", async function (req, res) {
    if (!(await driver.doesSsnExist(req.body.ssn)))
        res.render("login", {failed: true});
    else {
        req.session.ssn = req.body.ssn;
        res.redirect("/customer");
    }
});

// Log user out
app.get("/logout", function (req, res) {
    req.session = null;
    res.redirect("/login");
});

app.get("/customer", async function (req, res) {
    if (!req.session.ssn || !(await driver.doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const biodata = await driver.getBioData(req.session.ssn);
        res.render('customer', {biodata: biodata});
    }
});

app.get("/customer/accounts", async function (req, res) {
    if (!req.session.ssn || !(await driver.doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const [table, form] = await driver.getAccounts(req.session.ssn);
        res.render("accounts", {table: table, form: form});
    }
});

// Make account transaction
app.post("/customer/accounts", async function (req, res) {
    if (!req.session.ssn || !(await driver.doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const success = await driver.transact(req.session.ssn, req.body.anum, req.body.amount, req.body.type);
        const [table, form] = await driver.getAccounts(req.session.ssn);
        if (success)
            res.render("accounts", {table: table, form: form, success: true});
        else
            res.render("accounts", {table: table, form: form, failed: true});
    }
});

app.get("/customer/loans", async function (req, res) {
    if (!req.session.ssn || !(await driver.doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const [table, form] = await driver.getLoans(req.session.ssn);
        res.render("loans", {table: table, form: form});
    }
});

// Make loan payment
app.post("/customer/loans", async function (req, res) {
    if (!req.session.ssn || !(await driver.doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const success = await driver.makePayment(req.session.ssn, req.body.lnum, req.body.amount);
        const [table, form] = await driver.getLoans(req.session.ssn);
        if (success)
            res.render("loans", {table: table, form: form, success: true});
        else
            res.render("loans", {table: table, form: form, failed: true});
    }
});


app.get("/manager", async function (req, res) {
    const bankdata = await driver.getBankData();
    res.render("manager", {bankdata: bankdata});
});

app.get("/manager/customers", async function (req, res) {
    const [table, form] = await driver.getCustomers();
    res.render("allcustomers", {table: table, form: form});
});

// Create a customer
app.post("/manager/customers", async function (req, res) {
    const results = await driver.createCustomer(req.body.ssn, req.body.name, req.body.phone, req.body.address);
    const [table, form] = await driver.getCustomers();
    res.render("allcustomers", {table: table, form: form, results: results});
});

app.get("/manager/accounts", async function (req, res) {
    const [table, form] = await driver.getAllAccounts();
    res.render("allaccounts", {table: table, form: form});
});

// Create an account
app.post("/manager/accounts", async function (req, res) {
    const results = await driver.createAccount(req.body.ssn, req.body.anum, req.body.balance, req.body.rate, req.body.atype);
    const [table, form] = await driver.getAllAccounts();
    res.render("allaccounts", {table: table, form: form, results: results});
});

app.get("/manager/loans", async function (req, res) {
    const [table, form] = await driver.getAllLoans();
    res.render("allloans", {table: table, form: form});
});

// Create a loan
app.post("/manager/loans", async function (req, res) {
    const results = await driver.createLoan(req.body.ssn, req.body.lnum, req.body.balance, req.body.rate, req.body.ltype, req.body.rtype, req.body.months, req.body.paymentDue);
    const [table, form] = await driver.getAllLoans();
    res.render("allloans", {table: table, form: form, results: results});
});

app.get("/manager/fedfunds", async function (req, res) {
    const [lendtable, borrowtable, form] = await driver.getFedFunds();
    res.render("fedfunds", {lendtable: lendtable, borrowtable: borrowtable, form: form});
});

// Add a federal fund loan
app.post("/manager/fedfunds", async function (req, res) {
    const results = await driver.createFedFunds(req.body.name, req.body.address, req.body.lnum, req.body.balance, req.body.type);
    const [lendtable, borrowtable, form] = await driver.getFedFunds();
    res.render("fedfunds", {lendtable: lendtable, borrowtable: borrowtable, form: form, results: results});
});

app.get("/manager/rates", async function (req, res) {
    const [table, form] = await driver.getRates();
    res.render("rates", {table: table, form: form});
});

// Alter an interest rate
app.post("/manager/rates", async function (req, res) {
    const results = await driver.modifyRate(req.body.rtype, req.body.amount);
    const [table, form] = await driver.getRates();
    res.render("rates", {table: table, form: form, results: results});
});

app.listen(port, function(){
    console.log(`Listening on ${port}`);
});

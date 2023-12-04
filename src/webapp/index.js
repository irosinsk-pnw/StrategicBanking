"use strict";

const {doesSsnExist,
       getBioData,
       getAccounts,
       getLoans,
       makePayment,
       transact
} = require("./database-driver.js");

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
    if (!(await doesSsnExist(req.body.ssn)))
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
    if (!req.session.ssn || !(await doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const biodata = await getBioData(req.session.ssn);
        res.render('customer', {biodata: biodata});
    }
});

app.get("/customer/accounts", async function (req, res) {
    if (!req.session.ssn || !(await doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const [acctTable, transacForm] = await getAccounts(req.session.ssn);
        res.render("accounts", {acctTable: acctTable, transacForm: transacForm});
    }
});

// Make account transaction
app.post("/customer/accounts", async function (req, res) {
    if (!req.session.ssn || !(await doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const success = await transact(req.session.ssn, req.body.anum, req.body.amount, req.body.type);
        const [acctTable, transacForm] = await getAccounts(req.session.ssn);
        if (success)
            res.render("accounts", {acctTable: acctTable, transacForm: transacForm, success: true});
        else
            res.render("accounts", {acctTable: acctTable, transacForm: transacForm, failed: true});
    }
});

app.get("/customer/loans", async function (req, res) {
    if (!req.session.ssn || !(await doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const [loanTable, paymentForm] = await getLoans(req.session.ssn);
        res.render("loans", {loanTable: loanTable, paymentForm: paymentForm});
    }
});

// Make loan payment
app.post("/customer/loans", async function (req, res) {
    if (!req.session.ssn || !(await doesSsnExist(req.session.ssn)))
        res.redirect("/login");
    else {
        const success = await makePayment(req.session.ssn, req.body.lnum, req.body.amount);
        const [loanTable, paymentForm] = await getLoans(req.session.ssn);
        if (success)
            res.render("loans", {loanTable: loanTable, paymentForm: paymentForm, success: true});
        else
            res.render("loans", {loanTable: loanTable, paymentForm: paymentForm, failed: true});
    }
});


app.get("/manager", function (req, res) {
    res.render("manager");
});

app.listen(port, function(){
    console.log(`Listening on ${port}`);
});

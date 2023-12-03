"use strict";

const {doesSsnExist, getBioData} = require("./database-driver.js");

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
    const exists = await doesSsnExist(req.body.ssn);
    if (!exists)
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
    if (!req.session.ssn)
        res.redirect("/login");
    else {
        const biodata = await getBioData(req.session.ssn);
        res.render('customer', { ssn: req.session.ssn, biodata: biodata});
    }
});

app.get("/manager", function (req, res) {
    res.sendFile(path.join(__dirname, "html", "manager.html"));
});

app.listen(port, function(){
    console.log(`Listening on ${port}`);
});

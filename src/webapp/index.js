"use strict";
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


app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "html", "index.html"));
});

app.get("/login", function (req, res) {
    console.log(req.session);
    res.sendFile(path.join(__dirname, "html", "login.html"));
});
app.post("/login", function (req, res) {
    req.session.ssn = req.body.ssn;
    res.sendFile(path.join(__dirname, "html", "login.html"));
});

app.get("/manager", function (req, res) {
    res.sendFile(path.join(__dirname, "html", "manager.html"));
});
app.listen(port, function(){
    console.log(`Listening on ${port}`);
});
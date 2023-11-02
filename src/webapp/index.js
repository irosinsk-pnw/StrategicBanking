"use strict";
const express = require("express");
const path = require("path");
const ex = express();
const port = 8080;

ex.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "html", "index.html"));
});
ex.get("/login", function (req, res) {
    res.sendFile(path.join(__dirname, "html", "login.html"));
});
ex.get("/manager", function (req, res) {
    res.sendFile(path.join(__dirname, "html", "manager.html"));
});
ex.listen(port, function(){
    console.log(`Listening on ${port}`);
});
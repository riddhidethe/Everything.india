const express = require('express');
const path = require('path');
const mysql = require('mysql');
var data = {};
const connection = require('./dbSetup.js');

const conn = connection();

// Function to get data form the database and send that to the Frontend
function dbgetData(req, res, query = 'show tables', view = 'none') {
    conn.query(query, (err, result, fields) => {
        if (err)
            console.log(err);
        else {
            data.rows = result;
            view == 'none' ? res.json(data) : res.render(view, data);
        }
    })
}

// Function for performing DML operations and redirecting to another page
function dbdmlData(req, res, query, view) {
    var message = 'Successful';
    conn.query(query, (err, result) => {
        if (err)
            console.log(err);
        else
            res.render(view);
    })
}

function dbLogin(req, res, query, view) {
    conn.query(query, (err, result, fields) => {
        if (err)
            console.log(err);
        else {
            if (result.length > 0) {
                res.send('Logged In');
            }
        }
    })
}

module.exports = { dbgetData, dbdmlData, dbLogin };
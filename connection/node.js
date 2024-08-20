const { Client }= require('pg')


const client = new Client ({
    host: "localhost",
    user : "postgres",
    port : 32768,
    password : "postgrespw",
    database : "serumpun_jaya_indah"
})  

module.exports = client
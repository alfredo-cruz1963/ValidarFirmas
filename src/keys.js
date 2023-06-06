const config = require('./config');

module.exports = {

   
  database: {
    connectionLimit: 1000,
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
  }
 
  
 /* 
  //cuando se usa un hosting     
  database: {
    connectionLimit: 1000,
    host: 'sql.freedb.tech',
    user: 'freedb_acacias',
    password: 'NrCQ@kH9B6jE&Fe',
    database: 'freedb_Acacias'
  } 
 */

};



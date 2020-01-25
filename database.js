var mysql = require('mysql');

//database connection
  var connection = mysql.createConnection({
    host: '91.204.46.47',
    user: 'k121749_tester',
    password: 'tester',
    database:'k121749_Web_scharle'
});

connection.connect(function(err){
  if(err) throw err;
  console.log('connected');
});



module.exports = {
 
queryDB:(sql, variables = null) =>{
  return new Promise((resolve, reject) => {
      connection.query(sql, variables, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      })
    });
}
}


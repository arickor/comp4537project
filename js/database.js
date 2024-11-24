const mysql = require('mysql2');
const Utils = require('./utils');

// Database Connection
class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }

  connect() {
    this.connection.connect((err) => {
      if (err) throw err;
      console.log('Connected to database!');
    });
  }

  executeQuery(query, params, callback) {
    this.connection.query(query, params, (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results);
      }
    });
  }

  createUsersTable() {
    // Query to create the Users table if it doesn't exist
    const createUsersQuery = `
      CREATE TABLE IF NOT EXISTS Users (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(150) NOT NULL
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createUsersQuery, (err) => {
      if (err) throw err;
      console.log('Users table ready!');

      // Check if table is empty and insert admin user if needed
      const checkEmptyQuery = 'SELECT COUNT(*) AS count FROM Users';
      this.connection.query(checkEmptyQuery, (err, result) => {
        if (err) throw err;

        if (result[0].count === 0) {
          const insertAdminQuery =
            'INSERT INTO Users (email, password) VALUES (?, ?)';
          this.connection.query(
            insertAdminQuery,
            ['admin@admin.com', Utils.hashPassword('111')],
            (err, result) => {
              if (err) throw err;
              console.log('Admin user added to Users table.');

              const userId = result.insertId;
              const insertSecurityQuestionQuery =
                'INSERT INTO SecurityQuestions (user_id, question, answer) VALUES (?, ?, ?)';
              this.connection.query(
                insertSecurityQuestionQuery,
                [userId, 'Answer is admin', 'admin'],
                (err) => {
                  if (err) throw err;
                  console.log('Security question for admin user added.');
                }
              );
            }
          );
        }
      });

      // Now create the SecurityQuestions table with a foreign key to Users table
      this.createSecurityQuestionsTable();
    });
  }

  createUserRolesTable() {
    // Query to create the UserRoles table if it doesn't exist
    const createUserRolesQuery = `
      CREATE TABLE IF NOT EXISTS UserRoles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role VARCHAR(20) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=MyISAM;
    `;
    this.connection.query(createUserRolesQuery, (err) => {
      if (err) throw err;
      console.log('UserRoles table ready!');
    }
    );
  }

  createApiCallCountTable() {
    // Query to create the APICallCount table if it doesn't exist
    const createAPICallCountQuery = `
      CREATE TABLE IF NOT EXISTS APICallCountByUserId (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        api_count INT NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createAPICallCountQuery, (err) => {
      if (err) throw err;
      console.log('APICallCount table ready!');
    });
  }

  createColorTableByUserIdAndEmotion() {
    // Query to create the Color table if it doesn't exist
    const createColorTableQuery = `
      CREATE TABLE IF NOT EXISTS ColorByUserIdAndEmotion (
        user_id INT NOT NULL,
        emotion VARCHAR(20) NOT NULL,
        color VARCHAR(20) NOT NULL,
        PRIMARY KEY (user_id, emotion),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createColorTableQuery, (err) => {
      if (err) throw err;
      console.log('Color table ready!');
    });
  }

  createTotalApiCallsByEndPointAndMethod() {
    // Query to create the TotalApiCallsByEndPoint table if it doesn't exist
    const createTotalApiCallsByEndPointQuery = `
      CREATE TABLE IF NOT EXISTS TotalApiCallsByEndPoint (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(150) NOT NULL,
        method VARCHAR(10) NOT NULL,
        total_calls INT NOT NULL DEFAULT 0
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createTotalApiCallsByEndPointQuery, (err) => {
      if (err) throw err;
      console.log('TotalApiCallsByEndPoint table ready!');
    });
  }

  createSecurityQuestionsTable() {
    // Query to create the SecurityQuestions table if it doesn't exist
    const createSecurityQuestionsQuery = `
      CREATE TABLE IF NOT EXISTS SecurityQuestions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question VARCHAR(150) NOT NULL,
        answer VARCHAR(150) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createSecurityQuestionsQuery, (err) => {
      if (err) throw err;
      console.log('SecurityQuestions table ready!');
    });
  }
}

module.exports = Database;
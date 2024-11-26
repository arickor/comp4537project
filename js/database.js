const mysql = require("mysql2");
const Utils = require("./utils");

// Database Connection
class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }

  connect() {
    this.connection.connect((err) => {
      if (err) throw err;
      console.log("Connected to database!");
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
    const createUsersQuery = `
      CREATE TABLE IF NOT EXISTS Users (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(150) NOT NULL
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createUsersQuery, (err) => {
      if (err) throw err;
      console.log("Users table ready!");

      const checkEmptyQuery = "SELECT COUNT(*) AS count FROM Users";
      this.connection.query(checkEmptyQuery, (err, result) => {
        if (err) throw err;

        if (result[0].count === 0) {
          const insertAdminQuery =
            "INSERT INTO Users (email, password) VALUES (?, ?)";
          this.connection.query(
            insertAdminQuery,
            ["admin@admin.com", Utils.hashPassword("111")],
            (err, result) => {
              if (err) throw err;
              console.log("Admin user added to Users table.");

              const userId = result.insertId;
              const insertSecurityQuestionQuery =
                "INSERT INTO SecurityQuestions (user_id, question, answer) VALUES (?, ?, ?)";
              this.connection.query(
                insertSecurityQuestionQuery,
                [userId, "Answer is admin", "admin"],
                (err) => {
                  if (err) throw err;
                  console.log("Security question for admin user added.");
                }
              );
            }
          );
        }
      });

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
      console.log("UserRoles table ready!");
    });
  }

  createApiCallCountTable() {
    const createApiCallCountQuery = `
      CREATE TABLE IF NOT EXISTS APICallCountByUserId (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        api_count INT NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createApiCallCountQuery, (err) => {
      if (err) throw err;
      console.log("APICallCountByUserId table ready!");
    });
  }

  createColorTableByUserIdAndEmotion() {
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
      console.log("ColorByUserIdAndEmotion table ready!");
    });
  }

  createEndpointStatsTable() {
    const createEndpointStatsQuery = `
      CREATE TABLE IF NOT EXISTS EndpointStats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(150) NOT NULL,
        method VARCHAR(10) NOT NULL,
        request_count INT NOT NULL DEFAULT 0,
        UNIQUE (endpoint, method)
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createEndpointStatsQuery, (err) => {
      if (err) throw err;
      console.log("EndpointStats table ready!");
    });
  }

  createSecurityQuestionsTable() {
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
      console.log("SecurityQuestions table ready!");
    });
  }

  // Additional method to initialize all tables
  initializeTables() {
    this.createUsersTable();
    this.createUserRolesTable();
    this.createApiCallCountTable();
    this.createColorTableByUserIdAndEmotion();
    this.createEndpointStatsTable();
    console.log("All database tables initialized.");
  }
}

module.exports = Database;

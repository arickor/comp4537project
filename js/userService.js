const Utils = require('./utils');

// User service for managing user-related database operations
class UserService {
  constructor(database) {
    this.database = database;
  }

  registerUserWithSecurityQuestion(
    email,
    password,
    securityQuestion,
    answer,
    callback
  ) {
    const hashedPassword = Utils.hashPassword(password);

    const insertUserQuery = 'INSERT INTO Users (email, password) VALUES (?, ?)';
    this.database.executeQuery(
      insertUserQuery,
      [email, hashedPassword],
      (err, results) => {
        if (err) {
          callback(err, null);
          return;
        }

        const userId = results.insertId;
        const insertSecurityQuestionQuery =
          'INSERT INTO SecurityQuestions (user_id, question, answer) VALUES (?, ?, ?)';
        this.database.executeQuery(
          insertSecurityQuestionQuery,
          [userId, securityQuestion, answer],
          callback
        );
      }
    );
  }

  getUserByEmail(email, callback) {
    const query = 'SELECT * FROM Users WHERE email = ?';
    this.database.executeQuery(query, [email], (err, results) => {
      if (err) {
        callback(err, null);
        return;
      }
      if (results.length > 0) {
        callback(null, results[0]);
      } else {
        callback(null, null);
      }
    });
  }

  getAllUsers(callback) {
    const query = 'SELECT id, email, api_count FROM Users';
    this.database.executeQuery(query, [], (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results);
      }
    });
  }

  getSecurityQuestionByEmail(email, callback) {
    const query = `
      SELECT question FROM SecurityQuestions
      JOIN Users ON Users.id = SecurityQuestions.user_id
      WHERE Users.email = ?
    `;
    this.database.executeQuery(query, [email], (err, results) => {
      if (err || results.length === 0) {
        callback(err, null);
      } else {
        callback(null, results[0].question);
      }
    });
  }

  getSecurityAnswerByEmail(email, callback) {
    const query = `
      SELECT answer FROM SecurityQuestions
      JOIN Users ON Users.id = SecurityQuestions.user_id
      WHERE Users.email = ?
    `;
    this.database.executeQuery(query, [email], (err, results) => {
      if (err || results.length === 0) {
        callback(err, null);
      } else {
        callback(null, results[0].answer);
      }
    });
  }

  resetPassword(email, newPassword, callback) {
    const hashedPassword = Utils.hashPassword(newPassword);

    const query = `
    SELECT Users.id FROM Users
    WHERE Users.email = ?
  `;
    this.database.executeQuery(query, [email], (err, results) => {
      if (err || results.length === 0) {
        callback(err, false);
      } else {
        const userId = results[0].id;
        const updatePasswordQuery =
          'UPDATE Users SET password = ? WHERE id = ?';
        this.database.executeQuery(
          updatePasswordQuery,
          [hashedPassword, userId],
          (err) => {
            if (err) {
              callback(err, false);
            } else {
              callback(null, true);
            }
          }
        );
      }
    });
  }

  getApiCount(email, callback) {
    const query = 'SELECT api_count FROM Users WHERE email = ?';
    this.database.executeQuery(query, [email], (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results[0]?.api_count || 0);
      }
    });
  }

  incrementApiCount(email, callback) {
    const incrementQuery =
      'UPDATE Users SET api_count = api_count + 1 WHERE email = ?';
    this.database.executeQuery(incrementQuery, [email], callback);
  }
}

module.exports = UserService;

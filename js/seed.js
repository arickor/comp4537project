const Utils = require("./utils");

class Seed {
    constructor(database) {
        this.database = database;
      }
    seedUser() {
        const hashedPassword = Utils.hashPassword("user");
        const email = "user@user.com";
        const insertUserQuery = 'INSERT INTO Users (email, password) VALUES (?, ?)';
        this.database.executeQuery(
          insertUserQuery,
          [email, hashedPassword],
          (err, results) => {
            if (err) {
              console.log(err);
              return;
            }

            const insertUserRoleQuery = 'INSERT INTO UserRoles (user_id, role) VALUES (?, ?)';
            this.database.executeQuery(
              insertUserRoleQuery,
              [results.insertId, 'user'],
              (err, results) => {
                if (err) {
                  console.log(err);
                  return;
                }
              }
            );

            console.log("User seeded!");
          }
        );
    }
    
    seedAdmin() {
        const hashedPassword = Utils.hashPassword("admin");
        const email = "admin@admin.com";
        const insertUserQuery = 'INSERT INTO Users (email, password) VALUES (?, ?)';
        this.database.executeQuery(
          insertUserQuery,
          [email, hashedPassword],
          (err, results) => {
            if (err) {
              console.log(err);
              return;
            }

            const insertUserRoleQuery = 'INSERT INTO UserRoles (user_id, role) VALUES (?, ?)';
            this.database.executeQuery(
              insertUserRoleQuery,
              [results.insertId, 'admin'],
              (err, results) => {
                if (err) {
                  console.log(err);
                  return;
                }
              }
            );

            console.log("Admin seeded!");
          }
        );
    }

}

module.exports = Seed;

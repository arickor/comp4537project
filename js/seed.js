const Utils = require("./utils");

class Seed {
  constructor(database) {
    this.database = database;
  }

  seedUser() {
    const checkIfEmptyQuery = `SELECT COUNT(*) AS count FROM Users;`;

    this.database.executeQuery(checkIfEmptyQuery, [], (err, results) => {
      if (err) {
        console.error("Error checking Users table:", err.message);
        return;
      }

      const userCount = results[0].count;
      if (userCount === 0) {
        const hashedPassword = Utils.hashPassword("user");
        const email = "user@user.com";
        const insertUserQuery =
          "INSERT INTO Users (email, password) VALUES (?, ?)";
        this.database.executeQuery(
          insertUserQuery,
          [email, hashedPassword],
          (err, results) => {
            if (err) {
              console.error("Error seeding user:", err.message);
              return;
            }

            const insertUserRoleQuery =
              "INSERT INTO UserRoles (user_id, role) VALUES (?, ?)";
            this.database.executeQuery(
              insertUserRoleQuery,
              [results.insertId, "user"],
              (err) => {
                if (err) {
                  console.error("Error assigning user role:", err.message);
                  return;
                }
              }
            );

            console.log("User seeded!");
          }
        );
      } else {
        console.log("Users table is not empty. Skipping user seeding.");
      }
    });
  }

  seedAdmin() {
    const checkIfEmptyQuery = `SELECT COUNT(*) AS count FROM Users;`;

    this.database.executeQuery(checkIfEmptyQuery, [], (err, results) => {
      if (err) {
        console.error("Error checking Users table:", err.message);
        return;
      }

      const userCount = results[0].count;
      if (userCount === 0) {
        const hashedPassword = Utils.hashPassword("admin");
        const email = "admin@admin.com";
        const insertUserQuery =
          "INSERT INTO Users (email, password) VALUES (?, ?)";
        this.database.executeQuery(
          insertUserQuery,
          [email, hashedPassword],
          (err, results) => {
            if (err) {
              console.error("Error seeding admin:", err.message);
              return;
            }

            const insertUserRoleQuery =
              "INSERT INTO UserRoles (user_id, role) VALUES (?, ?)";
            this.database.executeQuery(
              insertUserRoleQuery,
              [results.insertId, "admin"],
              (err) => {
                if (err) {
                  console.error("Error assigning admin role:", err.message);
                  return;
                }
              }
            );

            console.log("Admin seeded!");
          }
        );
      } else {
        console.log("Users table is not empty. Skipping admin seeding.");
      }
    });
  }
}

module.exports = Seed;

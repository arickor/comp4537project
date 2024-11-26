const Utils = require("./utils");

class Seed {
  constructor(database) {
    this.database = database;
  }

  seedUser() {
    const checkUserQuery = `SELECT id FROM Users WHERE email = ?;`;
    const email = "user@user.com";

    this.database.executeQuery(checkUserQuery, [email], (err, results) => {
      if (err) {
        console.error("Error checking user existence:", err.message);
        return;
      }

      if (results.length === 0) {
        const hashedPassword = Utils.hashPassword("user");
        const insertUserQuery =
          "INSERT INTO Users (email, password) VALUES (?, ?)";
        this.database.executeQuery(
          insertUserQuery,
          [email, hashedPassword],
          (err, userResults) => {
            if (err) {
              console.error("Error seeding user:", err.message);
              return;
            }

            this.seedUserRole(userResults.insertId, "user");
          }
        );
      } else {
        console.log(
          `User with email '${email}' already exists. Skipping user seeding.`
        );
      }
    });
  }

  seedAdmin() {
    const checkAdminQuery = `SELECT id FROM Users WHERE email = ?;`;
    const email = "admin@admin.com";

    this.database.executeQuery(checkAdminQuery, [email], (err, results) => {
      if (err) {
        console.error("Error checking admin existence:", err.message);
        return;
      }

      if (results.length === 0) {
        const hashedPassword = Utils.hashPassword("admin");
        const insertAdminQuery =
          "INSERT INTO Users (email, password) VALUES (?, ?)";
        this.database.executeQuery(
          insertAdminQuery,
          [email, hashedPassword],
          (err, adminResults) => {
            if (err) {
              console.error("Error seeding admin:", err.message);
              return;
            }

            this.seedUserRole(adminResults.insertId, "admin");
          }
        );
      } else {
        console.log(
          `Admin with email '${email}' already exists. Skipping admin seeding.`
        );
      }
    });
  }

  seedUserRole(userId, role) {
    const checkRoleQuery = `SELECT * FROM UserRoles WHERE user_id = ? AND role = ?;`;

    this.database.executeQuery(
      checkRoleQuery,
      [userId, role],
      (err, results) => {
        if (err) {
          console.error("Error checking role existence:", err.message);
          return;
        }

        if (results.length === 0) {
          const insertRoleQuery =
            "INSERT INTO UserRoles (user_id, role) VALUES (?, ?)";
          this.database.executeQuery(insertRoleQuery, [userId, role], (err) => {
            if (err) {
              console.error("Error assigning role:", err.message);
              return;
            }
            console.log(`Role '${role}' assigned to user ID '${userId}'.`);
          });
        } else {
          console.log(
            `Role '${role}' already exists for user ID '${userId}'. Skipping role assignment.`
          );
        }
      }
    );
  }
}

module.exports = Seed;

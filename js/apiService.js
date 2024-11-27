class ApiService {
  constructor(database) {
    this.database = database;
  }

  incrementApiStats(userId, endpoint, method) {
    const userApiQuery = `
        INSERT INTO APICallCountByUserId (user_id, api_count)
        VALUES (?, 1)
        ON DUPLICATE KEY UPDATE api_count = api_count + 1;
      `;

    this.database.executeQuery(userApiQuery, [userId], (err) => {
      if (err) console.error("Error incrementing user API stats:", err.message);
    });

    const endpointQuery = `
        INSERT INTO EndpointStats (endpoint, method, request_count)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE request_count = request_count + 1;
      `;

    this.database.executeQuery(endpointQuery, [endpoint, method], (err) => {
      if (err) console.error('Error incrementing endpoint stats:', err.message);
    });
  }

  async getApiStats(callback) {
    try {
      const endpointQuery = `
        SELECT method, endpoint, request_count
        FROM EndpointStats;
      `;
      const endpointResults = await new Promise((resolve, reject) => {
        this.database.executeQuery(endpointQuery, [], (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        });
      });

      const userQuery = `
        SELECT u.id AS userId, u.email, a.api_count
        FROM Users u
        LEFT JOIN APICallCountByUserId a ON u.id = a.user_id;
      `;
      const userResults = await new Promise((resolve, reject) => {
        this.database.executeQuery(userQuery, [], (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        });
      });

      callback(null, { endpoints: endpointResults, users: userResults });
    } catch (err) {
      console.error('Error in getStats:', err);
      callback(err);
    }
  }
}

module.exports = ApiService;

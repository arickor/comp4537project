class ColorService {
    constructor(database) {
        this.database = database;
    }

    getEmotionAndColorByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT emotion, color FROM ColorByUserIdAndEmotion WHERE user_id = ?';
            this.database.executeQuery(query, [userId], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results);
                }
            });
        });
    }

    getColorByUserIdAndEmotion(userId, emotion) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT color FROM ColorByUserIdAndEmotion WHERE user_id = ? AND emotion = ?';
            this.database.executeQuery(query, [userId, emotion], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results[0].color);
                }
            });
        });
    }

    editColorByUserIdAndEmotion(userId, emotion, color) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE ColorByUserIdAndEmotion SET color = ? WHERE user_id = ? AND emotion = ?';
            this.database.executeQuery(query, [color, userId, emotion], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(results);
            });
        });
    }

    deleteColorByUserIdAndEmotion(userId, emotion) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM ColorByUserIdAndEmotion WHERE user_id = ? AND emotion = ?';
            this.database.executeQuery(query, [userId, emotion], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(results);
            });
        });
    }

    addColorByUserIdAndEmotion(userId, emotion, color) {
        return new Promise((resolve, reject) => {
            const checkQuery = 'SELECT * FROM ColorByUserIdAndEmotion WHERE user_id = ? AND emotion = ?';
            this.database.executeQuery(checkQuery, [userId, emotion], (err, results) => {
                if (err) {
                    reject(new Error('Database error occurred.'));
                    return;
                }
                if (results.length > 0) {
                    reject(new Error('A color data for this emotion alreay exists!'));
                    return;
                }

                const query = 'INSERT INTO ColorByUserIdAndEmotion (user_id, emotion, color) VALUES (?, ?, ?)';
                this.database.executeQuery(query, [userId, emotion, color], (err, results) => {
                    if (err) {
                        reject(new Error('Failed to insert color data.'));
                        return;
                    }
                    resolve(results);
                });
            });
        });
    }
}

module.exports = ColorService;

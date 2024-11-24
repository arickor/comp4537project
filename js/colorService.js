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
}

module.exports = ColorService;

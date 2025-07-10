const jwt = require('jsonwebtoken');
const SECRET = 'your-secret-key';

function generateToken(userId) {
    return jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    try {
        const { userId } = jwt.verify(auth.split(' ')[1], SECRET);
        req.userId = userId;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { generateToken, authMiddleware };

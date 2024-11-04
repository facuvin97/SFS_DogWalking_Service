const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importar el modelo si no lo has hecho

async function authMiddleware(req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Autorización requerida' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Formato de token no válido' });
    }

    const token = tokenParts[1];

    try {
        // Verifica el token usando el secreto JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.locals.token = decoded;

        const usuario = await User.findOne({ where: { id: decoded.userId } });

        if (!usuario) {
            return res.status(401).json({ message: 'Token no válido' });
        }

        res.locals.user = usuario;
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token no válido' });
    }
}

module.exports = authMiddleware;

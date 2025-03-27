const { expressjwt: expJwt } = require("express-jwt");
const { Token } = require("../models/token_model");

function authJwt() {
    const API = process.env.API_URL;
    return expJwt({
        secret: process.env.ACCESS_TOKEN_SECRET,
        algorithms: ["HS256"],
        isRevoked: isRevoked,
    }).unless({
        path: [
            `${API}/login`,
            `${API}/register`,
        ]
    });
}

async function isRevoked(req, jwt) {
    const authHeader = req.header("Authorization");
    if(!authHeader.startsWith("Bearer ")) {
        return true;
    }

    const accessToken = authHeader.replace("Bearer", "").trim();
    const token = Token.findOne({accessToken});

    return !token;
}

module.exports = authJwt;
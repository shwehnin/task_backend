const { default: mongoose } = require("mongoose");
const jwt  = require("jsonwebtoken");

async function authorizationPostRequests(req, res, next) {
    if(req.method !== "POST") return next();
    const API = process.env.API_URL;
    
    const endPoints = [
        `${API}/login`,
        `${API}/register`,
        `${API}/forgot-password`,
        `${API}/verify-reset-otp`,
        `${API}/reset-password`,
    ];

    const isMatchingEndPoint = endPoints.some((endpoint) => req.originalUrl.includes(endpoint));
    
    if(isMatchingEndPoint) return next();

    const message = "User conflict\nThe user making the request does not match the user in the request";

    const authHeader = req.header("Authorization");

    if(!authHeader) return next();

    const accessToken = authHeader.replace("Bearer", "").trim();
    const tokenData = jwt.decode(accessToken);

    if(req.body.user && tokenData.id !== req.body.user) {
        return res.status(401).json({
            message,
        })
    }else if(/\/users\/([^/]+)\//.test(req.originalUrl)) {
        const parts = req.originalUrl.split("/");
        const usersIndex = parts.indexOf("users");

        const id = parts[usersIndex + 1];
        if(!mongoose.isValidObjectId(id)) return next();

        if(tokenData.id !== id) return res.status(401).json({message});
    }
    return next();
}

module.exports = authorizationPostRequests;
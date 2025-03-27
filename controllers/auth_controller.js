const { validationResult } = require("express-validator");
const { User } = require("../models/user_model")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Token } = require("../models/token_model");
const { throwError, success } = require("../helpers/response");

let register = async(req, res, next) => {
    try{
        // check validation for required fields
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const errorMessages = errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
            }));
            return res.status(400).json({ errors: errorMessages });
        }
        // check email if exist or not
        let {email} = req.body;
        let existingUser = await User.findOne({email});
        if(existingUser) {
            throwError({message: "User with that email already exists", status: 409});
        }
        let user = User({
            ...req.body, email, passwordHash: bcrypt.hashSync(req.body.password, 8)
        });

        user = await user.save();
        if(!user) {
            throwError({message: "Could not create a new user", status: 500});
        }
        const createdData = await User.findById(user._id);
        let userObj = createdData.toObject();
        delete userObj.passwordHash;

        success(res, {status: 201, message: "Register successfully!", data: userObj});
    }catch(e) {
        next(e);
    }
}

let login = async(req, res, next) => {
    try{
        // check validation for required fields
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const errorMessages = errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
            }));
            return res.status(400).json({ errors: errorMessages });
        }

        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user) {
            throwError({message: `User doesn't exists!`, status: 404});
        }
        
        // compare password
        if(!bcrypt.compareSync(password, user.passwordHash)) {
            throwError({message: "Incorrect password!", status: 400});
        }

        const accessToken = jwt.sign(
            {id: user.id},
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: "24h"}
        );

        const refreshToken = jwt.sign(
            {id: user.id},
            process.env.REFRESH_TOKEN_SECRET, 
            {expiresIn: "60d"}
        );

        const token = await Token.findOne({userId: user.id});

        if(token) await token.deleteOne();
        await Token({userId: user.id, accessToken, refreshToken}).save();
        user.passwordHash = undefined;
        success(res, {message: "User login successfully!", status: 200, data: {user: {...user._doc}, accessToken, refreshToken}});
    }catch(e) {
        next(e);
    }
}

let refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        // Check if refreshToken is provided
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        // Check if refreshToken exists in the database
        const tokenData = await Token.findOne({ refreshToken });
        if (!tokenData) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Find the user associated with the token
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a new access token
        const newAccessToken = jwt.sign(
            { id: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "24h" } // Token valid for 24 hours
        );

        // Update token in the database
        tokenData.accessToken = newAccessToken;
        await tokenData.save();

        return res.status(200).json({
            accessToken: newAccessToken,
            message: "Access token refreshed successfully"
        });

    } catch (e) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

let getUser = async (req, res, next) => {
    try {
        let accessToken = req.headers.authorization;
        if (!accessToken) {
            throwError({message: "Unauthorized.", status: 401});
        }

        accessToken = accessToken.replace("Bearer", "").trim();

        const token = await Token.findOne({ accessToken });
        if (!token) {
            throwError({message: "Unauthenticated.", status: 401});
        }

        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            throwError({message: "Invalid token.", status: 403});
        }

        const user = await User.findById(decoded.id).select("-passwordHash");
        if (!user) {
            throwError({message: "User not found.", status: 404});
        }
        success(res, {message: "User Data", status: 200, data: user});
    } catch (e) {
        next(e);
    }
};

let logout = async(req, res, next) => {
    try{
        const authHeader = req.header("Authorization");
        if(!authHeader) {
            throwError({message: "No token provided!", status: 400});
        }

        // Extract access token from the Authorization header
        const accessToken = authHeader.replace("Bearer", "").trim();

        // Find the token in the database
        const token = await Token.findOne({accessToken});

        if(!token) {
            throwError({message: "Token not found!", status: 401});
        }

        // Delete both access and refresh tokens from the database
        await Token.deleteOne({accessToken: token.accessToken});

        await Token.deleteOne({refreshToken: token.refreshToken});
        success(res, {message: "Logged out successfully!", status: 200});
    }catch(e) {
        next(e);
    }
}

module.exports = {register, login, refreshAccessToken, logout, getUser}
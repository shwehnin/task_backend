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
            // throwError({message: errorMessages.map((e) => e.message) , status: 400});
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
        success(res, {status: 201, message: "Register successfully!", data: user});
    }catch(e) {
        next(e);
    }
}

let login = async(req, res, next) => {
    try{
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
        // success(res, {message: "User login successfully!", status: 201});
        return res.json({...user._doc, accessToken});
    }catch(e) {
        console.log(`Type e ${e.name} and ${e.message}`);
        next(e);
    }
}

let verifyToken = async(req, res, next) => {
    try{
        let accessToken = req.headers.authorization;
        if(!accessToken) return res.json(false);
        accessToken = accessToken.replace("Bearer", "").trim();

        const token = await Token.findOne({accessToken});
        if(!token) return res.json(false);

        const tokenData = jwt.decode(token.refreshToken);

        const user = await User.findOne(tokenData.id);
        if(!user) return res.json(false);

        const isValid = jwt.verify(
            token.refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        if(!isValid) return res.json(false);

        return res.json(true);
    }catch(e) {
        next();
    }
}

let forgotPassword = async(req, res, next) => {
    try{
        let {phone} = req.body;

        if(!phone) {
            throwError({message: "Phone number is required!", status: 400});
        }

        if(!phone.startsWith("+")) {
            phone = "+66" + phone.replace('/^0+/', "");
        }

        const user = await User.findOne({phone});

        if(!user) {
            throwError({message: "User with that phone number doesn't exist!", status: 404});
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpires = Date.now() + 600000;
        await user.save();
        console.log("Sending phone to:", phone);
        const response = await client.messages.create({
            body: `Your OTP for password reset is: ${otp}`,
            to: phone,
            from: TWILIO_PHONE_NUMBER,
        });

        success(res, {status: 201, message: 'OTP sent successfully', data: response});
    }catch(e) {
        console.log("Error is"+ e);
        next(e);
    }
}

let verifyPasswordResetOTP = async(req, res, next) => {
    try{
        const {phone, otp} = req.body;
        const user = await User.findOne({phone});

        if(!user) {
            throwError({message: "User not found!", status: 404});
        }

        if(user.resetPasswordOtp !== +otp || Date.now() > user.resetPasswordOtpExpires) {
            throwError({message: "Invalid or expired OTP", status: 401});
        }

        user.resetPasswordOtp = 1;
        user.resetPasswordOtpExpires = undefined;
        await user.save();
        success(res, {status: 201, message: "OTP confirmed successfully", data: null});
    }catch(e) {
        next(e);
    }
}

let resetPassword = async(req, res, next) => {
    const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const errorMessages = errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
            }));
            return res.status(400).json({ errors: errorMessages });
        }
    try{
        const {phone, newPassword} = req.body;
        const user = await User.findOne({phone});

        if(!user) {
            throwError({message: "User not found!", status: 404});
        }

        if(user.resetPasswordOtp != 1) {
            throwError({message: "Confirm OTP before resetting password!", status: 401});
        }

        user.passwordHash = bcrypt.hashSync(newPassword, 8);
        user.resetPasswordOtp = undefined;
        await user.save();
        success(res, {message: "Password reset successfully!", status: 201, data: null});
    }catch(e) {
        next(e);
    }
}

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

module.exports = {register, login, verifyToken, forgotPassword, verifyPasswordResetOTP, resetPassword, logout, getUser}
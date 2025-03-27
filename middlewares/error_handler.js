const jwt = require("jsonwebtoken");
const { Token } = require("../models/token_model");
const { User } = require("../models/user_model");
const { throwError } = require("../helpers/response");
async function errorHandler(error, req, res, next) {
  try {
    if (error.name === "UnauthorizedError") {
      if (!error.message.includes("jwt expired")) {
        throwError({ message: error.message });
      }
      const tokenHeader = req.header("Authorization");
      const accessToken = tokenHeader.split(" ")[1];
      const token = await Token.findOne({
        accessToken,
        refreshToken: { $exists: true },
      });

      if (!token) {
        throwError({ message: "Token does not exist or Expired", status: 401 });
      }

      const userData = jwt.verify(
        token.refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(userData.id);

      if (!user) {
        throwError({ message: "Invalid user!", status: 401 });
      }

      const newAccessToken = jwt.sign(
        { id: user.id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "24h" }
      );

      req.headers["authorization"] = `Bearer ${newAccessToken}`;
      await Token.updateOne(
        {
          _id: token.id,
        },
        { accessToken: newAccessToken }
      ).exec();

      res.set("Authorization", `Bearer ${newAccessToken}`);
      return next();
    }
    throwError({ message: error.message, status: 404 });
  } catch (refreshError) {
    next(refreshError);
  }
}

module.exports = errorHandler;

const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth_controller");

const {body} = require("express-validator")

const validateUser = [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please enter your email address"),
    body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .isStrongPassword()
    .withMessage(
      "Password must contain at least one uppercase, one lowercase and one symbol"
    ),
];

const validateUserLogin = [
  body("email").not().isEmpty().withMessage("Email is required"),
  body("password").not().isEmpty().withMessage("Password is required")

];

router.post("/register", validateUser, authController.register);
router.post("/login", validateUserLogin, authController.login);
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/logout", authController.logout);
router.get("/user", authController.getUser);

module.exports = router;
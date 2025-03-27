const express = require('express');

const usersController = require("../controllers/user_controller");

const router = express.Router();

router.get("/", usersController.getUsers);

module.exports = router;
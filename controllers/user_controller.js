const { throwError, success } = require("../helpers/response");
const { User } = require("../models/user_model");

let getUsers = async(req, res, next) => {
    try{
        const users = await User.find().select('-__v');
        if(!users) {
            throwError({message: "No users found"});
        }
        success(res, {message: "User List", status: 200, data:users});
    }catch(e) {
        next(e);
    }
}

module.exports = {getUsers}
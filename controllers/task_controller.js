const { validationResult } = require("express-validator");
const { throwError, success } = require("../helpers/response");
const { Task } = require("../models/task_model");
const { default: mongoose } = require("mongoose");
const jwt  = require("jsonwebtoken");

let addTask = async(req, res, next) => {
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

        // check title has already exist or not
        let {title} = req.body;
        const existingTitle = await Task.findOne({title});
        if(existingTitle) {
            throwError({message: `${title} already exist! Add another one.`, status: 400});
        }

        // store the data into the database
        let task = new Task({...req.body});
        await task.save();
        success(res, { message: `${title} created successfully`, status: 201 });
    }catch(e) {
        next(e);
    }
}

let updateTask = async(req, res, next) => {
    try{
        const id = req.params.id;
        // validate task id
        if(!mongoose.Types.ObjectId.isValid(id)) {
            throwError({message: "Invalid task id", status: 400});
        }
       
        // update task
        const task = await Task.findByIdAndUpdate(id, {...req.body}, {new: true});
        // check task exist or not
        if(!task) {
            throwError({message: `${task} not found!`, status: 404});
        }
        success(res, {status: 200, message: "Task updated successfully!", data: task});
    }catch(e) {
        next(e);
    }
}

let deleteTask = async(req, res, next) => {
    try{
        const id = req.params.id;
        // validate task id
        if(!mongoose.Types.ObjectId.isValid(id)) {
            throwError({message: `Invalid task id`, status: 400});
        }

        let task = await Task.findByIdAndDelete(id);
        if(!task) {
            throwError({message: `Task not found!`, status: 404});
        }
        
        success(res, {status: 200, message: "Task deleted successfully!", data: null});
    }catch(e) {
        next(e);
    }
}

let getAllTasks = async(req, res) => {
    try{
        const tasks = await Task.find()
        .select("-createdAt -updatedAt -__v").sort({createdAt: -1});

        // response success
        success(res, {status: 200, message: "Task List", data: {tasks}});
    }catch(e) {
        next(e);
    }
}

let getTaskDetail = async(req, res, next) => {
    try{
        const id = req.params.id;
        // validate task id
        if(!mongoose.Types.ObjectId.isValid(id)) {
            throwError({message: "Invalid task", status: 400});
        }
        // check task 
        const task = await Task.findById(id).select("-__v -createdAt -updatedAt");
        if(!task) {
            throwError({message: "Task not found!", status: 404});
        }
        // respose success
        success(res, {status: 200, message: "Task Deatil", data: task});

    }catch(e) {
        next(e);
    }
}


module.exports = {addTask, updateTask, deleteTask, getAllTasks, getTaskDetail}
const express = require('express');
const tasksController = require("../controllers/task_controller");
const { body } = require('express-validator');

const router = express.Router();

const validateTask = [
    body("title").not().isEmpty().withMessage("Title is required"),
    body("priority").not().isEmpty().withMessage("Priority is required"),
    body("startDate").not().isEmpty().withMessage("Start date is required")
        .isISO8601().toDate().withMessage("Invalid start date"),
    body("endDate").not().isEmpty().withMessage("End date is required")
        .isISO8601().toDate().withMessage("Invalid end date"),
    body("endDate").custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startDate)) {
            throw new Error("End date must be after start date.");
        }
        return true;
    })
];

router.post("/", validateTask, tasksController.addTask);
router.put("/:id", tasksController.updateTask);
router.delete("/:id", tasksController.deleteTask);
router.get("/", tasksController.getAllTasks);
router.get("/:id", tasksController.getTaskDetail);

module.exports = router;
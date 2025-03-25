const { Schema, model } = require("mongoose");

const taskSchema = Schema({
    title: {type: String, required: true, unique: true},
    description: {type: String},
    priority: { type: String, enum: ["Low", "Medium", "High"], defalt: ["Low"] },
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    status: {type: String, enum: ["To Do", "In Progress", "Done"], default: "To Do"},
    markedForDeletion: {type: Boolean, default: false}
}, {
    timestamps: true,
});

exports.Task = model("Task", taskSchema);
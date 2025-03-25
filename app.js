require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db/database");
const authJwt = require("./middlewares/jwt");
const errorHandler = require("./middlewares/error_handler");
const authorizationPostRequests = require("./middlewares/authorization");
const { throwError } = require("./helpers/response");

const app = express();
const { API_URL: API, PORT } = process.env;

db.connect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// local development 
app.use(cors());
app.options("*", cors());

app.use(authJwt());
app.use(authorizationPostRequests);
app.use(errorHandler);

const authRouter = require("./routes/auth");
const taskRouter = require("./routes/task");
const userRouter = require("./routes/user");

app.use(`${API}/`, authRouter);
app.use(`${API}/tasks`, taskRouter);
app.use(`${API}/users`, userRouter);

app.get("*", (req, res) => {
    throwError({ message: "Route not found", status: 404 });
});
  
app.use((err, req, res, next) => {
    err.status = err.status || 500;
    res.status(err.status).json({
        status: false,
        message: err.message,
        data: null,
    });
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
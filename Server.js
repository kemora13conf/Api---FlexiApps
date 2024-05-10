import App from "./Api/App.js";
import http from "http";
import { Server } from "socket.io";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { JWT_SECRET, PORT } from "./Api/Config/index.js";
import User from "./Api/Models/User.js";
import Database from "./Api/Database.js";
import jwt from "jsonwebtoken";

export const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @type {http.Server}
 * @description This is the http server that is used to listen to the events
 *              and requests from the client
 * @param {App} App This is the express app that is used to handle the requests
 */
const server = http.createServer(App);

/**
 * @type {Server}
 * @description This is the socket server that is used to listen to the events
 *              and requests from the client
 * @param {http.Server} server This is the http server used to establish the connection
 *                              between the client and the server
 * @param {Object} cors This is the configuration object that is used to allow the
 */
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

/**
 * Middleware to authenticate the user
 * @description This is the middleware that is used to authenticate the user
 *              before establishing the connection
 * @param {Socket} socket This is the socket object that is used to establish the connection
 * @param {Function} next This is the callback function that is used to call the next middleware
 */
io.use(async (socket, next) => {
  const authorization = socket.handshake.headers["authorization"];
  if (!authorization) {
    return next(new Error("Authentication error"));
  }
  const token = authorization.split(" ")[1]; // Split the token from the Bearer token
  try {
    await Database.getInstance(); // Ensure that the database is connected
    let user = jwt.verify(token, JWT_SECRET); // Verify the token
    if (!user) {
      return next(new Error("Authentication error"));
    }
    user = await User.findById(user.id);
    if (!user) {
      return next(new Error("Authentication error"));
    }

    // Join the user to his room
    socket.join(user._id.toString());

    // Add the user to the socket object
    socket.user = user;
    next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
});

/**
 * @description This is the event listener that listens to the connection event 
 *              and logs the user that connected
 */
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {

    // Remove the user from his room
    socket.leave(socket.user._id.toString());
    console.log("user disconnected");
  });
});

server.listen(PORT, () => {
  console.log("====== SERVER IS RUNNING ======");
  console.log(`====== PORT: ${PORT}        ======`);
  console.log("===============================");
});
import validator from "validator";
import HttpResponse from "../Helpers/HttpResponse.js";
import ResponseStatus from "../Helpers/ResponseStatus.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../Config/index.js";
import User, { ROLES } from "../Models/User.js";
import Database from "../Database.js";

// This is the middleware for validating the login credentials
export const validateLoginCredentials = (req, res, next) => {
  const { email, password } = req.body;
  if (!email) {
    return res
      .status(400)
      .json(HttpResponse(ResponseStatus.EMAIL_ERR, "Email is required"));
  }
  if (!validator.isEmail(email)) {
    return res
      .status(400)
      .json(HttpResponse(ResponseStatus.EMAIL_ERR, "This email is invalid"));
  }
  if (!password) {
    return res
      .status(400)
      .json(HttpResponse(ResponseStatus.PASSWORD_ERR, "Password is required"));
  }
  next();
};

// This function is for logging in
export const login = async (req, res) => {
  try {
    await Database.getInstance(); // This is to insure that the database is connected
    const { email, password } = req.body;
    const user = await User.findOne({ email }); // This is to find the user by email
    if (!user)
      return res
        .status(400)
        .json(HttpResponse(ResponseStatus.USER_ERR, "User not found")); // This is to check if the user exists
    // This is to check if the password is correct
    if (!user.isPasswordMatch(password))
      return res
        .status(400)
        .json(
          HttpResponse(ResponseStatus.PASSWORD_ERR, "Password is incorrect")
        );
    // This is to generate the a jwt token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
    user.hashed_password = undefined; // This is to remove the hashed password from the user object
    user.salt = undefined; // This is to remove the salt from the user object
    return res
      .status(200)
      .json(
        HttpResponse(ResponseStatus.SUCCESS, "Welcome back!", { user, token })
      );
  } catch (err) {
    // This is to handle any error that might occur
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the middleware for requiring authentication
// Any route that uses this middleware will require the user to be authenticated
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });
    if (!user)
      return res
        .status(400)
        .json(HttpResponse(ResponseStatus.AUTH_ERR, "Please authenticate"));
    req.user = user;
    next();
  } catch (err) {
    res
      .status(401)
      .json(HttpResponse(ResponseStatus.AUTH_ERR, "Please authenticate"));
  }
};

// This is the middleware for requiring admin permissions
// Any route that uses this middleware will require the user to be an admin
export const requireAdminPermissions = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.ADMIN)
      return res
        .status(403)
        .json(HttpResponse(ResponseStatus.AUTH_ERR, "You are not authorized"));
    next();
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the middleware for requiring LIVREUR permissions
// Any route that uses this middleware will require the user to be a LIVREUR
export const requireLivreurPermissions = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.LIVREUR)
      return res
        .status(403)
        .json(HttpResponse(ResponseStatus.AUTH_ERR, "You are not authorized"));
    next();
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the middleware for requiring user permissions
// Any route that uses this middleware will require the user to be a user
export const requireUserPermissions = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.USER)
      return res
        .status(403)
        .json(HttpResponse(ResponseStatus.AUTH_ERR, "You are not authorized"));
    next();
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

import { Router } from "express";
import { login, validateLoginCredentials } from "../Controllers/Auth.js";

const Auth = Router();

// This route is for logging in
Auth.post("/login", validateLoginCredentials, login);

export default Auth;

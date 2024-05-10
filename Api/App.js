import express from "express";
import cors from "cors";
import User from "./Models/User.js";
import Database from "./Database.js";

// Setting up the express App
const App = express();

try {
  await Database.getInstance();
  let admin = await User.findOne({ email: "admin@admin.com" });
  if (!admin) {
    admin = await User.create({
      fullname: "Admin",
      email: "admin@admin.com",
      hashed_password: "admin",
      role: "admin",
    });
    const user = await User.create({
      fullname: "User",
      email: "user@user.com",
      hashed_password: "user",
      role: "user",
    });
    const livreur = await User.create({
      fullname: "Livreur",
      email: "livreur@livreur.com",
      hashed_password: "livreur",
      role: "livreur",
    });
  }
} catch (err) {
  console.log(err.message);
}

// Setting the corsOptions
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
App.use(cors(corsOptions));

// json middleware
App.use(express.json());

// assets
App.use(express.static("public"));

// Importing the routes
import Auth from "./Routes/Auth.js";
import Products from "./Routes/Products.js";
import Orders from "./Routes/Orders.js";

// Setting up the routes
App.use("/api/auth", Auth);
App.use("/api/products", Products);
App.use("/api/orders", Orders);

export default App;

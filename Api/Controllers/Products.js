import HttpResponse from "../Helpers/HttpResponse.js";
import ResponseStatus from "../Helpers/ResponseStatus.js";
import Product from "../Models/Product.js";
import multer from "multer";
import { __dirname } from "../../Server.js";
import path from "path";
import fs from "fs";
import Database from "../Database.js";

const storage = multer.memoryStorage(); // This is the configuration for multer to store files in memory
export const upload = multer({ storage: storage }); // This is the configuration for multer to store files in disk

// This is the controller for the products list
export const products_list = async (req, res) => {
  let { page, limit } = req.query;
  try {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    await Database.getInstance();
    const products = await Product.find()
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json(
      HttpResponse(ResponseStatus.SUCCESS, "Products fetched successfully", {
        products,
        pagination: {
          page,
          limit,
          total_products: await Product.countDocuments(),
          total_pages: Math.ceil((await Product.countDocuments()) / limit),
        },
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(HttpResponse(ResponseStatus.SERVER_ERR, error.message));
  }
};

// This is the midlware for validating the product details before adding it to the database
export const validateProduct = (req, res, next) => {
  const { name, price, description } = req.body;
  const images = req.files ? req.files : [];
  if (!name) {
    return res
      .status(400)
      .json(
        HttpResponse(
          ResponseStatus.PRODUCT_NAME_ERR,
          "Product name is required"
        )
      );
  }
  if (!price) {
    return res
      .status(400)
      .json(
        HttpResponse(
          ResponseStatus.PRODUCT_PRICE_ERR,
          "Product price is required"
        )
      );
  }
  if (!description) {
    return res
      .status(400)
      .json(
        HttpResponse(
          ResponseStatus.PRODUCT_DESC_ERR,
          "Product description is required"
        )
      );
  }
  if (images.length === 0) {
    return res
      .status(400)
      .json(
        HttpResponse(
          ResponseStatus.PRODUCT_IMAGES_ERR,
          "Atleast on image is required"
        )
      );
  }
  next();
};

// This function generates a unique name for the file
function generateFileName(originalname) {
  let arrName = originalname.split(".");
  let salt = Math.random().toString(36).substring(7);
  let extension = arrName[arrName.length - 1];
  let nameWithoutExtension = arrName.slice(0, arrName.length - 1).join(".");
  let saveAs = `${nameWithoutExtension}-${salt}.${extension}`;
  return saveAs;
}

// This function saves the file to a given location
function saveFile(file, location) {
  let saveAs = generateFileName(file.originalname);
  let imageBuffer = file.buffer;
  let filePath = path.join(__dirname, location, saveAs);
  fs.writeFileSync(filePath, imageBuffer);
  return saveAs;
}

// This is the controller for adding a product
export const add_product = async (req, res) => {
  try {
    await Database.getInstance();
    const { name, price, description } = req.body;
    const images = req.files.map((file) => {
      return saveFile(file, "./public/products-images");
    });
    const product = await Product.create({
      name,
      price,
      description,
      images,
      createdBy: req.user._id,
    });
    return res
      .status(201)
      .json(
        HttpResponse(
          ResponseStatus.SUCCESS,
          "Product added successfully",
          product
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(HttpResponse(ResponseStatus.SERVER_ERR, error.message));
  }
};

// This is the midlware for getting a single product
export const findProductById = async (req, res, next, id) => {
  try {
    await Database.getInstance();
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json(HttpResponse(ResponseStatus.FAILED, "Product not found"));
    }
    req.product = product;
    next();
  } catch (error) {
    return res
      .status(500)
      .json(HttpResponse(ResponseStatus.SERVER_ERR, error.message));
  }
};

// This is the controller for updating a product
export const update_product = async (req, res) => {
  try {
    await Database.getInstance();
    let { name, price, description, removeFiles } = req.body;
    let product = await Product.findById(req.product._id);
    if (name && name.trim() !== "") product.name = name;
    if (price && price.trim() !== "") product.price = price;
    if (description && description.trim() !== "")
      product.description = description;
    if (removeFiles && removeFiles.length > 0) {
      removeFiles = removeFiles.split(",");
      removeFiles.forEach((file) => {
        let filePath = path.join(__dirname, "./public/products-images", file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      product.images = product.images.filter(
        (image) => !removeFiles.includes(image)
      );
    }
    if (req.files && req.files.length > 0) {
      const images = req.files.map((file) => {
        return saveFile(file, "./public/products-images");
      });
      product.images = product.images.concat(images);
    }

    await product.save();
    return res
      .status(200)
      .json(
        HttpResponse(
          ResponseStatus.SUCCESS,
          "Product updated successfully",
          product
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(HttpResponse(ResponseStatus.SERVER_ERR, error.message));
  }
};

// This is the controller for deleting a single product
export const delete_product = async (req, res) => {
  try {
    await Database.getInstance();
    let product = await Product.findById(req.product._id);
    product.images.forEach((image) => {
      let filePath = path.join(__dirname, "./public/products-images", image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    await Product.deleteOne({ _id: req.product._id });
    return res
      .status(200)
      .json(
        HttpResponse(
          ResponseStatus.SUCCESS,
          "Product deleted successfully",
          product
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(HttpResponse(ResponseStatus.SERVER_ERR, error.message));
  }
};

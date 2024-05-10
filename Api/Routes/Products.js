import { Router } from "express";
import { requireAdminPermissions, requireAuth } from "../Controllers/Auth.js";
import {
  upload,
  add_product,
  products_list,
  validateProduct,
  findProductById,
  update_product,
  delete_product,
} from "../Controllers/Products.js";
import HttpResponse from "../Helpers/HttpResponse.js";
import ResponseStatus from "../Helpers/ResponseStatus.js";
const Products = Router();

Products.param("id", findProductById); // middleware to find product by id

// Those routes require only being authentication
Products.get("/", requireAuth, products_list); // get all products
Products.get("/:id", requireAuth, (req, res) => {
    // get a single product
  return res
    .status(200)
    .json(
      HttpResponse(
        ResponseStatus.SUCCESS,
        "Product fetched successfully",
        req.product
      )
    );
});

// Those routes require authentication and admin permissions
// add a new product
Products.post(
  "/",
  requireAuth,
  requireAdminPermissions,
  upload.array("images", 5),
  validateProduct,
  add_product
);
// update a product
Products.put(
  "/:id",
  requireAuth,
  requireAdminPermissions,
  upload.array("images", 5),
  update_product
);
Products.delete("/:id", requireAuth, requireAdminPermissions, delete_product); // delete a product

export default Products;

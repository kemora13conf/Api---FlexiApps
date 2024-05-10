import { Router } from "express";
import {
  requireAdminPermissions,
  requireAuth,
  requireLivreurPermissions,
  requireUserPermissions,
} from "../Controllers/Auth.js";
import {
  confirmOrder,
  createOrder,
  deleteOrder,
  deposeOrder,
  getOrder,
  getOrderById,
  getOrders,
  getOrdersByUser,
  isOrderLivreur,
  isOrderOwner,
  liverOrder,
  updateOrderProducts,
  validateOrder,
} from "../Controllers/Orders.js";

const Orders = Router();

Orders.param("id", getOrderById);

// This is route for getting all orders
Orders.get("/", requireAuth, requireAdminPermissions, getOrders);
// This is route for getting orders of the current user
Orders.get("/user", requireAuth, getOrdersByUser);
// This is route for getting a single order
Orders.get("/:id", requireAuth, getOrder);

// This is route for creating an order
Orders.post(
  "/",
  requireAuth,
  requireUserPermissions,
  validateOrder,
  createOrder
);
// When the order is still in the basket, the user can update the order Products
Orders.put(
  "/:id",
  requireAuth,
  requireUserPermissions,
  isOrderOwner,
  updateOrderProducts
);
// This is route for confirming the order
// This is done by the user who created the order
Orders.put(
  "/:id/confirm",
  requireAuth,
  requireUserPermissions,
  isOrderOwner,
  confirmOrder
);

//This route for changing the order status to "livraison"
// This is done by the livreur who is assigned to the order
Orders.put(
  "/:id/livraison",
  requireAuth,
  requireLivreurPermissions,
  isOrderLivreur,
  liverOrder
);

// This is route for changing the order status to "deposed"
// This is done by the livreur who is assigned to the order
Orders.put(
  "/:id/depose",
  requireAuth,
  requireLivreurPermissions,
  isOrderLivreur,
  deposeOrder
);
// This route for deleting an order
Orders.delete("/:id", requireAuth, requireAdminPermissions, deleteOrder);

export default Orders;

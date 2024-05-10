import Database from "../Database.js";
import ResponseStatus from "../Helpers/ResponseStatus.js";
import Order, { ORDER_STATUSES } from "../Models/Order.js";
import User, { LIVREUR_STATUS, ROLES } from "../Models/User.js";
import Products from "../Models/Product.js";
import Notification from "../Models/Notification.js";
import { io } from "../../Server.js";
import HttpResponse from "../Helpers/HttpResponse.js";

// This is the midleware for getting order by id
export const getOrderById = async (req, res, next, id) => {
  try {
    await Database.getInstance();
    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json(HttpResponse(ResponseStatus.FAILED, "Order not found"));
    }
    req.order = order;
    next();
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for getting orders by user
export const getOrdersByUser = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    await Database.getInstance();
    const orders = await Order.find({ user: req.user._id })
      .skip((page - 1) * limit)
      .limit(limit * 1);
    return res.status(200).json(
      HttpResponse(ResponseStatus.SUCCESS, "Orders retrieved", {
        orders,
        pagination: {
          total: orders.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(orders.length / limit),
          totalOrders: Order.countDocuments(),
        },
      })
    );
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for getting all orders
export const getOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    await Database.getInstance();
    const orders = await Order.find()
      .skip((page - 1) * limit)
      .limit(limit * 1);
    return res.status(200).json(
      HttpResponse(ResponseStatus.SUCCESS, "Orders retrieved", {
        orders,
        pagination: {
          total: orders.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(orders.length / limit),
          totalOrders: Order.countDocuments(),
        },
      })
    );
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for getting a single order
export const getOrder = (req, res) => {
  return res
    .status(200)
    .json(HttpResponse(ResponseStatus.SUCCESS, "Order retrieved", req.order));
};

// This is the midlware for validating the order details before adding it to the database
export const validateOrder = (req, res, next) => {
  const { products, address } = req.body;
  if (!products) {
    return res
      .status(400)
      .json(
        HttpResponse(ResponseStatus.ORDER_PRODUCTS_ERR, "Products are required")
      );
  } else if (!Array.isArray(products)) {
    return res
      .status(400)
      .json(
        HttpResponse(
          ResponseStatus.ORDER_PRODUCTS_ERR,
          "Products should be an array"
        )
      );
  } else if (products.length === 0) {
    return res
      .status(400)
      .json(
        HttpResponse(
          ResponseStatus.ORDER_PRODUCTS_ERR,
          "Products should not be empty"
        )
      );
  } else if (!address) {
    return res
      .status(400)
      .json(
        HttpResponse(ResponseStatus.ORDER_PRODUCTS_ERR, "Address is required")
      );
  }
  next();
};

// This is the function for creating an order
export const createOrder = async (req, res) => {
  try {
    await Database.getInstance();
    let { products, address } = req.body;
    products = await Products.find({ _id: { $in: products } });
    let total = products.reduce((acc, product) => acc + product.price, 0);
    const order = await Order.create({
      user: req.user._id,
      products,
      total,
      address,
    });
    return res
      .status(201)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order created", order));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the midleware for checking if the user is the owner of the order
export const isOrderOwner = (req, res, next) => {
  const { user, order } = req;
  if (user._id.toString() !== order.user.toString()) {
    return res
      .status(403)
      .json(HttpResponse(ResponseStatus.FORBIDDEN, "Access denied"));
  }
  next();
};

// This is the function for updating orders Products
export const updateOrderProducts = async (req, res) => {
  try {
    let order = req.order;
    if (order.status !== ORDER_STATUSES.BASKET) {
      return res
        .status(403)
        .json(
          HttpResponse(ResponseStatus.FORBIDDEN, "You can't update this order")
        );
    }
    await Database.getInstance();
    const { products } = req.body;
    if (!products || products.length === 0 || !Array.isArray(products)) {
      return res
        .status(400)
        .json(
          HttpResponse(
            ResponseStatus.ORDER_PRODUCTS_ERR,
            "Products are required"
          )
        );
    }
    order = await Order.findByIdAndUpdate(
      { _id: order._id },
      { $set: { products } },
      { new: true }
    );
    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order updated", order));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for confirming an order
export const confirmOrder = async (req, res) => {
  try {
    let order = req.order;
    if (order.status !== ORDER_STATUSES.BASKET) {
      return res
        .status(403)
        .json(
          HttpResponse(
            ResponseStatus.FORBIDDEN,
            "You can't confirm this order, because it's already processed."
          )
        );
    }
    await Database.getInstance(); // Ensure that the database is connected
    order = await Order.findByIdAndUpdate(
      { _id: order._id },
      { status: ORDER_STATUSES.CONFIRMED }, // Update the status of the order to confirmed
      { new: true }
    );

    /**
     * Check if there is a livreur available
     * Assign the order to an available livreur
     * If there are no livreurs available, check every 60 seconds
     */
    let livreur = await User.findOne({
      role: ROLES.LIVREUR,
      status: LIVREUR_STATUS.FREE,
    });

    if (livreur) {
      // if there is livreur available
      order.livreur = livreur._id; // assign the order to the livreur
      await order.save(); // save the order

      // change the status of the livreur to busy
      livreur.status = LIVREUR_STATUS.BUSY;
      await livreur.save();

      const notification = await Notification.create({
        title: "New Order",
        message: "You have a new order to deliver",
        user: livreur._id,
      });
      io.to(livreur._id.toString()).emit("notification", notification); // send the notification to the livreur
    } else {
      // if there are no livreurs available
      const intervalId = setInterval(async () => {
        // check every 60 seconds if there is a livreur available
        let livreur = await User.findOne({
          role: ROLES.LIVREUR,
          status: LIVREUR_STATUS.FREE,
        });
        if (livreur) {
          order.livreur = livreur._id; // assign the order to the livreur
          await order.save(); // save the order

          // change the status of the livreur to busy
          livreur.status = LIVREUR_STATUS.BUSY;
          await livreur.save();

          // initialize a notification for the livreur
          const notification = await Notification.create({
            title: "New Order",
            message: "You have a new order to deliver",
            user: livreur._id,
          });
          io.to(livreur._id.toString()).emit("notification", notification); // send the notification to the livreur
          clearInterval(intervalId); // clear the interval
        }
      }, 60000);
    }

    const notification = await Notification.create({
      title: "Order Confirmed",
      message: "Your order has been confirmed",
      user: order.user,
    });

    // send the notification to the user
    io.to(order.user.toString()).emit("notification", notification);

    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order confirmed", order));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

/**
 * Middleware
 * @description This middleware checks if the current user is the livreur of the order
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Response} next
 */
export const isOrderLivreur = (req, res, next) => {
  try {
    const { user, order } = req;
    if (order.livreur == null) {
      return res
        .status(403)
        .json(
          HttpResponse(
            ResponseStatus.FORBIDDEN,
            "You are not the livreur of this order"
          )
        );
    }
    if (user._id.toString() !== order.livreur.toString()) {
      return res
        .status(403)
        .json(
          HttpResponse(
            ResponseStatus.FORBIDDEN,
            "You are not the livreur of this order"
          )
        );
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Controller
 * @description This controller is used to change the status of an order to "LIVRAISON"
 *              when the livreur picks up the order for delivery
 * @param {Request} req
 * @param {Response} res
 * @returns HttpResponse | Eternal Server Error
 */
export const liverOrder = async (req, res) => {
  try {
    let order = req.order;
    if (order.status !== ORDER_STATUSES.CONFIRMED) {
      return res
        .status(403)
        .json(
          HttpResponse(
            ResponseStatus.FORBIDDEN,
            "You can't deliver this order, because it's not confirmed."
          )
        );
    }
    await Database.getInstance();
    order = await Order.findByIdAndUpdate(
      { _id: order._id },
      { status: ORDER_STATUSES.LIVRAISON },
      { new: true }
    );
    // create a notification for the user
    let notification = await Notification.create({
      title: "Order in delivery",
      message: "Your order is in delivery",
      user: order.user,
    });
    // send the notification to the user
    io.to(order.user.toString()).emit("notification", notification);

    // create a notification for the livreur
    notification = await Notification.create({
      title: "Order in delivery",
      message: "You have an order in delivery",
      user: order.livreur,
    });
    // send the notification to the livreur
    io.to(order.livreur.toString()).emit("notification", notification);
    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order in delivery", order));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

/**
 * Controller
 * @description This controller is used to change the status of an order to "DEPOSED"
 * @param {Request} req
 * @param {Response} res
 * @returns HttpResponse | Eternal Server Error
 */
export const deposeOrder = async (req, res) => {
  try {
    let order = req.order;
    await Database.getInstance();
    order = await Order.findByIdAndUpdate(
      { _id: order._id },
      { status: ORDER_STATUSES.DEPOSED },
      { new: true }
    );
    
    /**
     * Change the status of the livreur to free
     * in this case the livreur is the current user 
     * registered in the request object (req.user) in the auth middleware
     */
    req.user.status = LIVREUR_STATUS.FREE;
    await req.user.save();

    // initialize a notification for the user
    let notification = await Notification.create({
      title: "Order Delivered",
      message: "Your order has been delivered",
      user: order.user,
    });
    io.to(order.user.toString()).emit("notification", notification); // send the notification to the user

    // initialize a notification for the livreur
    notification = await Notification.create({
      title: "Order Delivered",
      message: "You have delivered the order",
      user: order.livreur,
    });
    io.to(order.livreur.toString()).emit("notification", notification); // send the notification to the livreur
    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order delivered", order));
  } catch (err) {
    return res
      .status(500)
      .json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

/**
 * Contoller
 * @description This controller is used to delete an order
 * @param {Request} req
 * @param {Response} res
 * @returns HttpResponse | Eternal Server Error
 */
export const deleteOrder = async (req, res) => {
  try {
    await Database.getInstance();
    let order = req.order;
    await Order.findByIdAndDelete(order._id);
    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order deleted"));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

import HttpResponse from "../Helpers/HttpResponse.js";
import ResponseStatus from "../Helpers/ResponseStatus.js";

export const NotificationById = async (req, res, next, id) => {
  try {
    const notification = await Notification.findById(id);
    if (!notification) {
      return res
        .status(404)
        .json(HttpResponse(ResponseStatus.FAILED, "Notification not found"));
    }
    req.notification = notification;
    next();
  } catch (error) {
    next(error);
  }
};

export const getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.notification._id);
    res
      .status(200)
      .json(
        HttpResponse(
          ResponseStatus.SUCCESS,
          "Fetched successfully",
          notification
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(HttpResponse(ResponseStatus.SERVER_ERR, error.message));
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find();
    res
      .status(200)
      .json(
        HttpResponse(
          ResponseStatus.SUCCESS,
          "Fetched successfully",
          notifications
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(HttpResponse(ResponseStatus.SERVER_ERR, error.message));
  }
};

export const unreadNotifications = async (req, res) => {
  try {
    const user = req.user;
    const notifications = await Notification.find({
      user: user._id,
      read: false,
    });
    res
      .status(200)
      .json(
        HttpResponse(
          ResponseStatus.SUCCESS,
          "Fetched successfully",
          notifications
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(HttpResponse(ResponseStatus.SERVER_ERR, error.message));
  }
};

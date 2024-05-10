import { Router } from "express";
import { NotificationById, getNotifications, unreadNotifications } from "../Controllers/Notifications.js";
import { requireAdminPermissions, requireAuth } from './../Controllers/Auth.js';

const Notifications = Router();

// This is a param middleware that is used to fetch the notification by id
Notifications.param("id", NotificationById);

// This is route for getting all notifications
Notifications.get("/", requireAuth, requireAdminPermissions, getNotifications);
// This is route for getting a single notification
Notifications.get("/:id", requireAuth, requireAdminPermissions, getNotification);
// This route for getting unread notifications
Notifications.get("/unread", requireAuth, unreadNotifications);



export default Notifications;
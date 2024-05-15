import mongoose from 'mongoose';
import { DATABASE_URL } from './Config/index.js';
import Logger from './Helpers/Logger.js';
/**
 * Database class to handle the connection to the database
 * @class Database
 * @static getInstance - Method to get the instance of the database connection
 * @returns {Object} - Returns the instance of the database connection or throws an error if connection fails
 */
export default class Database {
    static instance = null;

    static async getInstance() {
        if (this.instance == null) {
            try {
                const connection = await mongoose.connect(
                    DATABASE_URL, // Database URL from the .env file
                    {}
                );
                this.instance = connection.connection;
                Logger.info('====== DB STATE: Database connected ======');
                return this.instance;
            } catch (error) {
                Logger.error('====== DB STATE: Database connection failed ======');
                throw new Error(error.message);
            }
        }

        return this.instance;
    }
}
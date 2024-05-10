import mongoose from 'mongoose';
import { DATABASE_URL } from './Config/index.js';
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
                    DATABASE_URL,
                    {}
                );
                this.instance = connection.connection;
                console.log('====== DB STATE: Database connected ======');
                return this.instance;
            } catch (error) {
                console.log('====== DB STATE: Database connection failed ======');
                throw new Error(error.message);
            }
        }

        return this.instance;
    }
}
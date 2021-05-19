"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [new winston_1.default.transports.Console()],
});
class Logger {
    constructor() { }
}
exports.default = Logger;
Logger.info = (message, ...args) => {
    if (logger.isInfoEnabled()) {
        if (args.length > 0) {
            logger.info(message, args);
        }
        else {
            logger.info(message);
        }
    }
};
Logger.debug = (message, ...args) => {
    if (logger.isDebugEnabled()) {
        if (args.length > 0) {
            logger.debug(message, args);
        }
        else {
            logger.debug(message);
        }
    }
};
Logger.error = (message, ...args) => {
    if (logger.isErrorEnabled()) {
        if (args.length > 0) {
            logger.error(message, args);
        }
        else {
            logger.error(message);
        }
    }
};

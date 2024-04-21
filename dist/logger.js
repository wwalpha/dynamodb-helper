"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
class Logger {
    static logger = winston_1.default.createLogger({
        level: 'info',
        format: winston_1.default.format.json(),
        transports: [new winston_1.default.transports.Console()],
    });
    constructor() { }
    static info = (message, ...args) => {
        if (this.logger.isInfoEnabled()) {
            if (args.length > 0) {
                this.logger.info(message, args);
            }
            else {
                this.logger.info(message);
            }
        }
    };
    static debug = (message, ...args) => {
        if (this.logger.isDebugEnabled()) {
            if (args.length > 0) {
                this.logger.debug(message, args);
            }
            else {
                this.logger.debug(message);
            }
        }
    };
    static error = (message, ...args) => {
        if (this.logger.isErrorEnabled()) {
            if (args.length > 0) {
                this.logger.error(message, args);
            }
            else {
                this.logger.error(message);
            }
        }
    };
    static updateOptions = (options) => {
        this.logger = winston_1.default.createLogger(options);
    };
}
exports.default = Logger;

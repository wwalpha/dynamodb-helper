"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
class Logger {
    constructor() { }
}
exports.default = Logger;
_a = Logger;
Logger.logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [new winston_1.default.transports.Console()],
});
Logger.info = (message, ...args) => {
    if (_a.logger.isInfoEnabled()) {
        if (args.length > 0) {
            _a.logger.info(message, args);
        }
        else {
            _a.logger.info(message);
        }
    }
};
Logger.debug = (message, ...args) => {
    if (_a.logger.isDebugEnabled()) {
        if (args.length > 0) {
            _a.logger.debug(message, args);
        }
        else {
            _a.logger.debug(message);
        }
    }
};
Logger.error = (message, ...args) => {
    if (_a.logger.isErrorEnabled()) {
        if (args.length > 0) {
            _a.logger.error(message, args);
        }
        else {
            _a.logger.error(message);
        }
    }
};
Logger.updateOptions = (options) => {
    _a.logger = winston_1.default.createLogger(options);
};

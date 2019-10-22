"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const log4js_1 = __importDefault(require("log4js"));
class Config {
    constructor() {
        /**
         * Update Settings
         */
        this.update = (configs) => {
            if (configs.logger) {
                log4js_1.default.configure(configs.logger);
            }
        };
    }
}
exports.Config = Config;
exports.config = new Config();

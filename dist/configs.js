"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Configs = void 0;
const log4js_1 = __importDefault(require("log4js"));
class Configs {
    constructor() {
        this.options = {
            region: process.env.AWS_DEFAULT_REGION,
        };
        /**
         * Update Settings
         */
        this.update = (configs) => {
            if (configs.logger) {
                log4js_1.default.configure(configs.logger);
            }
            if (configs.credentials) {
                this.options.credentials = configs.credentials;
            }
            if (configs.options) {
                this.options = { ...this.options, ...configs.options };
            }
            console.log(this.options);
        };
        /** get credentials */
        this.getCredentials = () => this.options.credentials;
        this.getOptions = () => this.options;
    }
}
exports.Configs = Configs;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Configs = void 0;
const winston_1 = __importDefault(require("winston"));
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
                winston_1.default.configure(configs.logger);
            }
            if (configs.options) {
                this.options = { ...this.options, ...configs.options };
            }
        };
        /** get credentials */
        this.getCredentials = () => this.options.credentials;
        this.getOptions = () => this.options;
    }
}
exports.Configs = Configs;

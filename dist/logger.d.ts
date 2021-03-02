import { Configuration } from 'log4js';
export declare type LoggerConfiguration = Configuration;
export default class Logger {
    constructor();
    static info: (message: any, ...args: any[]) => void;
    static debug: (message: any, ...args: any[]) => void;
    static error: (message: any, ...args: any[]) => void;
}

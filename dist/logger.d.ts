import winston from 'winston';
export type LoggerConfiguration = winston.LoggerOptions;
export default class Logger {
    constructor();
    static info: (message: any, ...args: any[]) => void;
    static debug: (message: any, ...args: any[]) => void;
    static error: (message: any, ...args: any[]) => void;
}

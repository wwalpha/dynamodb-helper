import { DocumentClientOptions } from './client';
import { LoggerConfiguration } from './logger';
export interface Configurations {
    options?: DocumentClientOptions;
    logger?: LoggerConfiguration;
}
export declare class Config {
    constructor();
    /**
     * Update Settings
     */
    update: (configs: Configurations) => void;
}
export declare const config: Config;

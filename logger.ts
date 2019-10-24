import {createLogger, format, transports} from "winston";

export const logger = createLogger({
    level: 'debug',
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'info.log' })
    ],
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.colorize(),
        format.simple()
    )
});
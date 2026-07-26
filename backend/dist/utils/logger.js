"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("../config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
const targets = [];
if (config_1.config.NODE_ENV === 'development') {
    targets.push({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    });
}
else {
    targets.push({
        target: 'pino/file',
        options: {
            destination: path_1.default.join(logDir, 'app.log'),
            mkdir: true,
        },
    });
}
exports.logger = (0, pino_1.default)({
    level: config_1.config.NODE_ENV === 'development' ? 'debug' : 'info',
    transport: {
        targets,
    },
});

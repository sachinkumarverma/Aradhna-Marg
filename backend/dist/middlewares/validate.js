"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const appError_1 = require("../errors/appError");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
                headers: req.headers,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                next(new appError_1.ValidationError('Validation failed', errors));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateRequest = validateRequest;

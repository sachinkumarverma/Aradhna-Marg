"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class SupabaseService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!SupabaseService.instance) {
            try {
                SupabaseService.instance = (0, supabase_js_1.createClient)(config_1.config.SUPABASE_URL, config_1.config.SUPABASE_SERVICE_ROLE_KEY, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                    },
                });
                logger_1.logger.info('Supabase client initialized successfully.');
            }
            catch (error) {
                logger_1.logger.error('Failed to initialize Supabase client:', error);
                throw error;
            }
        }
        return SupabaseService.instance;
    }
}
exports.supabase = SupabaseService.getInstance();

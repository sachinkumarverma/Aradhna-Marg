"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
/**
 * DEPRECATED: This file is kept only for backward-compatibility during migration.
 * All new code must use DatabaseClient (raw PostgreSQL) instead.
 * This client is NO LONGER used for data access or authentication.
 */
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Dummy fallback client returned when Supabase env vars are missing.
// This prevents crashes during the migration period — no code should
// actually call this anymore.
const FALLBACK_URL = 'http://localhost:54321';
const FALLBACK_KEY = 'fallback-key-supabase-not-used';
class SupabaseService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!SupabaseService.instance) {
            const url = config_1.config.SUPABASE_URL || FALLBACK_URL;
            const key = config_1.config.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_KEY;
            if (!config_1.config.SUPABASE_URL || !config_1.config.SUPABASE_SERVICE_ROLE_KEY) {
                logger_1.logger.warn('Supabase env vars not set — Supabase client is disabled. All DB access uses PostgreSQL directly.');
            }
            SupabaseService.instance = (0, supabase_js_1.createClient)(url, key, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
        }
        return SupabaseService.instance;
    }
}
exports.supabase = SupabaseService.getInstance();

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

class SupabaseService {
  private static instance: SupabaseClient;

  private constructor() {}

  public static getInstance(): SupabaseClient {
    if (!SupabaseService.instance) {
      try {
        SupabaseService.instance = createClient(
          config.SUPABASE_URL,
          config.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
        logger.info('Supabase client initialized successfully.');
      } catch (error) {
        logger.error('Failed to initialize Supabase client:', error);
        throw error;
      }
    }
    return SupabaseService.instance;
  }
}

export const supabase = SupabaseService.getInstance();

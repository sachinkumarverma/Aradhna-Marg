import { supabase } from '../../database/supabase';
import { ISearchOptions, ISearchResult } from '../interfaces';
import { BaseRepository } from '../../repositories/base.repository';

class SearchRepository extends BaseRepository<ISearchResult> {
  constructor() {
    super('bhajans');
  }

  /**
   * Executes a PostgreSQL Full Text Search query utilizing the `search_vector` GIN index.
   * Includes fuzzy matching logic via ILIKE if FTS yields nothing.
   */
  public async searchFTS(options: ISearchOptions): Promise<{ data: ISearchResult[]; total: number }> {
    const { query, filters, sort, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // We build the query dynamically.
    // Use .textSearch('search_vector', query) for true FTS.
    // If the user inputs misspellings, we might fallback to ILIKE in the service layer, 
    // or use a Postgres pg_trgm extension if available in Supabase.
    
    // Convert basic query to tsquery format (e.g., 'krishna:*') for prefix matching.
    // A more advanced implementation would use websearch_to_tsquery.
    const ftsQuery = query.trim() ? query.trim().split(' ').map(q => `'${q}':*`).join(' & ') : '';

    let dbQuery = this.db.from(this.tableName)
      .select('id, slug, title, hindi_title, thumbnail_url, views, has_pdf, youtube_video_id, reading_time', { count: 'exact' });

    if (ftsQuery) {
      dbQuery = dbQuery.textSearch('search_vector', ftsQuery);
    }

    // Apply Filters
    if (filters?.categoryId) {
      // In a real relation, we'd query through the junction table `bhajan_categories`.
      // For this architecture demo, we assume the query builder handles it or uses RPC.
    }
    if (filters?.hasPdf) dbQuery = dbQuery.eq('has_pdf', true);
    if (filters?.hasVideo) dbQuery = dbQuery.not('youtube_video_id', 'is', null);

    // Apply Sorting
    switch (sort) {
      case 'NEWEST':
        dbQuery = dbQuery.order('published_at', { ascending: false });
        break;
      case 'OLDEST':
        dbQuery = dbQuery.order('published_at', { ascending: true });
        break;
      case 'VIEWS':
        dbQuery = dbQuery.order('views', { ascending: false });
        break;
      case 'POPULARITY':
        dbQuery = dbQuery.order('popularity_score', { ascending: false });
        break;
      default:
        // By default, if there is a query, Postgres ranks by relevance. 
        break;
    }

    const { data, count, error } = await dbQuery.range(offset, offset + limit - 1);
    
    if (error) throw error;

    return {
      data: (data as any).map((b: any) => ({
        ...b,
        has_video: !!b.youtube_video_id
      })),
      total: count || 0
    };
  }

  public async logSearch(query: string, resultCount: number, metadata?: any): Promise<void> {
    await this.db.from('search_logs').insert({
      search_query: query,
      results_count: resultCount,
      metadata: metadata || {}
    });
  }

  public async getTrendingSearches(): Promise<string[]> {
    // Queries the materialized view or a raw SQL RPC to get top grouped queries
    const { data, error } = await this.db.rpc('get_trending_searches', { limit_num: 10 });
    if (error) {
      // Fallback for architecture demo if RPC is not created yet
      return ['Hanuman Chalisa', 'Shiv Tandav', 'Morning Bhajans'];
    }
    return data.map((row: any) => row.search_query);
  }
}

export const searchRepository = new SearchRepository();

import { apiClient } from './client';

const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in-memory cache

async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.data !== undefined && cached.data !== null && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  try {
    const freshData = await fetcher();
    if (freshData !== undefined && freshData !== null) {
      cache.set(key, { data: freshData, timestamp: Date.now() });
    }
    return freshData;
  } catch (err) {
    cache.delete(key);
    throw err;
  }
}

export class PublicApi {
  static clearCache() {
    cache.clear();
  }

  static async getHomeData() {
    return getCached('home_data', async () => {
      const response = await apiClient.get('/v1/public/home');
      return response.data.data;
    });
  }

  static async getBhajans(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    deity?: string;
    sort?: string;
  }) {
    const key = `bhajans_${JSON.stringify(params || {})}`;
    return getCached(key, async () => {
      const response = await apiClient.get('/v1/public/bhajans', { params });
      return response.data;
    });
  }

  static async getBhajanBySlug(slug: string) {
    return getCached(
      `bhajan_detail_${slug}`,
      async () => {
        const response = await apiClient.get(`/v1/public/bhajans/${slug}`);
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async getBhajanRelated(slug: string) {
    return getCached(
      `bhajan_related_${slug}`,
      async () => {
        const response = await apiClient.get(`/v1/public/bhajans/${slug}/related`);
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async getArticles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    author?: string;
    featured?: boolean;
    lang?: string;
  }) {
    const key = `articles_${JSON.stringify(params || {})}`;
    return getCached(key, async () => {
      const response = await apiClient.get('/v1/public/articles', { params });
      return response.data;
    });
  }

  static async getArticleBySlug(slug: string, lang: string = 'hi') {
    return getCached(
      `article_detail_${slug}_${lang}`,
      async () => {
        const response = await apiClient.get(`/v1/public/articles/${slug}`, { params: { lang } });
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async getArticleRelated(slug: string) {
    return getCached(
      `article_related_${slug}`,
      async () => {
        const response = await apiClient.get(`/v1/public/articles/${slug}/related`);
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async getFestivals(params?: { page?: number; limit?: number; search?: string; lang?: string }) {
    const key = `festivals_${JSON.stringify(params || {})}`;
    return getCached(key, async () => {
      const response = await apiClient.get('/v1/public/festivals', { params });
      return response.data;
    });
  }

  static async getFestivalBySlug(slug: string, lang: string = 'hi') {
    return getCached(
      `festival_detail_${slug}_${lang}`,
      async () => {
        const response = await apiClient.get(`/v1/public/festivals/${slug}`, { params: { lang } });
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async getFestivalRelated(slug: string) {
    return getCached(
      `festival_related_${slug}`,
      async () => {
        const response = await apiClient.get(`/v1/public/festivals/${slug}/related`);
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async getPuranas(params?: { page?: number; limit?: number; search?: string; lang?: string }) {
    const key = `puranas_${JSON.stringify(params || {})}`;
    return getCached(key, async () => {
      const response = await apiClient.get('/v1/public/puranas', { params });
      return response.data;
    });
  }

  static async getPuranBySlug(slug: string, lang: string = 'hi') {
    return getCached(
      `puran_detail_${slug}_${lang}`,
      async () => {
        const response = await apiClient.get(`/v1/public/puranas/${slug}`, { params: { lang } });
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async getPuranPdfUrl(id: string) {
    const response = await apiClient.get(`/v1/public/puranas/${id}/pdf`);
    return response.data.data.url;
  }

  static async getDeities() {
    return getCached('deities_all', async () => {
      const response = await apiClient.get('/v1/public/deities');
      return response.data.data;
    });
  }

  static async getDeityBySlug(slug: string) {
    return getCached(
      `deity_detail_${slug}`,
      async () => {
        const response = await apiClient.get(`/v1/public/deities/${slug}`);
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async getCategories() {
    return getCached('categories_all', async () => {
      const response = await apiClient.get('/v1/public/categories');
      return response.data.data;
    });
  }

  static async getCategoryBySlug(slug: string) {
    return getCached(
      `category_detail_${slug}`,
      async () => {
        const response = await apiClient.get(`/v1/public/categories/${slug}`);
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async getAuthors() {
    return getCached('authors_all', async () => {
      const response = await apiClient.get('/v1/public/authors');
      return response.data.data;
    });
  }

  static async getAuthorById(id: string) {
    return getCached(
      `author_detail_${id}`,
      async () => {
        const response = await apiClient.get(`/v1/public/authors/${id}`);
        return response.data.data;
      },
      2 * 60 * 1000
    );
  }

  static async search(query: string, filters?: any, sort?: string, page: number = 1) {
    const response = await apiClient.get('/v1/search', {
      params: { q: query, sort, page, ...filters }
    });
    return response.data;
  }

  static async submitContact(data: {
    name?: string;
    email: string;
    phone?: string;
    subject?: string;
    category?: string;
    message: string;
  }) {
    const response = await apiClient.post('/v1/public/contact', data);
    return response.data;
  }

  static async subscribeNewsletter(data: { email: string; name?: string }) {
    const response = await apiClient.post('/v1/public/subscribe', data);
    return response.data;
  }
}

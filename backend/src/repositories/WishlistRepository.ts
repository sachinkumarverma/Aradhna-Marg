import { db } from '@common/database/DatabaseClient';

export interface WishlistItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  title: string;
  hindi_title?: string | null;
  slug?: string | null;
  created_at: Date;
}

export class WishlistRepository {
  async getByUserId(userId: string): Promise<WishlistItem[]> {
    const res = await db.query(
      `SELECT * FROM user_wishlists 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async exists(userId: string, itemId: string, itemType = 'bhajan'): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM user_wishlists 
       WHERE user_id = $1 AND item_id = $2 AND item_type = $3 
       LIMIT 1`,
      [userId, String(itemId), itemType]
    );
    return res.rows.length > 0;
  }

  async add(item: {
    user_id: string;
    item_id: string;
    item_type?: string;
    title: string;
    hindi_title?: string | null;
    slug?: string | null;
  }): Promise<WishlistItem> {
    const itemType = item.item_type || 'bhajan';
    const res = await db.query(
      `INSERT INTO user_wishlists (user_id, item_id, item_type, title, hindi_title, slug)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, item_id, item_type) DO UPDATE SET title = EXCLUDED.title
       RETURNING *`,
      [item.user_id, String(item.item_id), itemType, item.title, item.hindi_title || null, item.slug || null]
    );
    return res.rows[0];
  }

  async remove(userId: string, itemId: string, itemType = 'bhajan'): Promise<boolean> {
    const res = await db.query(
      `DELETE FROM user_wishlists 
       WHERE user_id = $1 AND item_id = $2 AND item_type = $3`,
      [userId, String(itemId), itemType]
    );
    return (res.rowCount || 0) > 0;
  }

  async syncBatch(
    userId: string,
    items: Array<{
      item_id: string;
      item_type?: string;
      title: string;
      hindi_title?: string | null;
      slug?: string | null;
    }>
  ): Promise<void> {
    for (const item of items) {
      await this.add({
        user_id: userId,
        item_id: item.item_id,
        item_type: item.item_type,
        title: item.title,
        hindi_title: item.hindi_title,
        slug: item.slug
      });
    }
  }
}

export const wishlistRepository = new WishlistRepository();

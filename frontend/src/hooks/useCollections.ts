import { useQuery } from '@tanstack/react-query';
import { PublicApi } from '@api/publicApi';

export const useCollections = (type: 'categories' | 'gods' | 'deities' | 'festivals') => {
  return useQuery({
    queryKey: ['collections', type],
    queryFn: async () => {
      if (type === 'gods' || type === 'deities') {
        const data = await PublicApi.getDeities();
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          count: 0,
          thumbnail: d.image || '/Deities/Krishna.png'
        }));
      }

      if (type === 'festivals') {
        const res = await PublicApi.getFestivals({ limit: 20 });
        return (res.data || []).map((f: any) => ({
          id: f.id,
          name: f.displayName || f.name,
          slug: f.slug,
          count: 0,
          thumbnail: f.banner_image
        }));
      }

      const data = await PublicApi.getCategories();
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: 0,
        thumbnail: c.image_url || c.icon_url
      }));
    },
    staleTime: 5 * 60 * 1000
  });
};

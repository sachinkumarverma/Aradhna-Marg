import { useQuery } from '@tanstack/react-query';

export const useCollections = (type: 'categories' | 'gods' | 'festivals') => {
  return useQuery({
    queryKey: ['collections', type],
    queryFn: async () => {
      if (type === 'gods') {
        return [
          { id: 1, name: 'Shiva', count: 120, thumbnail: 'https://images.unsplash.com/photo-1605995536553-6a9b4070a256?auto=format&fit=crop&q=80&w=400' },
          { id: 2, name: 'Krishna', count: 450, thumbnail: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&q=80&w=400' },
          { id: 3, name: 'Hanuman', count: 85, thumbnail: 'https://images.unsplash.com/photo-1632283087383-719323f4a36b?auto=format&fit=crop&q=80&w=400' },
          { id: 4, name: 'Ganesha', count: 95, thumbnail: 'https://images.unsplash.com/photo-1627855325883-9b36ebfc538c?auto=format&fit=crop&q=80&w=400' },
        ];
      }
      
      return [
        { id: 1, name: 'Morning Bhajans', count: 45 },
        { id: 2, name: 'Aarti Sangrah', count: 12 },
        { id: 3, name: 'Chalisa', count: 8 },
        { id: 4, name: 'Mantra', count: 104 },
      ];
    },
    staleTime: 5 * 60 * 1000,
  });
};

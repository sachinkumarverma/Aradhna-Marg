import React from 'react';
import { motion } from 'framer-motion';
import { CollectionHero } from '../../components/layout/CollectionHero';
import { BhajanCarousel } from '../../components/carousels/BhajanCarousel';
import { CollectionCarousel } from '../../components/carousels/CollectionCarousel';
import { useCollections } from '../../hooks/useCollections';

// Mock Data for UI Foundation
const mockBhajans = [
  { title: "Hanuman Chalisa Fast", godName: "Hanuman", views: 152000, duration: "8 Min" },
  { title: "Shiv Tandav Stotram", godName: "Shiva", views: 89000, duration: "12 Min" },
  { title: "Achyutam Keshavam", godName: "Krishna", views: 450000, duration: "6 Min" },
  { title: "Sankat Mochan Hanuman", godName: "Hanuman", views: 32000, duration: "10 Min" },
  { title: "Om Jai Jagdish Hare", godName: "Vishnu", views: 760000, duration: "5 Min" },
];

export const ExplorePage: React.FC = () => {
  const { data: gods = [] } = useCollections('gods');
  const { data: categories = [] } = useCollections('categories');

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pb-20">
      <CollectionHero 
        title="Explore Bhajans"
        description="Discover our vast collection of divine melodies, categorized perfectly for your daily spiritual practice."
        breadcrumbs={[{ label: 'Explore', path: '/explore' }]}
      />

      <div className="mt-8 space-y-12">
        {/* Most Popular Gods Collection */}
        <CollectionCarousel 
          title="Popular Deities" 
          items={gods} 
          type="god" 
        />

        {/* Trending Bhajans Carousel */}
        <BhajanCarousel 
          title="Trending Today" 
          items={mockBhajans}
          onViewAll={() => console.log('View all trending')}
        />

        {/* Categories Collection */}
        <CollectionCarousel 
          title="Browse by Category" 
          items={categories} 
          type="category" 
        />

        {/* Morning Specials Carousel */}
        <BhajanCarousel 
          title="Morning Specials" 
          items={[...mockBhajans].reverse()} 
        />

        {/* Ad Placeholder between heavy sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full h-32 bg-gray-200 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-500">
            Advertisement Placeholder
          </div>
        </div>

        {/* Evening Specials Carousel */}
        <BhajanCarousel 
          title="Peaceful Evening Aartis" 
          items={mockBhajans} 
        />
      </div>
    </div>
  );
};

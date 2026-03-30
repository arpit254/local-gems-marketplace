import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceData } from '@/hooks/use-marketplace';

export default function CategoryGrid() {
  const navigate = useNavigate();
  const { data } = useMarketplaceData();
  const categories = data?.categories ?? [];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">Shop by Category</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/search?category=${encodeURIComponent(cat.name)}`)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 border"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-muted-foreground">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

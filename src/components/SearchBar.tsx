import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceData } from '@/hooks/use-marketplace';

export default function SearchBar({ large = false }: { large?: boolean }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const { data } = useMarketplaceData();
  const products = data?.products ?? [];

  const handleChange = (val: string) => {
    setQuery(val);
    if (val.trim().length > 0) {
      const matches = products
        .filter(p => p.name.toLowerCase().includes(val.toLowerCase()))
        .map(p => p.name)
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const selectSuggestion = (s: string) => {
    setQuery(s);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(s)}`);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className={`flex items-center bg-card border rounded-full overflow-hidden transition-shadow focus-within:shadow-card-hover focus-within:ring-2 focus-within:ring-primary/30 ${large ? 'h-14' : 'h-11'}`}>
        <Search className={`ml-4 text-muted-foreground ${large ? 'h-5 w-5' : 'h-4 w-4'}`} />
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search for milk, vegetables, snacks..."
          className={`flex-1 bg-transparent border-none outline-none px-3 text-foreground placeholder:text-muted-foreground ${large ? 'text-base' : 'text-sm'}`}
        />
        <button type="submit" className={`gradient-hero text-primary-foreground font-medium rounded-full mr-1 transition-transform hover:scale-105 ${large ? 'px-6 py-2' : 'px-4 py-1.5 text-sm'}`}>
          Search
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-xl shadow-card-hover overflow-hidden z-50">
          {suggestions.map(s => (
            <button
              key={s}
              onMouseDown={() => selectSuggestion(s)}
              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Search className="h-3 w-3 text-muted-foreground" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

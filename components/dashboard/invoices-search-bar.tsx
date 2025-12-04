'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Initialize search term from URL
  useEffect(() => {
    const initialSearch = searchParams.get('search') || '';
    setSearchTerm(initialSearch);
  }, [searchParams]);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const debouncedHandleSearch = debounce(handleSearch, 300);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          debouncedHandleSearch(e.target.value);
        }}
        className="pl-10 rounded-lg border-white"
      />
    </div>
  );
}

// Debounce function to limit API calls
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
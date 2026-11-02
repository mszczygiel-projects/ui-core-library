import { Combobox } from '@mszczygiel-projects/ui-core-react';
import type { ListboxItems } from '@mszczygiel-projects/ui-core-shared/listbox';
import { useEffect, useState } from 'react';

export function CityField() {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ListboxItems>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/cities?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((response) => response.json() as Promise<ListboxItems>)
        .then(
          (found) => {
            setOptions(found);
            setLoading(false);
          },
          () => undefined,
        );
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <Combobox
      label="City"
      filterMode="remote"
      options={options}
      loading={loading}
      onQueryChange={setQuery}
    />
  );
}

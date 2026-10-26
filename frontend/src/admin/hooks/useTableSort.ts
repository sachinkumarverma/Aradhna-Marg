import React from 'react';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export function useTableSort<T>(
  data: T[],
  defaultFieldOrConfig: string | { key?: string; direction?: 'asc' | 'desc' } | null = null,
  defaultDirectionArg: 'asc' | 'desc' = 'asc',
  customGetters?: Record<string, (item: T) => any>
) {
  let initField: string | null = null;
  let initDirection: 'asc' | 'desc' = defaultDirectionArg;

  if (typeof defaultFieldOrConfig === 'string') {
    initField = defaultFieldOrConfig;
  } else if (defaultFieldOrConfig && typeof defaultFieldOrConfig === 'object') {
    initField = defaultFieldOrConfig.key || null;
    if (defaultFieldOrConfig.direction) {
      initDirection = defaultFieldOrConfig.direction;
    }
  }

  const [sortField, setSortField] = React.useState<string | null>(initField);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(initDirection);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      const f = field.toLowerCase();
      if (
        f.includes('date') ||
        f.includes('created') ||
        f.includes('updated') ||
        f.includes('publish') ||
        f.includes('views') ||
        f.includes('download') ||
        f.includes('amount') ||
        f.includes('total') ||
        f.includes('contribution')
      ) {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortField || !data || data.length <= 1) return data;

    return [...data].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (customGetters && customGetters[sortField]) {
        valA = customGetters[sortField](a);
        valB = customGetters[sortField](b);
      } else {
        valA = (a as any)[sortField];
        valB = (b as any)[sortField];
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined || valA === '') return 1;
      if (valB === null || valB === undefined || valB === '') return -1;

      // Numeric comparison
      const numA = typeof valA === 'number' ? valA : !isNaN(Number(valA)) && valA !== '' ? Number(valA) : null;
      const numB = typeof valB === 'number' ? valB : !isNaN(Number(valB)) && valB !== '' ? Number(valB) : null;
      if (numA !== null && numB !== null) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Boolean comparison
      if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        return sortDirection === 'asc' ? (valA === valB ? 0 : valA ? 1 : -1) : valA === valB ? 0 : valA ? -1 : 1;
      }

      // Date comparison
      const isDateA = valA instanceof Date || (typeof valA === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valA));
      const isDateB = valB instanceof Date || (typeof valB === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valB));
      if (isDateA && isDateB) {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }
      }

      // Multilingual string comparison (Hindi Devanagari + English)
      const strA = String(valA);
      const strB = String(valB);
      const comp = strA.localeCompare(strB, 'hi', { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [data, sortField, sortDirection, customGetters]);

  return {
    sortedData,
    sortField,
    sortDirection,
    handleSort,
    requestSort: handleSort,
    sortConfig: sortField ? { key: sortField, direction: sortDirection } : null,
    setSortField,
    setSortDirection
  };
}

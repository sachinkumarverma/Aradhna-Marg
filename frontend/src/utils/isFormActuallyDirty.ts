export function isFormActuallyDirty(currentValues: any, defaultValues: any): boolean {
  if (!currentValues || !defaultValues) return true;

  const checkEquality = (a: any, b: any): boolean => {
    if (a === b) return true;

    // Treat undefined, null, and empty string as equivalent for forms
    const isFalsyA = a === undefined || a === null || a === '';
    const isFalsyB = b === undefined || b === null || b === '';
    if (isFalsyA && isFalsyB) return true;

    if (typeof a === 'string' && typeof b === 'string') {
      return a.trim() === b.trim();
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, index) => checkEquality(val, b[index]));
    }

    if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      // We check all keys in A to see if they match B
      for (const key of keysA) {
        if (!checkEquality(a[key], b[key])) return false;
      }
      
      // We also check keys in B that might not be in A, but ensure they are equivalent to "empty"
      for (const key of keysB) {
        if (!keysA.includes(key) && !checkEquality(undefined, b[key])) {
          return false;
        }
      }
      return true;
    }

    return false;
  };

  return !checkEquality(currentValues, defaultValues);
}

import { useCallback, useEffect, useState } from 'react';

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

export function useQueryParams() {
  const [params, setParams] = useState(() => getSearchParams());

  // Sync on back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setParams(getSearchParams());
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setQueryParams = useCallback(
    (
      updater: (params: URLSearchParams) => void,
      options?: { replace?: boolean },
    ) => {
      const newParams = new URLSearchParams(window.location.search);
      updater(newParams);

      const newUrl =
        window.location.pathname +
        (newParams.toString() ? `?${newParams.toString()}` : '');

      if (options?.replace) {
        window.history.replaceState(null, '', newUrl);
      } else {
        window.history.pushState(null, '', newUrl);
      }

      setParams(newParams);
    },
    [],
  );

  return { params, setQueryParams };
}

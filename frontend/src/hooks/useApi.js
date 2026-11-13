import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';

// Runs `fetcher` whenever `deps` change and exposes loading / error / data / reload.
export default function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      if (id === latest.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (id === latest.current) setState({ data: null, loading: false, error: getErrorMessage(err) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

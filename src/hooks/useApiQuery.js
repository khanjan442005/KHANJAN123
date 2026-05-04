import { useEffect, useState } from 'react';
import { getErrorMessage } from '../services/http';

export function useApiQuery(loader, dependencies) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: ''
  });

  useEffect(() => {
    let active = true;

    setState((current) => ({
      ...current,
      loading: true,
      error: ''
    }));

    Promise.resolve(loader())
      .then((data) => {
        if (!active) {
          return;
        }

        setState({
          loading: false,
          data,
          error: ''
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setState({
          loading: false,
          data: null,
          error: getErrorMessage(error)
        });
      });

    return () => {
      active = false;
    };
  }, [...dependencies, version]);

  return {
    ...state,
    reload: () => setVersion((current) => current + 1)
  };
}

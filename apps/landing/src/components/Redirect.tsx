import { useEffect } from 'react';

export function Redirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.href = url;
  }, [url]);
  return <></>;
}

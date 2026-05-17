import Script from "next/script";

/**
 * AdSense loader. Mounts the publisher script when
 * NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT is set (e.g. "ca-pub-1234567890123456").
 *
 * Until AdSense approves the site, leave the env var blank — the script
 * won't render and there's nothing for Google to verify on the page.
 * After approval, set the env var and rebuild so every page carries the
 * publisher tag (a requirement for AdSense).
 */
export function GoogleAdSense() {
  const client = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT;
  if (!client) return null;
  return (
    <Script
      id="google-adsense"
      async
      strategy="lazyOnload"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
    />
  );
}

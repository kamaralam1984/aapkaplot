import Script from "next/script";

/**
 * GA4 loader. Reads NEXT_PUBLIC_GA_ID at build time so the measurement ID is
 * baked into the static HTML. Renders nothing when the env var is absent.
 *
 * Consent: we default to denied for ad_storage and analytics_storage and let
 * the CookieConsent banner flip the flags via gtag('consent','update', ...).
 * This is the Consent Mode v2 pattern Google now requires for India/EU.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="lazyOnload"
      />
      <Script id="ga-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted',
            wait_for_update: 500,
          });
          var stored = null;
          try { stored = localStorage.getItem('akp_consent'); } catch (e) {}
          if (stored === 'all') {
            gtag('consent', 'update', {
              ad_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted',
              analytics_storage: 'granted',
            });
          } else if (stored === 'analytics') {
            gtag('consent', 'update', { analytics_storage: 'granted' });
          }
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

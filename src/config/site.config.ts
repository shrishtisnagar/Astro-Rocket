import { SITE_URL, GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION } from 'astro:env/server';

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  author: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  socialLinks: string[];
  twitter?: {
    site: string;
    creator: string;
  };
  verification?: {
    google?: string;
    bing?: string;
  };
  /** Path to author photo (relative to site root, e.g. '/avatar.jpg'). Used in Person schema. */
  authorImage?: string;
  /**
   * Set to false if your blog post images already match your theme color
   * and you don't want the brand color overlay applied on top of them.
   */
  blogImageOverlay?: boolean;
  /**
   * Branding configuration
   * Logo files: Replace SVGs in src/assets/branding/
   * Favicon: Replace in public/favicon.svg
   */
  branding: {
    /** Logo alt text for accessibility */
    logo: {
      alt: string;
      /** Path to logo image for structured data (e.g. '/logo.png'). Add a PNG to public/ and set this. */
      imageUrl?: string;
    };
    /** Favicon path (lives in public/) */
    favicon: {
      svg: string;
    };
    /** Theme colors for manifest and browser UI */
    colors: {
      /** Browser toolbar color (hex) */
      themeColor: string;
      /** PWA splash screen background (hex) */
      backgroundColor: string;
    };
  };
}

const siteConfig: SiteConfig = {
  name: 'The S Curve',
  description: 'Marketing Strategist for B2B leaders — strategy, positioning, and growth systems that actually work.',
  url: SITE_URL || 'https://shrishtisnagar.github.io/Astro-Rocket',
  ogImage: '/og-default.svg',
  author: 'Shrishti S Nagar',
  email: 'shrishtisnagar@gmail.com',
  address: {
    street: '',
    city: 'New Delhi',
    state: 'Delhi',
    zip: '',
    country: 'India',
  },
  socialLinks: [
    'https://x.com/shrishtisnagar',
    'https://www.linkedin.com/in/shrishtisnagar',
  ],
  twitter: {
    site: 'https://x.com/shrishtisnagar',
    creator: '@shrishtisnagar',
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    bing: BING_SITE_VERIFICATION,
  },
  authorImage: '/images/photo.png',
  blogImageOverlay: true,
  branding: {
    logo: {
      alt: 'The S Curve',
      imageUrl: '/images/logo.png',
    },
    favicon: {
      svg: '/favicon.svg',
    },
    colors: {
      themeColor: '#2b1422',
      backgroundColor: '#0a0408',
    },
  },
};

export default siteConfig;

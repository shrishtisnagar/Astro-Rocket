import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import netlify from '@astrojs/netlify';

const isNetlify = process.env.DEPLOY_TARGET === 'netlify';

// ─── Rehype plugin: fix image src paths when deployed under a base sub-path ───
// When the site is hosted on GitHub Pages (e.g. /Astro-Rocket/), markdown
// images use absolute paths like /images/projects/foo.png.  Those paths are
// NOT automatically rewritten to include the base path, so the browser fetches
// the wrong URL and images fail to load (showing only the CSS border = "a line").
// This plugin rewrites every <img src="/..."> to <img src="<base>/..."> at
// build time, matching how assetUrl() works for hero images.
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/$/, '');

function rehypeRebaseImages() {
  return function transformer(tree) {
    if (!BASE_PATH) return; // No sub-path (e.g. Vercel / local dev) — nothing to do

    function walk(node) {
      if (node.type === 'element' && node.tagName === 'img') {
        const src = node.properties && node.properties.src;
        if (
          typeof src === 'string' &&
          src.startsWith('/') &&
          !src.startsWith(BASE_PATH + '/')
        ) {
          node.properties.src = BASE_PATH + src;
        }
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(walk);
      }
    }
    walk(tree);
  };
}

export default defineConfig({
  output: 'static',
  adapter: isNetlify ? netlify() : vercel(),
  site: process.env.SITE_URL || 'https://example.com',
  base: process.env.BASE_PATH || '/',

  build: {
    inlineStylesheets: 'always',
  },

  env: {
    schema: {
      SITE_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      PUBLIC_GA_MEASUREMENT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      NEWSLETTER_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_SITE_VERIFICATION: envField.string({ context: 'server', access: 'public', optional: true }),
      BING_SITE_VERIFICATION: envField.string({ context: 'server', access: 'public', optional: true }),
      PUBLIC_GOOGLE_MAPS_API_KEY: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
      PUBLIC_CONSENT_ENABLED: envField.boolean({ context: 'client', access: 'public', optional: true, default: false }),
      PUBLIC_PRIVACY_POLICY_URL: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
    },
  },

  image: {
    layout: 'constrained',
  },

  integrations: [
    react(),
    mdx(),
    sitemap(),
    icon(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  security: {
    checkOrigin: true,
  },

  markdown: {
    rehypePlugins: [rehypeRebaseImages],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },

});

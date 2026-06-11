export interface Product {
  slug: string;
  type: string;
  typeIcon: 'video' | 'file';
  title: string;
  description: string;
  price: number | null;
  originalPrice: number | null;
  rating?: number;
  image: string;
  checkoutUrl: string;
  features: string[];
  badge?: string;
}

export const products: Product[] = [
  {
    slug: 'deep-consultation-60',
    type: 'Video Meeting · 60 mins',
    typeIcon: 'video',
    title: '1:1 Deep Consultation – 60 mins',
    description: 'For Marketing & Business Needs. Get a dedicated 60-minute strategy session to tackle your toughest growth challenges.',
    price: 2500,
    originalPrice: 8000,
    image: '/images/products/deep-consultation.svg',
    checkoutUrl: 'https://topmate.io/shrishtisnagar',
    badge: 'Most Popular',
    features: [
      '60-minute focused strategy call',
      'Marketing & business growth audit',
      'Custom action plan',
      'Follow-up notes & resources',
    ],
  },
  {
    slug: 'personal-branding-checklist',
    type: 'Digital Product',
    typeIcon: 'file',
    title: 'Personal Branding Checklist – LinkedIn',
    description: 'Level up your personal brand on LinkedIn with this step-by-step checklist.',
    price: 0,
    originalPrice: 500,
    image: '/images/products/personal-branding-checklist.svg',
    checkoutUrl: 'https://topmate.io/shrishtisnagar',
    badge: 'Free',
    features: [
      'Step-by-step LinkedIn profile checklist',
      'Profile optimisation tips',
      'Content strategy basics',
      'Instantly downloadable PDF',
    ],
  },
  {
    slug: 'quick-call',
    type: 'Video Meeting · 30 mins',
    typeIcon: 'video',
    title: 'Quick Call – Ask Me Anything',
    description: 'For freelancers and small business owners (< 10 employees). No agenda needed — just bring your question.',
    price: 1499,
    originalPrice: 3000,
    rating: 5,
    image: '/images/products/quick-call.svg',
    checkoutUrl: 'https://topmate.io/shrishtisnagar',
    features: [
      '30-minute open Q&A session',
      'Marketing, positioning, or growth',
      'No prep required',
      'Actionable answers & next steps',
    ],
  },
  {
    slug: 'linkedin-reporting-tool',
    type: 'Digital Product',
    typeIcon: 'file',
    title: 'LinkedIn Reporting Tool',
    description: 'Track and analyse your LinkedIn performance with pre-built dashboards and monthly report templates.',
    price: 299,
    originalPrice: 799,
    image: '/images/products/linkedin-reporting-tool.svg',
    checkoutUrl: 'https://topmate.io/shrishtisnagar',
    features: [
      'Pre-built LinkedIn analytics dashboard',
      'Track impressions, reach & engagement',
      'Monthly & weekly report templates',
      'Easy-to-use spreadsheet format',
    ],
  },
];

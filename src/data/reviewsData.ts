import { Review } from '../types';

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-rose-1',
    productName: 'Dutch Hybrid Red Rose',
    userName: 'Kavitha Ramachandran',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    title: 'Stunning blooms within 2 weeks!',
    comment: 'I ordered 3 Dutch Hybrid Red Rose saplings from Veerika Rose Garden. The root packing was filled with organic gel and moisture moss, keeping it 100% fresh during shipping to Chennai. Within 15 days, double bud blooms started opening up!',
    status: 'APPROVED',
    createdAt: '2026-08-01',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    location: 'Chennai, Tamil Nadu',
    isVerified: true,
    featured: true
  },
  {
    id: 'rev-2',
    productId: 'prod-mango-1',
    productName: 'Alphonso Grafted Mango Sapling',
    userName: 'Suresh Kumar',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    title: 'Healthy grafted sapling arrived safe',
    comment: 'The stem graft quality is outstanding! Received deep red soil container packaging. The plant height was over 2 feet as advertised. Highly recommend buying live grafted fruit trees directly from Pennagaram nursery.',
    status: 'APPROVED',
    createdAt: '2026-08-05',
    imageUrl: 'https://images.unsplash.com/photo-1596160161427-bc324f9f4a56?auto=format&fit=crop&w=800&q=80',
    location: 'Coimbatore, Tamil Nadu',
    isVerified: true,
    featured: true
  },
  {
    id: 'rev-3',
    productId: 'prod-jasmine-1',
    productName: 'Madurai Gundu Malli (Jasmine)',
    userName: 'Priya Sundaram',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    title: 'Aromatic & heavenly fragrance!',
    comment: 'The scent of real Gundu Malli fills my entire terrace garden every evening. The nursery team even provided a free care card detailing organic neem oil watering schedule.',
    status: 'APPROVED',
    createdAt: '2026-08-08',
    imageUrl: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80',
    location: 'Madurai, Tamil Nadu',
    isVerified: true,
    featured: true
  },
  {
    id: 'rev-4',
    productId: 'prod-hibiscus-1',
    productName: 'Multicolor Layered Hibiscus',
    userName: 'Anand Viswanathan',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    title: 'Vibrant double petal yellow-pink flowers',
    comment: 'Package reached Salem within 24 hours of dispatch. Plant leaf color was dark glossy green with zero wilt. Will buy rare bougainvilleas next month!',
    status: 'APPROVED',
    createdAt: '2026-08-09',
    imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
    location: 'Salem, Tamil Nadu',
    isVerified: true,
    featured: true
  }
];

import React from 'react';
import { Link } from 'react-router-dom';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';

const NotFound = () => (
  <div className="min-h-screen bg-white">
    <Navbar2 />
    <main className="flex flex-col items-center justify-center text-center px-6 py-24">
      <p className="text-6xl md:text-8xl font-light tracking-tight text-neutral-900">404</p>
      <h1 className="mt-4 text-xl md:text-2xl font-medium text-neutral-800">Page not found</h1>
      <p className="mt-2 max-w-md text-sm md:text-base text-neutral-500">
        The page you are looking for doesn't exist or may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-full hover:bg-neutral-700 transition-colors"
        >
          Back to Home
        </Link>
        <Link
          to="/shop"
          className="px-6 py-3 border border-neutral-300 text-neutral-800 text-sm font-medium rounded-full hover:border-neutral-900 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default NotFound;

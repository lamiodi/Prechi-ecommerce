import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ArrowRight } from '@phosphor-icons/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const api = axios.create({ baseURL: API_BASE_URL });

const NewsletterForm = ({ inverted }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    setStatus('idle');
    try {
      const response = await api.post('/api/newsletter/subscribe', { email });
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        setEmail('');
      } else {
        throw new Error(response.data.message || 'Subscription failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message ||
        error.message ||
        'Failed to subscribe. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const bg = inverted ? 'bg-Primarycolor' : 'bg-surface';
  const text = inverted ? 'text-white' : 'text-Primarycolor';
  const textMuted = inverted ? 'text-white/50' : 'text-text-secondary';
  const textFaint = inverted ? 'text-white/30' : 'text-text-tertiary';
  const inputBg = inverted ? 'bg-white/10' : 'bg-white';
  const inputBorder = inverted ? 'border-white/10 focus:border-white/30' : 'border-border focus:border-Primarycolor';
  const inputText = inverted ? 'text-white placeholder:text-white/30' : 'text-Primarycolor placeholder:text-text-tertiary';

  return (
    <section className={`${bg} py-16 md:py-20 lg:py-24`}>
      <div className="section-container">
        <div className="max-w-2xl mx-auto text-center">
          {/* Eyebrow */}
          <span className={`text-xs font-display font-medium tracking-[0.15em] uppercase ${textMuted} mb-4 block`}>
            Newsletter
          </span>

          {/* Heading */}
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-semibold tracking-tight leading-tight ${text} mb-4`}
            style={{ textWrap: 'balance' }}
          >
            Get 10% off your first order
          </h2>

          {/* Description */}
          <p className={`text-sm sm:text-base ${textMuted} font-display mb-8 max-w-md mx-auto`}>
            Subscribe for early access to new drops, restocks, and exclusive member deals.
          </p>

          {/* Status messages */}
          {status === 'success' && (
            <div className="flex items-center justify-center gap-2 p-3 bg-success/10 border border-success/20 rounded-sm mb-6 max-w-md mx-auto">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              <p className="text-success text-sm font-display">{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center justify-center gap-2 p-3 bg-error/10 border border-error/20 rounded-sm mb-6 max-w-md mx-auto">
              <AlertCircle className="h-4 w-4 text-error flex-shrink-0" />
              <p className="text-error text-sm font-display">{message}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address"
                placeholder="Enter your email"
                className={`flex-1 h-12 px-4 text-sm font-display border ${inputBg} ${inputBorder} ${inputText} focus:outline-none transition-colors duration-300`}
              />
              <button
                type="submit"
                disabled={isLoading}
                aria-label="Subscribe to newsletter"
                className={`h-12 px-6 text-sm font-display font-medium tracking-[0.04em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
                  inverted
                    ? 'bg-white text-Primarycolor hover:bg-white/90'
                    : 'bg-Primarycolor text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight size={16} weight="bold" />
                )}
              </button>
            </div>
            <p className={`text-[0.6875rem] ${textFaint} font-display mt-3`}>
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default NewsletterForm;

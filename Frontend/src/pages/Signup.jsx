import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, WarningCircle, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import axios from 'axios';
import SEO from '../components/SEO';
import { Button } from '../components/ui/button';
import Pic1 from '../assets/images/IMG_4558.JPG';
import Pic2 from '../assets/images/IMG_4571.JPG';
import Pic3 from '../assets/images/IMG_4566 (1).png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prechi-ecommerce.onrender.com';

const SignupPage = () => {
  const navigate = useNavigate();

  const carouselImages = [
    {
      src: Pic1,
      title: 'Step Into Your Power',
      description: 'Create your account and join a growing tribe of bold individuals redefining comfort and performance.',
    },
    {
      src: Pic2,
      title: 'Perks Just for You',
      description: 'Get early access to drops, member-only discounts, and gear that fits your lifestyle.',
    },
    {
      src: Pic3,
      title: 'Shop with Confidence',
      description: 'Your privacy matters. Enjoy a seamless, secure experience every time you suit up.',
    },
  ];

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_number: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const validateField = useCallback((name, value) => {
    const errors = {};
    if (name === 'first_name' && !value.trim()) errors.first_name = 'First name is required';
    if (name === 'last_name' && !value.trim()) errors.last_name = 'Last name is required';
    if (name === 'email') {
      if (!value.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) errors.password = 'Password is required';
      else if (value.length < 8) errors.password = 'Min 8 characters';
      else if (!/[A-Z]/.test(value)) errors.password = 'Must include at least one uppercase letter';
      else if (!/[a-z]/.test(value)) errors.password = 'Must include at least one lowercase letter';
      else if (!/[0-9]/.test(value)) errors.password = 'Must include at least one number';
      else if (!/[^A-Za-z0-9]/.test(value)) errors.password = 'Must include at least one special character';
    }
    if (name === 'confirm_password' && value !== formData.password) {
      errors.confirm_password = 'Passwords do not match';
    }
    return errors;
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    const fieldErrors = validateField(name, value);
    if (Object.keys(fieldErrors).length > 0) {
      setTimeout(() => {
        setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
      }, 300);
    }
    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };

  const validateForm = () => {
    const allErrors = {
      ...validateField('first_name', formData.first_name),
      ...validateField('last_name', formData.last_name),
      ...validateField('email', formData.email),
      ...validateField('password', formData.password),
      ...validateField('confirm_password', formData.confirm_password),
    };
    setFormErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { confirm_password, ...signupData } = formData;
      const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, signupData);
      setSuccessMsg(res.data.message || 'Account created successfully!');
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
        phone_number: '',
      });
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-Secondarycolor">
      <SEO title="Create Account" description="Join Prechi Clothing to enjoy exclusive access and member deals." url="/signup" />

      {/* Form side */}
      <div className="flex-1 flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-10 lg:py-12 overflow-y-auto">
        <div>
          <Link to="/" className="text-xl font-display font-bold tracking-tight text-Primarycolor">
            PRECHI
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto my-auto py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-Primarycolor mb-2">
              Create account
            </h1>
            <p className="text-sm font-display text-text-secondary">
              Unlock member benefits and early access to drops.
            </p>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-sm mb-6">
              <CheckCircle size={16} className="text-success flex-shrink-0" weight="fill" />
              <p className="text-xs font-display text-success">{successMsg}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-sm mb-6">
              <WarningCircle size={16} className="text-error flex-shrink-0" weight="fill" />
              <p className="text-xs font-display text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="block text-xs font-display font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                  First name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  autoComplete="given-name"
                  className={`w-full h-11 px-3.5 text-sm font-display bg-white border ${
                    formErrors.first_name ? 'border-error' : 'border-border'
                  } text-Primarycolor placeholder:text-text-tertiary rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200`}
                />
                {formErrors.first_name && (
                  <p className="mt-1 text-xs text-error font-display">{formErrors.first_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-xs font-display font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                  Last name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  autoComplete="family-name"
                  className={`w-full h-11 px-3.5 text-sm font-display bg-white border ${
                    formErrors.last_name ? 'border-error' : 'border-border'
                  } text-Primarycolor placeholder:text-text-tertiary rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200`}
                />
                {formErrors.last_name && (
                  <p className="mt-1 text-xs text-error font-display">{formErrors.last_name}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-display font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                autoComplete="email"
                className={`w-full h-11 px-3.5 text-sm font-display bg-white border ${
                  formErrors.email ? 'border-error' : 'border-border'
                } text-Primarycolor placeholder:text-text-tertiary rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200`}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-error font-display">{formErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone_number" className="block text-xs font-display font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                Phone <span className="text-text-tertiary font-normal">(optional)</span>
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+234..."
                autoComplete="tel"
                className="w-full h-11 px-3.5 text-sm font-display bg-white border border-border text-Primarycolor placeholder:text-text-tertiary rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-display font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full h-11 pl-3.5 pr-10 text-sm font-display bg-white border ${
                    formErrors.password ? 'border-error' : 'border-border'
                  } text-Primarycolor placeholder:text-text-tertiary rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-Primarycolor transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash size={16} weight="light" /> : <Eye size={16} weight="light" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-xs text-error font-display">{formErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-xs font-display font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                Confirm password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full h-11 px-3.5 text-sm font-display bg-white border ${
                  formErrors.confirm_password ? 'border-error' : 'border-border'
                } text-Primarycolor placeholder:text-text-tertiary rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200`}
              />
              {formErrors.confirm_password && (
                <p className="mt-1 text-xs text-error font-display">{formErrors.confirm_password}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <CircleNotch size={16} className="animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs font-display text-text-tertiary">
              Already have an account?{' '}
              <Link to="/login" className="text-Primarycolor font-medium hover:underline transition-all">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="text-xs font-display text-text-tertiary text-center lg:text-left">
          &copy; {new Date().getFullYear()} Prechi Clothing
        </div>
      </div>

      {/* Editorial right photo panel */}
      <div className="hidden lg:block lg:w-1/2 relative bg-Primarycolor overflow-hidden">
        {carouselImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.src}
              alt={image.title}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-Primarycolor via-Primarycolor/20 to-transparent" />
            <div className="absolute bottom-16 left-12 right-12 text-white">
              <span className="text-xs font-display font-medium tracking-[0.15em] uppercase text-white/50 mb-3 block">
                Prechi Community
              </span>
              <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight mb-2">
                {image.title}
              </h2>
              <p className="text-sm font-display text-white/60 max-w-md font-light">
                {image.description}
              </p>
            </div>
          </div>
        ))}

        <div className="absolute top-12 right-12 flex gap-2 z-10">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-0.5 rounded-full transition-all duration-500 ${
                index === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/30'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EnvelopeSimple, LockKey, Eye, EyeSlash, WarningCircle, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import Pic1 from '../assets/images/IMG_4552.JPG';
import Pic2 from '../assets/images/IMG_4554.JPG';
import Pic3 from '../assets/images/IMG_4559.JPG';
import axios from 'axios';
import SEO from '../components/SEO';
import { Button } from '../components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const carouselImages = [
    {
      src: Pic1,
      title: 'Unleash Your Potential',
      description: 'Step into performance-ready tracksuits and sets crafted for movement, comfort, and confidence.',
    },
    {
      src: Pic2,
      title: 'Built for Every Body',
      description: 'From intense workouts to everyday comfort — our pieces are designed to move with you.',
    },
    {
      src: Pic3,
      title: 'Style Meets Strength',
      description: 'Elevate your activewear with bold designs and breathable fabrics made to perform.',
    },
  ];

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const from = location.state?.from?.pathname || '/home';

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
    }
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [carouselImages.length, location.state]);

  const validateField = useCallback((name, value) => {
    const errors = {};
    if (name === 'email') {
      if (!value.trim()) errors.email = 'Email is required';
      else if (!EMAIL_PATTERN.test(value)) errors.email = 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) errors.password = 'Password is required';
      else if (value.length < PASSWORD_MIN_LENGTH)
        errors.password = `Min ${PASSWORD_MIN_LENGTH} characters`;
    }
    return errors;
  }, []);

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
    if (errorMsg) setErrorMsg('');
    if (successMsg) setSuccessMsg('');
  };

  const validateForm = () => {
    const allErrors = {
      ...validateField('email', formData.email),
      ...validateField('password', formData.password),
    };
    setFormErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;
      const { token, user } = data;

      if (user?.isAdmin) {
        setErrorMsg('Admins are not allowed to log in from the user portal.');
        setLoading(false);
        return;
      }

      const tokenData = decodeToken(token);
      const userWithId = {
        ...user,
        id: tokenData?.id || user.id || user.userId,
      };
      if (!userWithId.id) {
        throw new Error('No valid user ID found in user data or token');
      }

      await login(userWithId, token);

      if (rememberMe) {
        localStorage.setItem('userEmail', formData.email);
      } else {
        localStorage.removeItem('userEmail');
      }

      setSuccessMsg('Login successful! Redirecting...');
      setTimeout(() => navigate(from, { replace: true }), 800);
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setErrorMsg('Request timed out. Please try again.');
      } else if (err.response?.status === 401) {
        setErrorMsg('Invalid email or password.');
      } else if (err.response?.status === 429) {
        setErrorMsg('Too many attempts. Please try again later.');
      } else {
        setErrorMsg(
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Login failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-Secondarycolor">
      <SEO title="Sign In" description="Log in to your Prechi Clothing account." url="/login" />

      {/* Form side */}
      <div className="flex-1 flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-10 lg:py-12">
        {/* Top logo link */}
        <div>
          <Link to="/" className="text-xl font-display font-bold tracking-tight text-Primarycolor">
            PRECHI
          </Link>
        </div>

        {/* Center content */}
        <div className="w-full max-w-sm mx-auto my-auto py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-Primarycolor mb-2">
              Welcome back
            </h1>
            <p className="text-sm font-display text-text-secondary">
              Sign in to manage your account and orders.
            </p>
          </div>

          {/* Feedback messages */}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-sm mb-6">
              <CheckCircle size={16} className="text-success flex-shrink-0" weight="fill" />
              <p className="text-xs font-display text-success">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-sm mb-6">
              <WarningCircle size={16} className="text-error flex-shrink-0" weight="fill" />
              <p className="text-xs font-display text-error">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-display font-medium uppercase tracking-[0.08em] text-text-secondary mb-2">
                Email address
              </label>
              <div className="relative">
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
              </div>
              {formErrors.email && (
                <p className="mt-1.5 text-xs text-error font-display flex items-center gap-1">
                  <WarningCircle size={12} weight="bold" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-display font-medium uppercase tracking-[0.08em] text-text-secondary">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password', { state: { email: formData.email } })}
                  className="text-xs font-display text-text-tertiary hover:text-Primarycolor transition-colors duration-200"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                <p className="mt-1.5 text-xs text-error font-display flex items-center gap-1">
                  <WarningCircle size={12} weight="bold" />
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-sm border-border text-Primarycolor focus:ring-0 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs font-display text-text-secondary cursor-pointer select-none">
                Remember me on this device
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <CircleNotch size={16} className="animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Footer note */}
          <div className="mt-8 text-center">
            <p className="text-xs font-display text-text-tertiary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-Primarycolor font-medium hover:underline transition-all">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-xs font-display text-text-tertiary text-center lg:text-left">
          &copy; {new Date().getFullYear()} Prechi Clothing
        </div>
      </div>

      {/* Right editorial photo panel */}
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
                Prechi 
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

        {/* Slide indicators */}
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

export default Login;
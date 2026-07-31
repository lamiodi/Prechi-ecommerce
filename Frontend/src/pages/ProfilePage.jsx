import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Eye, EyeSlash, WarningCircle, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const res = await axios.get(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { first_name, last_name, email, phone_number } = res.data;
        setProfileForm({ first_name, last_name, email, phone_number: phone_number || '' });
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to fetch profile');
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        }
      }
    };
    fetchProfile();
  }, [user, navigate]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setProfileError('');
    setProfileSuccess(false);
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileError('');
    setProfileSuccess(false);

    if (!profileForm.first_name || !profileForm.last_name) {
      setProfileError('First name and last name are required');
      setLoading(false);
      return;
    }

    if (!emailRegex.test(profileForm.email)) {
      setProfileError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setProfileError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }
      const response = await axios.put(`${API_BASE_URL}/api/users/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (typeof updateUser === 'function') {
        updateUser(response.data);
      }
      setProfileSuccess(true);
      toast.success('Profile updated successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update profile';
      setProfileError(errorMsg);
      toast.error(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPasswordError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }
      await axios.put(
        `${API_BASE_URL}/api/users/password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update password';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor">
      <SEO title="Profile Settings" description="Manage your Prechi account preferences." url="/profile" />
      <Navbar2 />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 md:pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8 md:mb-10">
            <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-Primarycolor">
              Account settings
            </h1>
            <p className="mt-2 text-sm text-text-secondary font-display">
              Manage your personal information and security credentials.
            </p>
          </div>

          <div className="space-y-8 font-display">
            {/* Profile Section */}
            <div className="bg-surface border border-border rounded-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border">
                <User size={20} weight="light" className="text-Primarycolor" />
                <h2 className="text-base font-semibold text-Primarycolor">
                  Personal Information
                </h2>
              </div>

              {profileSuccess && (
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-sm mb-6">
                  <CheckCircle size={16} className="text-success flex-shrink-0" weight="fill" />
                  <p className="text-xs text-success">Profile updated successfully.</p>
                </div>
              )}

              {profileError && (
                <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-sm mb-6">
                  <WarningCircle size={16} className="text-error flex-shrink-0" weight="fill" />
                  <p className="text-xs text-error">{profileError}</p>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                      First name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={profileForm.first_name}
                      onChange={handleProfileChange}
                      className="w-full h-11 px-3.5 text-sm bg-white border border-border text-Primarycolor rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                      Last name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={profileForm.last_name}
                      onChange={handleProfileChange}
                      className="w-full h-11 px-3.5 text-sm bg-white border border-border text-Primarycolor rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="w-full h-11 px-3.5 text-sm bg-white border border-border text-Primarycolor rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={profileForm.phone_number}
                    onChange={handleProfileChange}
                    placeholder="+234..."
                    className="w-full h-11 px-3.5 text-sm bg-white border border-border text-Primarycolor rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary btn-md"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <CircleNotch size={16} className="animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save changes'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Section */}
            <div className="bg-surface border border-border rounded-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border">
                <Lock size={20} weight="light" className="text-Primarycolor" />
                <h2 className="text-base font-semibold text-Primarycolor">
                  Password & Security
                </h2>
              </div>

              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-sm mb-6">
                  <CheckCircle size={16} className="text-success flex-shrink-0" weight="fill" />
                  <p className="text-xs text-success">Password updated successfully.</p>
                </div>
              )}

              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-sm mb-6">
                  <WarningCircle size={16} className="text-error flex-shrink-0" weight="fill" />
                  <p className="text-xs text-error">{passwordError}</p>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                    Current password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full h-11 pl-3.5 pr-10 text-sm bg-white border border-border text-Primarycolor rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-Primarycolor transition-colors p-1"
                    >
                      {showPassword.current ? <EyeSlash size={16} weight="light" /> : <Eye size={16} weight="light" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full h-11 pl-3.5 pr-10 text-sm bg-white border border-border text-Primarycolor rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-Primarycolor transition-colors p-1"
                    >
                      {showPassword.new ? <EyeSlash size={16} weight="light" /> : <Eye size={16} weight="light" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.08em] text-text-secondary mb-1.5">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full h-11 pl-3.5 pr-10 text-sm bg-white border border-border text-Primarycolor rounded-sm focus:outline-none focus:border-Primarycolor transition-colors duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-Primarycolor transition-colors p-1"
                    >
                      {showPassword.confirm ? <EyeSlash size={16} weight="light" /> : <Eye size={16} weight="light" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-secondary btn-md"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <CircleNotch size={16} className="animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      'Update password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
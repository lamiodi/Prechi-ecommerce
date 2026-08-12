import { useState, useEffect, Fragment } from 'react';
import {
  Package,
  Trash2,
  Edit,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  Star,
  Image as ImageIcon,
  Video as VideoIcon,
  Tag,
  Layers,
  DollarSign
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toastSuccess, toastError } from '../utils/toastConfig';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prechi-ecommerce.onrender.com';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/inventory`,
  timeout: 15000,
});

const PRESET_CATEGORIES = ['Gymwears', 'Briefs', 'Sets', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories'];
const PRESET_GENDERS = ['Unisex', 'Male', 'Female'];
const PRESET_COLORS = [
  { id: 1, color_name: 'Black' },
  { id: 2, color_name: 'White' },
  { id: 3, color_name: 'Grey' },
  { id: 4, color_name: 'Navy Blue' },
  { id: 5, color_name: 'Brown' },
  { id: 6, color_name: 'Beige' },
  { id: 7, color_name: 'Red' },
  { id: 8, color_name: 'Blue' },
  { id: 9, color_name: 'Green' },
  { id: 10, color_name: 'Burgundy' },
  { id: 11, color_name: 'Pink' },
  { id: 12, color_name: 'Olive' },
];
const PRESET_SIZES = [
  { size_id: 2, size_name: 'S' },
  { size_id: 3, size_name: 'M' },
  { size_id: 4, size_name: 'L' },
  { size_id: 5, size_name: 'XL' },
  { size_id: 6, size_name: '2XL' },
  { size_id: 7, size_name: '3XL' },
];

const InventoryManager = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [conflictInfo, setConflictInfo] = useState(null);
  const [selectedPrimary, setSelectedPrimary] = useState({});

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (editingItem || confirmDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [editingItem, confirmDelete]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [productRes, bundleRes] = await Promise.all([
        api.get('/products'),
        api.get('/bundles'),
      ]);
      setProducts(productRes.data || []);
      setBundles(bundleRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      setError('');
      const response = await api.delete(`/${confirmDelete.type}s/${confirmDelete.id}`);

      if (response.data.error && response.data.conflictType === 'bundle') {
        setError(response.data.error);
        setConflictInfo({
          type: 'bundle',
          id: response.data.bundleId,
          name: confirmDelete.name,
        });
      } else {
        if (confirmDelete.type === 'product') {
          setProducts((prev) => prev.filter((p) => p.id !== confirmDelete.id));
        } else {
          setBundles((prev) => prev.filter((b) => b.id !== confirmDelete.id));
        }
        const delSuccessMsg = `${confirmDelete.type.charAt(0).toUpperCase() + confirmDelete.type.slice(1)} deleted successfully`;
        setSuccess(delSuccessMsg);
        toastSuccess(delSuccessMsg);
        setConfirmDelete(null);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      const serverErr = err.response?.data?.error;
      const serverDetails = err.response?.data?.details;
      const msg = serverErr && serverDetails ? `${serverErr}: ${serverDetails}` : (serverErr || err.message || 'Deletion failed. Please try again.');
      setError(msg);
      toastError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (item, type) => {
    const clone = JSON.parse(JSON.stringify(item));
    setEditingItem({
      ...clone,
      type,
      category: clone.category || 'Gymwears',
      gender: clone.gender || 'Unisex',
      description: clone.description || '',
      sku_prefix: clone.design_code || clone.sku_prefix || '',
      is_active: clone.is_active !== undefined ? clone.is_active : true,
      is_new_release: clone.is_new_release || false,
    });

    if (type === 'product') {
      const initialPrimary = {};
      (clone.variants || []).forEach((v) => {
        const primaryImg = (v.images || []).find((img) => img.is_primary);
        if (primaryImg) {
          initialPrimary[v.id] = primaryImg.id;
        } else if (v.images?.length > 0) {
          initialPrimary[v.id] = v.images[0].id;
        }
      });
      setSelectedPrimary(initialPrimary);
    }
  };

  const handleToggleNewRelease = async (productId, value) => {
    try {
      await api.put(`/products/${productId}`, { is_new_release: value });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_new_release: value } : p))
      );
      toastSuccess('Product badge updated');
    } catch (err) {
      const serverErr = err.response?.data?.error;
      const serverDetails = err.response?.data?.details;
      const msg = serverErr && serverDetails ? `${serverErr}: ${serverDetails}` : (serverErr || 'Failed to update new release flag');
      setError(msg);
      toastError(msg);
    }
  };

  const handleDeleteMedia = async (type, id, variantId) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      setActionLoading(true);
      await api.delete(`/variants/media/${type}/${id}`);

      setEditingItem((prev) => {
        if (!prev || prev.type !== 'product') return prev;
        return {
          ...prev,
          variants: prev.variants.map((v) => {
            if (v.id === variantId) {
              const key = type === 'image' ? 'images' : 'videos';
              return { ...v, [key]: (v[key] || []).filter((media) => media.id !== id) };
            }
            return v;
          }),
        };
      });
      const mediaSuccess = `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`;
      setSuccess(mediaSuccess);
      toastSuccess(mediaSuccess);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const serverErr = err.response?.data?.error;
      const serverDetails = err.response?.data?.details;
      const msg = serverErr && serverDetails ? `${serverErr}: ${serverDetails}` : (serverErr || `Failed to delete ${type}`);
      setError(msg);
      toastError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId, index) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;

    if (variantId && typeof variantId === 'number') {
      try {
        setActionLoading(true);
        await api.delete(`/variants/${variantId}`);
        setSuccess('Variant deleted successfully');
        toastSuccess('Variant deleted successfully');
      } catch (err) {
        const serverErr = err.response?.data?.error;
        const serverDetails = err.response?.data?.details;
        const msg = serverErr && serverDetails ? `${serverErr}: ${serverDetails}` : (serverErr || 'Failed to delete variant');
        setError(msg);
        toastError(msg);
      } finally {
        setActionLoading(false);
      }
    }

    setEditingItem((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  };

  const handleMoveImage = (variantIndex, imageIndex, direction) => {
    setEditingItem((prev) => {
      const updatedVariants = [...prev.variants];
      const variant = { ...updatedVariants[variantIndex] };
      const images = [...(variant.images || [])];

      const targetIndex = imageIndex + direction;
      if (targetIndex < 0 || targetIndex >= images.length) return prev;

      // Swap position
      const temp = images[imageIndex];
      images[imageIndex] = images[targetIndex];
      images[targetIndex] = temp;

      // Reassign sequence positions
      images.forEach((img, idx) => {
        img.position = idx + 1;
      });

      variant.images = images;
      updatedVariants[variantIndex] = variant;
      return { ...prev, variants: updatedVariants };
    });
  };

  const handleAddNewVariant = () => {
    const defaultSizes = PRESET_SIZES.map((s) => ({
      size_id: s.size_id,
      size_name: s.size_name,
      stock_quantity: 10,
      price: editingItem.price || 0,
    }));

    const newVar = {
      id: `temp-${Date.now()}`,
      is_new: true,
      name: '',
      color_id: 1,
      color_name: 'Black',
      is_active: true,
      sizes: defaultSizes,
      images: [],
      videos: [],
    };

    setEditingItem((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), newVar],
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setActionLoading(true);
      setError('');

      if (editingItem.type === 'product') {
        const {
          id,
          name,
          description,
          price,
          sku_prefix,
          category,
          gender,
          is_active,
          is_new_release,
          variants,
        } = editingItem;

        // 1. Update product and variants in DB
        await api.put(`/products/${id}`, {
          name,
          description,
          base_price: parseFloat(price),
          sku_prefix,
          category,
          gender,
          is_active,
          is_new_release,
          variants,
        });

        // 2. Sync reordered image positions & primary images per variant
        for (const variant of variants) {
          if (!variant.is_new && variant.images?.length > 0) {
            const primaryId = selectedPrimary[variant.id];
            const validImageOrders = variant.images
              .filter((img) => img && typeof img === 'object' && img.id && !isNaN(Number(img.id)))
              .map((img, idx) => ({
                id: img.id,
                position: idx + 1,
                is_primary: primaryId ? img.id === primaryId : Boolean(img.is_primary),
              }));

            if (validImageOrders.length > 0) {
              await api.put(`/variants/${variant.id}/reorder-images`, { imageOrders: validImageOrders });
            }
          }
        }

        // 3. Handle new media uploads
        const mediaUploads = variants.filter(
          (v) => !v.is_new && (v.newImages?.length > 0 || v.newVideos?.length > 0)
        );

        for (const variant of mediaUploads) {
          const formData = new FormData();
          if (variant.newImages) {
            variant.newImages.forEach((file) => formData.append('images', file));
          }
          if (variant.newVideos) {
            variant.newVideos.forEach((file) => formData.append('videos', file));
          }

          await axios.post(
            `${API_BASE_URL}/api/inventory/variants/${variant.id}/media`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );
        }
      } else {
        const { id, price } = editingItem;
        await api.put(`/bundles/${id}`, {
          bundle_price: parseFloat(price),
        });
      }

      const successMsg = `${editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)} updated successfully`;
      setSuccess(successMsg);
      toastSuccess(successMsg);
      setEditingItem(null);
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Update error:', err);
      const serverError = err.response?.data?.error;
      const serverDetails = err.response?.data?.details;
      
      let userFriendlyMsg = 'Update failed. Please try again.';
      if (serverError && serverDetails) {
        userFriendlyMsg = `${serverError}: ${serverDetails}`;
      } else if (serverError) {
        userFriendlyMsg = serverError;
      } else if (err.message) {
        userFriendlyMsg = err.message;
      }

      setError(userFriendlyMsg);
      toastError(userFriendlyMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpand = (id, type) => {
    setExpandedItems((prev) => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`],
    }));
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.design_code && p.design_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBundles = bundles.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !products.length && !bundles.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin w-8 h-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Loading inventory...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by product or bundle name..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Inventory
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start rounded-r-lg shadow-sm">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-start rounded-r-lg shadow-sm">
          <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Conflict Resolution */}
      {conflictInfo && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-r-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">Conflict Resolution Required</p>
              <p className="text-sm">{error}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    navigate(`/bundles/${conflictInfo.id}`);
                    setConflictInfo(null);
                    setError('');
                  }}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 font-medium rounded-md hover:bg-blue-200 text-xs"
                >
                  View Bundle
                </button>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await api.delete(`/bundles/${conflictInfo.id}`);
                      setBundles((prev) => prev.filter((b) => b.id !== conflictInfo.id));
                      setConflictInfo(null);
                      setError('');
                      setSuccess('Bundle archived. You can now delete the product.');
                      setTimeout(() => setSuccess(''), 5000);
                    } catch (err) {
                      setError(
                        'Failed to archive bundle: ' + (err.response?.data?.error || err.message)
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-yellow-100 text-yellow-800 font-medium rounded-md hover:bg-yellow-200 text-xs"
                >
                  Archive Bundle First
                </button>
              </div>
            </div>
            <button onClick={() => setConflictInfo(null)} className="text-blue-700 hover:text-blue-900">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <h3 className="px-6 py-4 font-bold text-gray-900 flex items-center text-lg border-b border-gray-100">
          <Package className="mr-2 h-5 w-5 text-blue-600" />
          Products ({filteredProducts.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Design Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  New Release
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Fragment key={`product-${product.id}`}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <button
                          onClick={() => toggleExpand(product.id, 'product')}
                          className="flex items-center text-left hover:text-blue-600"
                        >
                          {expandedItems[`product-${product.id}`] ? (
                            <ChevronUp className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                          )}
                          <span>{product.name}</span>
                          {product.is_new_release && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              New
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {product.design_code || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₦{Number(product.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className={`px-2 py-0.5 rounded font-semibold text-xs ${product.stock > 10 ? 'bg-green-50 text-green-700' : product.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {product.stock || 0} pcs
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          checked={!!product.is_new_release}
                          onChange={(e) => handleToggleNewRelease(product.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product, 'product')}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit Product & Variants"
                            disabled={loading}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                type: 'product',
                                id: product.id,
                                name: product.name,
                              })
                            }
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Product"
                            disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedItems[`product-${product.id}`] && (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 bg-slate-50 border-t border-b border-gray-200">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                              <Layers size={14} className="text-gray-500" /> Color Variants & Sizes
                            </h4>
                            {product.variants?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {product.variants.map((variant) => (
                                  <div
                                    key={`variant-${variant.id}`}
                                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <p className="font-bold text-gray-900 text-sm">
                                          {variant.name ? `${variant.name} (${variant.color_name})` : variant.color_name}
                                        </p>
                                        <p className="text-xs font-mono text-gray-500">SKU: {variant.sku}</p>
                                      </div>
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                                        {variant.images?.length || 0} images
                                      </span>
                                    </div>

                                    {/* Thumbnail Preview */}
                                    {variant.images?.length > 0 && (
                                      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                                        {variant.images.map((img) => (
                                          <img
                                            key={img.id}
                                            src={img.image_url}
                                            alt=""
                                            className={`w-12 h-12 object-cover rounded border ${img.is_primary ? 'border-blue-500 ring-2 ring-blue-400' : 'border-gray-200'}`}
                                          />
                                        ))}
                                      </div>
                                    )}

                                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                      {variant.sizes?.map((size) => (
                                        <div
                                          key={`size-${variant.id}-${size.size_id}`}
                                          className="bg-gray-50 border border-gray-200 p-1.5 rounded-md"
                                        >
                                          <p className="font-semibold text-gray-700">{size.size_name}</p>
                                          <p className="text-gray-500 text-[11px]">Stock: {size.stock_quantity}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-xs italic">No variants found</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                    No products found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bundle Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <h3 className="px-6 py-4 font-bold text-gray-900 flex items-center text-lg border-b border-gray-100">
          <Tag className="mr-2 h-5 w-5 text-purple-600" />
          Bundles ({filteredBundles.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Bundle Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Items Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBundles.length > 0 ? (
                filteredBundles.map((bundle) => (
                  <Fragment key={`bundle-${bundle.id}`}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <button
                          onClick={() => toggleExpand(bundle.id, 'bundle')}
                          className="flex items-center text-left hover:text-purple-600"
                        >
                          {expandedItems[`bundle-${bundle.id}`] ? (
                            <ChevronUp className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                          )}
                          {bundle.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {bundle.bundle_type || 'Set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₦{Number(bundle.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {bundle.item_count} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bundle.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {bundle.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(bundle, 'bundle')}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            disabled={loading}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                type: 'bundle',
                                id: bundle.id,
                                name: bundle.name,
                              })
                            }
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedItems[`bundle-${bundle.id}`] && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-purple-50/40 border-t border-b border-purple-100">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 text-sm">Included Items</h4>
                            {bundle.items?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {bundle.items.map((item, idx) => (
                                  <div
                                    key={`bundle-item-${bundle.id}-${idx}`}
                                    className="bg-white border border-purple-100 rounded-lg p-3 shadow-xs"
                                  >
                                    <p className="font-semibold text-gray-900 text-xs">{item.product_name}</p>
                                    <p className="text-xs text-gray-500">Color: {item.color_name}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-xs">No items details found</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    No bundles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULLY EDITABLE RESPONSIVE MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Edit size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">
                    Edit {editingItem.type === 'product' ? 'Product & Variants' : 'Bundle'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID #{editingItem.id} — {editingItem.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form onSubmit={handleUpdate} id="edit-inventory-form" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">

              {editingItem.type === 'product' ? (
                <>
                  {/* SECTION 1: Product Core Info */}
                  <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 space-y-4">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-200 pb-2">
                      <Tag size={16} className="text-blue-600" /> Basic Product Details
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name</label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          required
                        />
                      </div>

                      {/* Base Price */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Base Price (₦)</label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                          value={editingItem.price}
                          onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                          required
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                        <select
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                          value={editingItem.category}
                          onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                        >
                          {PRESET_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                        <select
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                          value={editingItem.gender}
                          onChange={(e) => setEditingItem({ ...editingItem, gender: e.target.value })}
                        >
                          {PRESET_GENDERS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SKU Prefix */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Design Code / SKU Prefix</label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                          value={editingItem.sku_prefix || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, sku_prefix: e.target.value })}
                          placeholder="e.g. TSH-01"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Product Description</label>
                      <textarea
                        rows={3}
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        value={editingItem.description}
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        placeholder="Detailed product descriptions, fabric composition, fit recommendations..."
                      />
                    </div>

                    {/* Status Toggles */}
                    <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          checked={!!editingItem.is_active}
                          onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                        />
                        <span>Product Active on Shop</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          checked={!!editingItem.is_new_release}
                          onChange={(e) => setEditingItem({ ...editingItem, is_new_release: e.target.checked })}
                        />
                        <span>Mark as New Release Badge</span>
                      </label>
                    </div>
                  </div>

                  {/* SECTION 2: Color Variants, Media & Sizes */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <Layers size={16} className="text-purple-600" /> Color Variants ({editingItem.variants?.length || 0})
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddNewVariant}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 font-bold rounded-lg hover:bg-purple-200 transition-colors text-xs"
                      >
                        <Plus size={14} /> Add Color Variant
                      </button>
                    </div>

                    {editingItem.variants?.map((variant, vIdx) => (
                      <div
                        key={variant.id || `var-${vIdx}`}
                        className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm space-y-4"
                      >
                        {/* Variant Header Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            {/* Color Selector */}
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 mb-0.5">Color</label>
                              <select
                                className="p-1.5 bg-white border border-gray-300 rounded font-semibold text-xs"
                                value={variant.color_id}
                                onChange={(e) => {
                                  const cId = parseInt(e.target.value);
                                  const foundColor = PRESET_COLORS.find((c) => c.id === cId);
                                  const updatedVariants = [...editingItem.variants];
                                  updatedVariants[vIdx] = {
                                    ...variant,
                                    color_id: cId,
                                    color_name: foundColor ? foundColor.color_name : variant.color_name,
                                  };
                                  setEditingItem({ ...editingItem, variants: updatedVariants });
                                }}
                              >
                                {PRESET_COLORS.map((col) => (
                                  <option key={col.id} value={col.id}>
                                    {col.color_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Name Override */}
                            <div className="flex-1 min-w-[140px]">
                              <label className="block text-[11px] font-bold text-gray-600 mb-0.5">Display Title (Optional)</label>
                              <input
                                type="text"
                                placeholder={`e.g. ${editingItem.name}`}
                                className="w-full p-1.5 bg-white border border-gray-300 rounded text-xs"
                                value={variant.name || ''}
                                onChange={(e) => {
                                  const updatedVariants = [...editingItem.variants];
                                  updatedVariants[vIdx] = { ...variant, name: e.target.value };
                                  setEditingItem({ ...editingItem, variants: updatedVariants });
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                              <input
                                type="checkbox"
                                checked={variant.is_active !== false}
                                onChange={(e) => {
                                  const updatedVariants = [...editingItem.variants];
                                  updatedVariants[vIdx] = { ...variant, is_active: e.target.checked };
                                  setEditingItem({ ...editingItem, variants: updatedVariants });
                                }}
                              />
                              Active
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(variant.id, vIdx)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Variant"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Sizes & Pricing Table */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">Size Stock & Custom Price</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                            {variant.sizes?.map((size, sIdx) => (
                              <div
                                key={size.size_id || sIdx}
                                className="bg-slate-50 border border-slate-200 p-2 rounded-lg space-y-1 text-center"
                              >
                                <span className="font-bold text-xs text-slate-800 block">
                                  {size.size_name}
                                </span>
                                <div>
                                  <label className="text-[10px] text-gray-500 block">Stock</label>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full p-1 bg-white border border-gray-300 rounded text-xs text-center font-bold"
                                    value={size.stock_quantity}
                                    onChange={(e) => {
                                      const updatedVariants = [...editingItem.variants];
                                      const updatedSizes = [...variant.sizes];
                                      updatedSizes[sIdx] = { ...size, stock_quantity: e.target.value };
                                      updatedVariants[vIdx] = { ...variant, sizes: updatedSizes };
                                      setEditingItem({ ...editingItem, variants: updatedVariants });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 block">Price (₦)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder={editingItem.price}
                                    className="w-full p-1 bg-white border border-gray-300 rounded text-xs text-center"
                                    value={size.price || ''}
                                    onChange={(e) => {
                                      const updatedVariants = [...editingItem.variants];
                                      const updatedSizes = [...variant.sizes];
                                      updatedSizes[sIdx] = { ...size, price: e.target.value };
                                      updatedVariants[vIdx] = { ...variant, sizes: updatedSizes };
                                      setEditingItem({ ...editingItem, variants: updatedVariants });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Image Gallery with Reordering */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                              <ImageIcon size={14} className="text-blue-600" /> Image Order & Primary Display ({variant.images?.length || 0})
                            </label>
                            <span className="text-[11px] text-gray-500">Use ◀ ▶ buttons to reorder images</span>
                          </div>

                          {variant.images?.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                              {variant.images.map((img, imgIdx) => {
                                const isSelectedPrimary =
                                  (selectedPrimary[variant.id] || img.is_primary) === img.id;
                                return (
                                  <div
                                    key={img.id}
                                    className={`relative bg-gray-100 border-2 rounded-xl overflow-hidden group transition-all ${isSelectedPrimary ? 'border-blue-600 ring-2 ring-blue-400' : 'border-gray-200'}`}
                                  >
                                    {/* Position Badge */}
                                    <div className="absolute top-1.5 left-1.5 z-10 bg-black/75 text-white font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                                      #{imgIdx + 1}
                                    </div>

                                    {/* Image Preview */}
                                    <img
                                      src={img.image_url}
                                      alt=""
                                      className="w-full h-28 object-cover block"
                                    />

                                    {/* Reorder & Action Bar */}
                                    <div className="p-1 bg-slate-900 text-white flex justify-between items-center">
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          disabled={imgIdx === 0}
                                          onClick={() => handleMoveImage(vIdx, imgIdx, -1)}
                                          className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                                          title="Move Left"
                                        >
                                          <ArrowLeft size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={imgIdx === variant.images.length - 1}
                                          onClick={() => handleMoveImage(vIdx, imgIdx, 1)}
                                          className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                                          title="Move Right"
                                        >
                                          <ArrowRight size={12} />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedPrimary((prev) => ({
                                            ...prev,
                                            [variant.id]: img.id,
                                          }))
                                        }
                                        className={`p-1 rounded flex items-center gap-0.5 text-[10px] font-bold ${isSelectedPrimary ? 'bg-amber-500 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                                        title="Set as Primary Cover Image"
                                      >
                                        <Star size={12} fill={isSelectedPrimary ? 'currentColor' : 'none'} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMedia('image', img.id, variant.id)}
                                        className="p-1 hover:bg-red-600 rounded text-red-300 hover:text-white"
                                        title="Delete Image"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed text-center">
                              No images uploaded for this variant yet.
                            </p>
                          )}
                        </div>

                        {/* Videos */}
                        {variant.videos?.length > 0 && (
                          <div>
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-2">
                              <VideoIcon size={14} className="text-purple-600" /> Videos ({variant.videos.length})
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {variant.videos.map((vid) => (
                                <div
                                  key={vid.id}
                                  className="relative bg-black rounded-xl overflow-hidden border border-gray-200 group"
                                >
                                  <video src={vid.video_url} className="w-full h-24 object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMedia('video', vid.id, variant.id)}
                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Upload New Files */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Upload New Images (Max 5)
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                              onChange={(e) => {
                                const files = Array.from(e.target.files);
                                const updatedVariants = [...editingItem.variants];
                                updatedVariants[vIdx] = { ...variant, newImages: files };
                                setEditingItem({ ...editingItem, variants: updatedVariants });
                              }}
                            />
                            {variant.newImages?.length > 0 && (
                              <p className="text-[11px] text-green-600 font-semibold mt-1">
                                ✓ {variant.newImages.length} images queued
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Upload Video (Max 100MB)
                            </label>
                            <input
                              type="file"
                              accept="video/mp4,video/quicktime,video/avi"
                              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                              onChange={(e) => {
                                const files = Array.from(e.target.files);
                                const updatedVariants = [...editingItem.variants];
                                updatedVariants[vIdx] = { ...variant, newVideos: files };
                                setEditingItem({ ...editingItem, variants: updatedVariants });
                              }}
                            />
                            {variant.newVideos?.length > 0 && (
                              <p className="text-[11px] text-green-600 font-semibold mt-1">
                                ✓ Video queued
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* BUNDLE EDITING FORM */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Bundle Price (₦)</label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-inventory-form"
                disabled={actionLoading}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors text-sm shadow-md disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="animate-spin h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Save All Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Delete {confirmDelete.type}?
            </h4>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <strong className="font-semibold text-gray-900">{confirmDelete.name}</strong>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors text-sm disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw className="animate-spin h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;

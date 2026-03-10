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
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/inventory`,
  timeout: 10000,
});

const InventoryManager = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [conflictInfo, setConflictInfo] = useState(null);
  const [selectedPrimary, setSelectedPrimary] = useState({});

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
      console.error('Fetch error:', {
        message: err.message,
        response: err.response?.data,
        stack: err.stack,
      });
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
      setLoading(true);
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
        setSuccess(
          `${confirmDelete.type.charAt(0).toUpperCase() + confirmDelete.type.slice(1)} deleted successfully`
        );
        setConfirmDelete(null);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Deletion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
    if (type === 'product') {
      const initial = {};
      (item.variants || []).forEach(v => {
        const currentPrimary = (v.images || []).find(img => img.is_primary);
        if (currentPrimary) initial[v.id] = currentPrimary.id;
      });
      setSelectedPrimary(initial);
    }
  };

  const handleToggleNewRelease = async (productId, value) => {
    try {
      await api.put(`/products/${productId}`, { is_new_release: value });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_new_release: value } : p));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update new release flag');
    }
  };

  const handleDeleteMedia = async (type, id, variantId) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      setLoading(true);
      await api.delete(`/variants/media/${type}/${id}`);

      setEditingItem(prev => {
        if (!prev || prev.type !== 'product') return prev;
        return {
          ...prev,
          variants: prev.variants.map(v => {
            if (v.id === variantId) {
              const key = type === 'image' ? 'images' : 'videos';
              return { ...v, [key]: (v[key] || []).filter(media => media.id !== id) };
            }
            return v;
          })
        };
      });
      fetchData(); // Sync the main list as well
      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setLoading(true);
      setError('');

      if (editingItem.type === 'product') {
        const { id, name, price, variants, sku_prefix } = editingItem;

        // 1. Update basic details
        await api.put(`/products/${id}`, {
          name,
          base_price: price,
          sku_prefix,
          variants: variants,
        });

        // 2. Handle primary image updates
        const updates = Object.entries(selectedPrimary || {});
        for (const [variantId, imageId] of updates) {
          await api.put(`/variants/${variantId}/primary-image`, { image_id: imageId });
        }

        // 3. Handle new media uploads
        const mediaUploads = variants.filter(v => (v.newImages?.length > 0 || v.newVideos?.length > 0));
        for (const variant of mediaUploads) {
          const formData = new FormData();
          if (variant.newImages) {
            variant.newImages.forEach(file => formData.append('images', file));
          }
          if (variant.newVideos) {
            variant.newVideos.forEach(file => formData.append('videos', file));
          }

          // We need a specific endpoint for media upload per variant
          // Assuming endpoint: POST /variants/:id/media
          // Note: axios instance 'api' is configured for JSON, so we need to override headers for FormData
          await axios.post(`${API_BASE_URL}/api/inventory/variants/${variant.id}/media`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }

      } else {
        const { id, price } = editingItem;
        await api.put(`/bundles/${id}`, {
          bundle_price: price,
        });
      }

      setSuccess(
        `${editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)} updated successfully`
      );
      setEditingItem(null);
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
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
      (p.sku_prefix && p.sku_prefix.toLowerCase().includes(searchTerm.toLowerCase()))
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
    <div className="p-6 space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by product or bundle name"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Success</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Conflict Resolution */}
      {conflictInfo && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">Resolution Required</p>
              <p>{error}</p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => {
                    navigate(`/bundles/${conflictInfo.id}`);
                    setConflictInfo(null);
                    setError('');
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
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
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <h3 className="px-6 py-4 font-semibold text-gray-900 flex items-center text-lg">
          <Package className="mr-2 h-5 w-5" />
          Products ({filteredProducts.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Fragment key={`product-${product.id}`}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          onClick={() => toggleExpand(product.id, 'product')}
                          className="flex items-center"
                        >
                          {expandedItems[`product-${product.id}`] ? (
                            <ChevronUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          )}
                          {product.name}
                          {product.is_new_release && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              New
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.design_code || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₦{Number(product.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="checkbox"
                          checked={!!product.is_new_release}
                          onChange={(e) => handleToggleNewRelease(product.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                        <button
                          onClick={() => handleEdit(product, 'product')}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
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
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {expandedItems[`product-${product.id}`] && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Variants</h4>
                            {product.variants?.length > 0 ? (
                              <div className="space-y-4">
                                {product.variants.map((variant) => (
                                  <div
                                    key={`variant-${variant.id}`}
                                    className="border border-gray-200 rounded-lg p-4"
                                  >
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900">{variant.name ? `${variant.name} (${variant.color_name})` : variant.color_name}</p>
                                        <p className="text-sm text-gray-500">{variant.sku}</p>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Sizes</h5>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {variant.sizes?.map((size) => (
                                          <div
                                            key={`size-${variant.id}-${size.size_id}`}
                                            className="border border-gray-200 p-2 rounded-lg"
                                          >
                                            <p className="font-medium text-gray-900">{size.size_name}</p>
                                            <p className="text-sm text-gray-600">Stock: {size.stock_quantity}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No variants found</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bundle Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <h3 className="px-6 py-4 font-semibold text-gray-900 flex items-center text-lg">
          <Package className="mr-2 h-5 w-5" />
          Bundles ({filteredBundles.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBundles.length > 0 ? (
                filteredBundles.map((bundle) => (
                  <Fragment key={`bundle-${bundle.id}`}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          onClick={() => toggleExpand(bundle.id, 'bundle')}
                          className="flex items-center"
                        >
                          {expandedItems[`bundle-${bundle.id}`] ? (
                            <ChevronUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          )}
                          {bundle.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bundle.bundle_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₦{Number(bundle.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bundle.item_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${bundle.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {bundle.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                        <button
                          onClick={() => handleEdit(bundle, 'bundle')}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
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
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {expandedItems[`bundle-${bundle.id}`] && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Bundle Items</h4>
                            {bundle.items?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bundle.items.map((item) => (
                                  <div
                                    key={`bundle-item-${bundle.id}-${item.product_id}-${item.color_id}-${item.size_id}`}
                                    className="border border-gray-200 rounded-lg p-4"
                                  >
                                    <p className="font-medium text-gray-900">{item.product_name}</p>
                                    <p className="text-sm text-gray-500">
                                      {item.color_name} - {item.size_name} (Qty: {item.quantity})
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No items found in this bundle</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No bundles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full mx-4 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-900">Edit {editingItem.type}</h4>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              {editingItem.type === 'product' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingItem.type === 'product' ? 'Base Price' : 'Bundle Price'} (NGN)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editingItem.price}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      price: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {editingItem.type === 'product' && editingItem.variants?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variant Stock</label>
                  <div className="space-y-3">
                    {editingItem.variants.map((variant) => (
                      <div
                        key={`edit-variant-${variant.id}`}
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex flex-col gap-2 mb-2">
                          <p className="font-medium text-gray-900 text-sm md:text-base">{variant.name ? `${variant.name} (${variant.color_name})` : variant.color_name}</p>
                          <input
                            type="text"
                            placeholder="Variant Name (Optional)"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={variant.name || ''}
                            onChange={(e) => {
                              const updatedVariants = editingItem.variants.map((v) => {
                                if (v.id === variant.id) {
                                  return { ...v, name: e.target.value };
                                }
                                return v;
                              });
                              setEditingItem({
                                ...editingItem,
                                variants: updatedVariants,
                              });
                            }}
                          />
                        </div>
                        <div className="mt-2 space-y-2">
                          {variant.sizes?.map((size) => (
                            <div
                              key={`edit-size-${variant.id}-${size.size_id}`}
                              className="flex flex-col gap-2 p-2 border border-gray-100 rounded-lg"
                            >
                              <span className="font-medium text-sm text-gray-700">{size.size_name}</span>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 block">Stock</label>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                    value={size.stock_quantity}
                                    onChange={(e) => {
                                      const updatedVariants = editingItem.variants.map((v) => {
                                        if (v.id === variant.id) {
                                          const updatedSizes = v.sizes.map((s) => {
                                            if (s.size_id === size.size_id) {
                                              return { ...s, stock_quantity: e.target.value };
                                            }
                                            return s;
                                          });
                                          return { ...v, sizes: updatedSizes };
                                        }
                                        return v;
                                      });
                                      setEditingItem({
                                        ...editingItem,
                                        variants: updatedVariants,
                                      });
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 block">Price (Optional)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Use Base Price"
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                    value={size.price || ''}
                                    onChange={(e) => {
                                      const updatedVariants = editingItem.variants.map((v) => {
                                        if (v.id === variant.id) {
                                          const updatedSizes = v.sizes.map((s) => {
                                            if (s.size_id === size.size_id) {
                                              return { ...s, price: e.target.value };
                                            }
                                            return s;
                                          });
                                          return { ...v, sizes: updatedSizes };
                                        }
                                        return v;
                                      });
                                      setEditingItem({
                                        ...editingItem,
                                        variants: updatedVariants,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* Existing Media Display */}
                          {(variant.images?.length > 0 || variant.videos?.length > 0) && (
                            <div className="mt-3">
                              {/* Primary Image Selection & Management */}
                              {variant.images?.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Primary Image Selection</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {variant.images.map((img) => (
                                      <div key={`img-${variant.id}-${img.id}`} className="relative group max-w-full">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedPrimary(prev => ({ ...prev, [variant.id]: img.id }))
                                          }
                                          className={`border rounded overflow-hidden relative block w-full ${(selectedPrimary[variant.id] || img.is_primary) === img.id
                                            ? 'border-blue-500 border-2'
                                            : 'border-gray-200'
                                            }`}
                                        >
                                          <img src={img.image_url} alt="Variant" className="w-full h-20 object-cover block" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleDeleteMedia('image', img.id, variant.id); }}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 shadow-md transform hover:scale-110"
                                          disabled={loading}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Videos Management */}
                              {variant.videos?.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Videos</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {variant.videos.map((vid) => (
                                      <div key={`vid-${variant.id}-${vid.id}`} className="relative group border border-gray-200 rounded overflow-hidden max-w-full bg-gray-100">
                                        <video src={vid.video_url} className="w-full h-20 object-cover block" controls={false} />
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleDeleteMedia('video', vid.id, variant.id); }}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 shadow-md transform hover:scale-110"
                                          disabled={loading}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* New Media Upload */}
                          <div className="mt-3 border-t pt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Add New Media</p>

                            {/* Image Upload */}
                            <div className="mb-2">
                              <label className="block text-xs text-gray-600 mb-1">Add Images (Max 5)</label>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files);
                                  const updatedVariants = editingItem.variants.map(v => {
                                    if (v.id === variant.id) {
                                      return { ...v, newImages: files };
                                    }
                                    return v;
                                  });
                                  setEditingItem({ ...editingItem, variants: updatedVariants });
                                }}
                              />
                              {variant.newImages?.length > 0 && (
                                <p className="text-xs text-green-600 mt-1">{variant.newImages.length} images selected</p>
                              )}
                            </div>

                            {/* Video Upload */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Add Video (Max 100MB)</label>
                              <input
                                type="file"
                                accept="video/mp4,video/quicktime,video/x-msvideo,video/avi"
                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files);
                                  const updatedVariants = editingItem.variants.map(v => {
                                    if (v.id === variant.id) {
                                      return { ...v, newVideos: files };
                                    }
                                    return v;
                                  });
                                  setEditingItem({ ...editingItem, variants: updatedVariants });
                                }}
                              />
                              {variant.newVideos?.length > 0 && (
                                <p className="text-xs text-green-600 mt-1">{variant.newVideos.length} video selected</p>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="animate-spin h-4 w-4" />
                  ) : (
                    <Edit className="h-4 w-4" />
                  )}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl border border-gray-100">
            <h4 className="text-lg font-bold text-gray-900 mb-2">Delete {confirmDelete.type}?</h4>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete{' '}
              <strong className="font-semibold">{confirmDelete.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;

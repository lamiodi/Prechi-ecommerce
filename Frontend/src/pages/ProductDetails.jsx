import { useEffect, useState, useContext } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import Navbar2 from "../components/Navbar2";
import axios from "axios";
import {
  CaretLeft,
  CaretRight,
  Minus,
  Plus,
  ShareNetwork,
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  ArrowCounterClockwise,
  Package,
  CircleNotch,
  WarningCircle,
  Sparkle,
  Tag,
  ArrowRight
} from "@phosphor-icons/react";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useCartDrawer } from "../context/CartDrawerContext";
import { CurrencyContext } from "../pages/CurrencyContext";
import DescriptionSection from "../components/DescriptionSection";
import { toastSuccess, toastError } from "../utils/toastConfig";
import ProductSchema from "../components/ProductSchema";
import SEO from "../components/SEO";
import { Button } from "../components/ui/button";
import ProductDetailsSkeleton from "../components/skeletons/ProductDetailsSkeleton";
import { toTitleCase } from "../lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '')
  : 'https://prechi-ecommerce.onrender.com';

const ProductDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { openCart, fetchCart } = useCartDrawer();
  const currencyContext = useContext(CurrencyContext);
  const { currency = "NGN", exchangeRate = 1, country = "Nigeria", contextLoading = false } = currencyContext || {};
  const variantParam = searchParams.get("variant");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [bundleType, setBundleType] = useState("3-in-1");
  const [selectedPieceId, setSelectedPieceId] = useState("full");
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  const getPricingSplitConfig = (dataObj) => {
    if (!dataObj || dataObj.type !== "product") return null;
    const p = dataObj.data;
    const idNum = Number(p?.id);
    const sku = (p?.sku_prefix || '').toUpperCase();
    const nameStr = (p?.name || '').toLowerCase();

    // 1. Prechi Signature Leather Bag (productone) - No split, no add-ons
    if (idNum === 44 || sku === 'PSB' || nameStr.includes('signature leather bag')) {
      return null;
    }

    // 2. Prechi Short Skirt Set (producttwo) - Base ₦80,000 + Optional White Inner Tank Top (+₦10,000)
    if (idNum === 45 || sku === 'SSS' || nameStr.includes('skirt set') || nameStr.includes('short skirt')) {
      return {
        pieces: [
          { id: 'full', label: 'Full Two-Piece Skirt Set', price: 80000 }
        ],
        addons: [
          { id: 'inner', label: 'Matching White Inner Tank Top', price: 10000 }
        ]
      };
    }

    // 3. Prechi Bright Tracksuit Set (productthree) - Base ₦80,000 | Pant (₦60,000) | Top (₦20,000) | No add-ons
    if (idNum === 46 || sku === 'BTS' || (nameStr.includes('bright tracksuit') && !nameStr.includes('men'))) {
      return {
        pieces: [
          { id: 'full', label: 'Full Tracksuit Set (Top + Pant)', price: 80000 },
          { id: 'pant', label: 'Track Pant Only', price: 60000 },
          { id: 'top', label: 'Track Top Only', price: 20000 }
        ]
      };
    }

    // 4. Prechi Men Bright Set (productfour) - Base ₦85,000 | Pant (₦60,000) | Top (₦25,000) | Optional Bag (+₦70,000)
    if (idNum === 47 || sku === 'MBS' || nameStr.includes('men bright set')) {
      return {
        pieces: [
          { id: 'full', label: 'Full Set (Top + Pant)', price: 85000 },
          { id: 'pant', label: 'Track Pant Only', price: 60000 },
          { id: 'top', label: 'Top Only', price: 25000 }
        ],
        addons: [
          { id: 'bag', label: 'Prechi Signature Leather Bag', price: 70000 }
        ]
      };
    }

    // 5. Prechi Black Set Men (productfive) - Base ₦100,000 | Pant (₦50,000) | Top (₦50,000) | No add-ons
    if (idNum === 48 || sku === 'BSM' || nameStr.includes('black set men')) {
      return {
        pieces: [
          { id: 'full', label: 'Full Set (Top + Pant)', price: 100000 },
          { id: 'pant', label: 'Pant Only', price: 50000 },
          { id: 'top', label: 'Top Only', price: 50000 }
        ]
      };
    }

    // 6. Prechi Niga Striped Tracksuit Set (productsix) - Base ₦110,000 | Pant (₦50,000) | Round Neck (₦60,000) | No add-ons
    if (idNum === 49 || sku === 'NST' || nameStr.includes('niga striped') || nameStr.includes('striped tracksuit')) {
      return {
        pieces: [
          { id: 'full', label: 'Full Tracksuit Set (Round Neck + Pant)', price: 110000 },
          { id: 'top', label: 'Round Neck Top Only', price: 60000 },
          { id: 'pant', label: 'Track Pant Only', price: 50000 }
        ]
      };
    }

    // 7. Prechi Navy Blue & White T Set (productseven) - Base ₦120,000 + Optional Matching Bag (+₦70,000)
    if (idNum === 50 || sku === 'NWT' || nameStr.includes('navy blue & white t set') || nameStr.includes('white t set') || nameStr.includes('navy blue t set')) {
      return {
        pieces: [
          { id: 'full', label: 'Full T-Shirt Set', price: 120000 }
        ],
        addons: [
          { id: 'bag', label: 'Matching Signature Leather Bag', price: 70000 }
        ]
      };
    }

    return null;
  };
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const colorMap = {
    Black: "#000000",
    White: "#FFFFFF",
    Gray: "#808080",
    Blue: "#0066CC",
    "Navy Blue": "#000080",
    Navy: "#000080",
    Brown: "#8B4513",
    Cream: "#F5F5DC",
    Pink: "#FFC0CB",
    Red: "#FF0000",
    Green: "#008000",
    Yellow: "#FFFF00",
    Purple: "#800080",
    Orange: "#FFA500",
  };

  const decodeToken = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      return null;
    }
  };

  const getToken = () => {
    if (user && user.token) return user.token;
    return localStorage.getItem("token");
  };

  const getUserId = () => {
    const token = getToken();
    if (!token) return null;
    const tokenData = decodeToken(token);
    return tokenData?.id;
  };

  const isAuthenticated = () => !!getToken();

  const loadGuestCart = () => {
    try {
      const guestCart = localStorage.getItem("guestCart");
      if (guestCart) {
        const parsed = JSON.parse(guestCart);
        return {
          items: Array.isArray(parsed?.items) ? parsed.items : [],
          subtotal: parsed?.subtotal || 0,
          tax: parsed?.tax || 0,
          total: parsed?.total || 0,
          warning: parsed?.warning || null
        };
      }
    } catch (err) {
      console.error("Error loading guest cart:", err);
    }
    return { items: [], subtotal: 0, tax: 0, total: 0 };
  };

  const saveGuestCart = (cart) => {
    try {
      localStorage.setItem("guestCart", JSON.stringify(cart));
    } catch (err) {
      console.error("Error saving guest cart:", err);
    }
  };

  const addToGuestCart = (item) => {
    const guestCart = loadGuestCart();
    const existingItemIndex = guestCart.items.findIndex((cartItem) => {
      if (item.product_type === "single") {
        return cartItem.variant_id === item.variant_id && cartItem.size_id === item.size_id;
      } else {
        if (cartItem.bundle_id !== item.bundle_id) return false;
        if (!cartItem.items || !item.items) return cartItem.bundle_id === item.bundle_id;
        if (cartItem.items.length !== item.items.length) return false;
        return cartItem.items.every((cartItemDetail, index) => {
          const newItemDetail = item.items[index];
          return (
            cartItemDetail.variant_id === newItemDetail.variant_id &&
            cartItemDetail.size_id === newItemDetail.size_id
          );
        });
      }
    });
    if (existingItemIndex >= 0) {
      guestCart.items[existingItemIndex].quantity += item.quantity;
    } else {
      guestCart.items.push({
        id: Date.now(),
        ...item,
      });
    }
    guestCart.subtotal = guestCart.items.reduce((sum, cartItem) => sum + cartItem.quantity * cartItem.price, 0);
    guestCart.tax = country === "Nigeria" ? 0 : guestCart.subtotal * 0.05;
    guestCart.total = guestCart.subtotal + guestCart.tax;
    guestCart.warning = null;
    saveGuestCart(guestCart);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  useEffect(() => {
    setIsGuest(!isAuthenticated());
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID is missing");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/products/${id}`);
        if (!res.data) {
          setError("Invalid product data received");
          return;
        }
        setProductData(res.data);
        if (res.data.type === "product") {
          const variants = Array.isArray(res.data?.data?.variants) ? res.data.data.variants : [];
          const variantIndex = variants.findIndex((v) => v.variant_id?.toString() === variantParam);
          const variant = variantIndex !== -1 ? variants[variantIndex] : variants[0];
          if (variant) {
            setSelectedVariant(variant);
            setSelectedColor(variant?.color_name || null);
            setSelectedSize(variant?.sizes?.[0]?.size_name || null);
          }
        } else {
          setBundleType(
            res.data?.data?.bundle_type && ["3-in-1", "5-in-1"].includes(res.data?.data?.bundle_type)
              ? res.data?.data?.bundle_type
              : "3-in-1"
          );
          setSelectedBundleVariants({});
          const sizes = res.data?.data?.items?.[0]?.all_variants?.[0]?.sizes || [];
          setSelectedSize(sizes[0]?.size_name || null);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to fetch product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, variantParam]);

  const handleVariantChange = (variant) => {
    if (!variant) return;
    setSelectedVariant(variant);
    setSelectedColor(variant.color_name);
    const availableSizes = Array.isArray(variant.sizes) ? variant.sizes : [];
    if (selectedSize && !availableSizes.some((s) => s.size_name === selectedSize)) {
      setSelectedSize(availableSizes[0]?.size_name || null);
    } else if (!selectedSize && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]?.size_name || null);
    }
    setSelectedImage(0);
  };

  const handleColorChange = (colorName) => {
    if (!productData || productData.type !== "product") return;
    const variants = Array.isArray(productData?.data?.variants) ? productData.data.variants : [];
    const variant = variants.find((v) => v.color_name === colorName);
    if (variant) {
      handleVariantChange(variant);
    }
  };

  const handleSizeChange = (sizeName) => {
    setSelectedSize(sizeName);
    if (productData && productData.type === "bundle") {
      const updatedVariants = {};
      Object.entries(selectedBundleVariants).forEach(([key, selection]) => {
        updatedVariants[key] = {
          ...selection,
          sizeName: sizeName,
        };
      });
      setSelectedBundleVariants(updatedVariants);
    }
  };

  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      if (productData.type === "product") {
        if (!selectedVariant || !selectedSize) {
          toastError("Please select color and size");
          return;
        }
        const sizes = Array.isArray(selectedVariant.sizes) ? selectedVariant.sizes : [];
        const selectedSizeObj = sizes.find((s) => s.size_name === selectedSize);
        if (!selectedSizeObj) {
          toastError("Invalid size selected");
          return;
        }
        let productImage = "https://via.placeholder.com/500";
        if (selectedVariant.images && selectedVariant.images.length > 0) {
          const img = selectedVariant.images[0];
          productImage = img?.image_url || img?.url || img || productImage;
        }
        const productName = getCustomizedProductName();
        const sizeSpecificPrice = getCalculatedUnitPrice();

        if (isAuthenticated()) {
          const userId = getUserId();
          if (!userId) throw new Error("Could not determine user ID");
          const token = getToken();
          const authAxios = axios.create({
            headers: { Authorization: `Bearer ${token}` },
          });
          await authAxios.post(`${API_BASE_URL}/api/cart`, {
            user_id: userId,
            product_type: "single",
            variant_id: selectedVariant.variant_id,
            size_id: selectedSizeObj.size_id,
            quantity,
            price: sizeSpecificPrice,
          });
          toastSuccess("Product added to cart");
          window.dispatchEvent(new Event("cartUpdated"));
          fetchCart();
          openCart();
        } else {
          addToGuestCart({
            product_type: "single",
            variant_id: selectedVariant.variant_id,
            size_id: selectedSizeObj.size_id,
            quantity,
            price: sizeSpecificPrice,
            item: {
              id: selectedVariant.variant_id,
              name: productName,
              image: productImage,
              color: selectedColor,
              size: selectedSize,
              price: sizeSpecificPrice,
              stock_quantity: selectedSizeObj.stock_quantity,
              is_product: true,
            },
          });
          toastSuccess("Product added to guest cart");
          window.dispatchEvent(new Event("cartUpdated"));
          fetchCart();
          openCart();
        }
      } else if (productData.type === "bundle") {
        const totalRequired = bundleType === "3-in-1" ? 3 : 5;
        const selectedItems = Object.values(selectedBundleVariants);
        if (selectedItems.length !== totalRequired) {
          toastError(`Please select ${totalRequired} items for the ${bundleType} bundle`);
          return;
        }
        let bundleImage = "https://via.placeholder.com/500";
        if (productData?.data?.images && productData.data.images.length > 0) {
          const img = productData.data.images[0];
          bundleImage = img?.image_url || img?.url || img || bundleImage;
        }
        const bundleName = productData?.data?.name || "Unnamed Bundle";
        const bundlePrice = getBundlePrice();

        if (isAuthenticated()) {
          const userId = getUserId();
          if (!userId) throw new Error("Could not determine user ID");
          const token = getToken();
          const authAxios = axios.create({
            headers: { Authorization: `Bearer ${token}` },
          });
          await authAxios.post(`${API_BASE_URL}/api/cart`, {
            user_id: userId,
            product_type: "bundle",
            bundle_id: productData.data.id,
            quantity,
            items: selectedItems.map((item) => ({
              variant_id: item.variantId,
              size_id: item.sizeId,
            })),
          });
          toastSuccess("Bundle added to cart");
          window.dispatchEvent(new Event("cartUpdated"));
          setSelectedBundleVariants({});
          fetchCart();
          openCart();
        } else {
          addToGuestCart({
            product_type: "bundle",
            bundle_id: productData.data.id,
            quantity,
            price: bundlePrice,
            items: selectedItems.map((item) => ({
              variant_id: item.variantId,
              size_id: item.sizeId,
            })),
            item: {
              id: productData.data.id,
              name: bundleName,
              image: bundleImage,
              price: bundlePrice,
              is_product: false,
              items: selectedItems.map((item) => ({
                variant_id: item.variantId,
                size_id: item.sizeId,
                color_name: item.colorName,
                size_name: item.sizeName,
                product_name: bundleName,
              })),
            },
          });
          toastSuccess("Bundle added to guest cart");
          window.dispatchEvent(new Event("cartUpdated"));
          setSelectedBundleVariants({});
          fetchCart();
          openCart();
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toastError("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toastError(err.response?.data?.error || "Failed to add to cart");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getBundlePrice = () => {
    if (!productData || productData.type !== "bundle") return 0;
    const basePrice = Number.parseFloat(productData.data.price) || 0;
    return bundleType === "5-in-1" ? basePrice * 1.5 : basePrice;
  };

  if (loading || contextLoading || authLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (error || !productData) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor">
        <Navbar2 />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <WarningCircle size={40} className="text-text-tertiary mx-auto mb-3" weight="light" />
            <h2 className="text-lg font-display font-semibold text-Primarycolor mb-2">Product unavailable</h2>
            <p className="text-xs font-display text-text-secondary mb-6">{error || "Failed to load product details."}</p>
            <Button onClick={() => navigate('/shop')} size="sm">
              Explore collection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { type, data } = productData || {};
  const isProduct = type === "product";

  const normalizeImages = (imgArr) => {
    if (!Array.isArray(imgArr)) return [];
    if (typeof imgArr[0] === 'object') {
      return [...imgArr]
        .sort((a, b) => (b?.is_primary === true) - (a?.is_primary === true))
        .map((x) => x.image_url || x.url || x);
    }
    return imgArr;
  };

  const images = isProduct
    ? normalizeImages(selectedVariant?.images)
    : normalizeImages(data?.images);

  const videos = isProduct
    ? (Array.isArray(selectedVariant?.videos) ? selectedVariant.videos : [])
    : (Array.isArray(data?.videos) ? data.videos : []);

  const mediaList = [...images, ...videos];

  const name = isProduct
    ? (selectedVariant?.variant_name || data?.name || "Unnamed Product")
    : (data?.name || "Unnamed Bundle");

  const getSizeSpecificPrice = () => {
    if (!isProduct || !selectedSize || !selectedVariant) return data?.price || 0;
    const sizes = Array.isArray(selectedVariant.sizes) ? selectedVariant.sizes : [];
    const selectedSizeObj = sizes.find(s => s.size_name === selectedSize);
    return selectedSizeObj?.price || data?.price || 0;
  };

  const getCalculatedUnitPrice = () => {
    if (!isProduct) return getBundlePrice();
    const config = getPricingSplitConfig(productData);
    if (!config) return getSizeSpecificPrice();

    const pieceObj = config.pieces?.find((p) => p.id === selectedPieceId) || config.pieces?.[0];
    const basePiecePrice = pieceObj ? pieceObj.price : getSizeSpecificPrice();

    const sizes = Array.isArray(selectedVariant?.sizes) ? selectedVariant.sizes : [];
    const defaultSizeObj = sizes.find((s) => s.size_name === 'S' || s.size_name === 'M') || sizes[0];
    const defaultSizePrice = defaultSizeObj?.price || data?.price || 0;
    const currentSizeObj = sizes.find((s) => s.size_name === selectedSize);
    const currentSizePrice = currentSizeObj?.price || defaultSizePrice;
    const sizeOffset = Math.max(0, currentSizePrice - defaultSizePrice);

    const addonsPrice = (config.addons || [])
      .filter((a) => selectedAddonIds.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);

    return basePiecePrice + sizeOffset + addonsPrice;
  };

  const getCustomizedProductName = () => {
    let baseName = productData?.data?.name || "Unnamed Product";
    const config = getPricingSplitConfig(productData);
    if (!config) return baseName;

    const pieceObj = config.pieces?.find((p) => p.id === selectedPieceId);
    let details = [];
    if (pieceObj && pieceObj.id !== 'full') {
      details.push(pieceObj.label);
    }
    if (config.addons) {
      config.addons.forEach((a) => {
        if (selectedAddonIds.includes(a.id)) {
          details.push(`+ ${a.label}`);
        }
      });
    }
    if (details.length > 0) {
      return `${baseName} (${details.join(', ')})`;
    }
    return baseName;
  };

  const splitConfig = getPricingSplitConfig(productData);

  const rawPrice = isProduct ? getCalculatedUnitPrice() : getBundlePrice();
  const parsedPrice = Number.parseFloat(rawPrice) || 0;
  const displayPrice = country === "Nigeria" ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2);
  const displayCurrency = country === "Nigeria" ? "NGN" : "USD";

  const isSoldOut = isProduct ? (Number(data?.total_stock) === 0) : false;
  const isVariantSoldOut = isProduct && selectedVariant && selectedSize
    ? (selectedVariant.sizes?.find((s) => s.size_name === selectedSize)?.stock_quantity || 0) <= 0
    : isSoldOut;

  const colorOptions = isProduct
    ? (Array.isArray(data?.variants) ? data.variants.map((v) => v.color_name).filter(Boolean) : [])
    : [];

  const sortSizes = (sizes) => {
    const sizeOrder = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    return sizes.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a.size_name);
      const bIndex = sizeOrder.indexOf(b.size_name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  const sizeOptions = isProduct
    ? sortSizes(Array.isArray(selectedVariant?.sizes) ? selectedVariant.sizes : [])
    : sortSizes(Array.isArray(data?.items?.[0]?.all_variants?.[0]?.sizes) ? data?.items?.[0]?.all_variants?.[0]?.sizes : []);

  const plainDescription = (data?.description || '').replace(/<[^>]+>/g, '').substring(0, 160);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor font-display">
      <SEO
        title={name}
        description={plainDescription}
        image={images[0] || ""}
        url={window.location.pathname}
        type="product"
      />
      <ProductSchema
        productData={productData}
        selectedVariant={selectedVariant}
        selectedSize={selectedSize}
        isProduct={isProduct}
        currentUrl={window.location.href}
      />
      <Navbar2 />

      {/* Premium Member Promo Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-Primarycolor via-[#1e1e1e] to-Primarycolor text-white mt-16 sm:mt-20 border-b border-white/10 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="section-container relative py-3.5 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/25 text-[0.65rem] font-display font-semibold uppercase tracking-widest">
                <Tag size={12} weight="fill" className="text-amber-400" />
                Insider Privilege
              </span>
              <p className="text-xs sm:text-sm font-display text-white/90">
                <span className="font-semibold text-white">Enjoy 10% Off Your First Order</span>
                <span className="text-white/60 hidden md:inline"> &mdash; Sign up today for instant member perks & early access to drops.</span>
              </p>
            </div>
            
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-Primarycolor hover:bg-amber-300 transition-all duration-300 text-xs font-display font-semibold uppercase tracking-wider shadow-sm flex-shrink-0"
            >
              <span>Claim 10% Off</span>
              <ArrowRight size={13} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-8 pb-20">
        <div className="section-container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-display text-text-tertiary mb-8 uppercase tracking-[0.08em]">
            <Link to="/home" className="hover:text-Primarycolor transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-Primarycolor transition-colors">Collection</Link>
            <span>/</span>
            <span className="text-Primarycolor font-medium truncate max-w-[200px]">{name}</span>
          </nav>

          {/* Product Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            
            {/* Left: Gallery (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Image Stage */}
              <div className="relative aspect-[3/4] bg-surface rounded-sm overflow-hidden border border-border group">
                {selectedImage < images.length ? (
                  <img
                    src={images[selectedImage] || "https://via.placeholder.com/600"}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <video
                      key={selectedImage}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    >
                      <source src={videos[selectedImage - images.length]?.video_url} type="video/mp4" />
                    </video>
                  </div>
                )}

                {/* Badge */}
                {!isProduct && (
                  <div className="absolute top-4 left-4 bg-Primarycolor text-white px-3 py-1 text-[0.7rem] uppercase tracking-[0.1em] font-medium rounded-sm">
                    Bundle Set
                  </div>
                )}

                {/* Arrow Controls */}
                {mediaList.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev - 1 + mediaList.length) % mediaList.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 text-Primarycolor hover:bg-white transition-all duration-200 rounded-sm opacity-0 group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <CaretLeft size={16} weight="bold" />
                    </button>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev + 1) % mediaList.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 text-Primarycolor hover:bg-white transition-all duration-200 rounded-sm opacity-0 group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <CaretRight size={16} weight="bold" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              {mediaList.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {mediaList.map((med, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative aspect-[3/4] bg-surface rounded-sm overflow-hidden border transition-all duration-200 ${
                        selectedImage === idx ? 'border-Primarycolor ring-1 ring-Primarycolor' : 'border-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      {idx < images.length ? (
                        <img src={med} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center text-white text-[0.65rem] uppercase">
                          Video
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info & Actions (5 Cols) */}
            <div className="lg:col-span-5 space-y-8 sticky top-28">
              {/* Header */}
              <div>
                <span className="text-[0.7rem] uppercase tracking-[0.15em] text-text-tertiary font-medium block mb-2">
                  Prechi
                </span>
                <h1 className="text-2xl sm:text-3xl font-display font-semibold text-Primarycolor tracking-tight mb-3">
                  {toTitleCase(name)}
                </h1>
                
                {/* Price Display */}
                <div className="flex items-baseline gap-3">
                  <span className="text-xl sm:text-2xl font-display font-semibold text-Primarycolor tabular-nums">
                    {displayCurrency === "NGN" ? "₦" : "$"}{Number(displayPrice).toLocaleString()}
                  </span>
                  {isVariantSoldOut && (
                    <span className="text-xs uppercase tracking-widest text-error font-medium">
                      Sold out
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Variant / Style / Color selector */}
              {isProduct && Array.isArray(data?.variants) && data.variants.length > 1 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-[0.08em] font-medium text-text-secondary">
                      Select Option / Color: <span className="text-Primarycolor font-semibold">{toTitleCase(selectedVariant?.name || selectedColor || '')}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {data.variants.map((v) => {
                      const isSelected = (selectedVariant?.id && v.id) ? selectedVariant.id === v.id : (selectedVariant?.variant_id === v.variant_id);
                      const hex = colorMap[v.color_name] || "#000000";
                      return (
                        <button
                          key={v.variant_id || v.id}
                          type="button"
                          onClick={() => handleVariantChange(v)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-sm border text-xs font-display transition-all duration-200 ${
                            isSelected
                              ? 'border-Primarycolor bg-Primarycolor/5 text-Primarycolor font-semibold ring-1 ring-Primarycolor shadow-sm'
                              : 'border-border hover:border-Primarycolor/50 text-text-secondary bg-white'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <span>{v.name || v.color_name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {sizeOptions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-[0.08em] font-medium text-text-secondary">
                      Select size
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {sizeOptions.map((sz) => {
                      const isSelected = selectedSize === sz.size_name;
                      const isOut = sz.stock_quantity <= 0;
                      return (
                        <button
                          key={sz.size_name}
                          disabled={isOut}
                          onClick={() => handleSizeChange(sz.size_name)}
                          className={`h-11 border text-xs font-display font-medium uppercase tracking-wider rounded-sm transition-all duration-200 ${
                            isOut
                              ? 'border-border bg-surface text-text-tertiary line-through cursor-not-allowed'
                              : isSelected
                              ? 'border-Primarycolor bg-Primarycolor text-white'
                              : 'border-border text-Primarycolor hover:border-Primarycolor'
                          }`}
                        >
                          {sz.size_name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Component / Split Pricing Selector */}
              {splitConfig && (
                <div className="space-y-4 bg-surface/50 border border-border p-4 rounded-sm">
                  {splitConfig.pieces && splitConfig.pieces.length > 1 && (
                    <div>
                      <label className="text-xs uppercase tracking-[0.08em] font-medium text-text-secondary block mb-2.5">
                        Select Option / Component
                      </label>
                      <div className="space-y-2">
                        {splitConfig.pieces.map((piece) => {
                          const isSelected = selectedPieceId === piece.id;
                          const itemPriceNGN = piece.price;
                          const displayPiecePrice = country === "Nigeria" 
                            ? `₦${itemPriceNGN.toLocaleString()}`
                            : `$${(itemPriceNGN * exchangeRate).toFixed(2)}`;

                          return (
                            <button
                              key={piece.id}
                              type="button"
                              onClick={() => setSelectedPieceId(piece.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-sm border text-left text-xs font-display transition-all duration-200 ${
                                isSelected
                                  ? "border-Primarycolor bg-Primarycolor/5 text-Primarycolor font-semibold ring-1 ring-Primarycolor"
                                  : "border-border hover:border-Primarycolor/50 text-text-secondary bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                  isSelected ? "border-Primarycolor bg-Primarycolor text-white" : "border-border"
                                }`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span>{piece.label}</span>
                              </div>
                              <span className="font-semibold tabular-nums text-Primarycolor">
                                {displayPiecePrice}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Optional Add-ons */}
                  {splitConfig.addons && splitConfig.addons.length > 0 && (
                    <div className="pt-2 border-t border-border/60">
                      <label className="text-xs uppercase tracking-[0.08em] font-medium text-text-secondary block mb-2.5">
                        Optional Add-Ons
                      </label>
                      <div className="space-y-2">
                        {splitConfig.addons.map((addon) => {
                          const isChecked = selectedAddonIds.includes(addon.id);
                          const addonPriceNGN = addon.price;
                          const displayAddonPrice = country === "Nigeria"
                            ? `+₦${addonPriceNGN.toLocaleString()}`
                            : `+$${(addonPriceNGN * exchangeRate).toFixed(2)}`;

                          const toggleAddon = () => {
                            if (isChecked) {
                              setSelectedAddonIds(selectedAddonIds.filter((id) => id !== addon.id));
                            } else {
                              setSelectedAddonIds([...selectedAddonIds, addon.id]);
                            }
                          };

                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={toggleAddon}
                              className={`w-full flex items-center justify-between p-3 rounded-sm border text-left text-xs font-display transition-all duration-200 ${
                                isChecked
                                  ? "border-Primarycolor bg-Primarycolor/5 text-Primarycolor font-semibold ring-1 ring-Primarycolor"
                                  : "border-border hover:border-Primarycolor/50 text-text-secondary bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isChecked ? "border-Primarycolor bg-Primarycolor text-white" : "border-border"
                                }`}>
                                  {isChecked && <Check size={12} weight="bold" />}
                                </div>
                                <span>{addon.label}</span>
                              </div>
                              <span className="font-semibold tabular-nums text-Primarycolor">
                                {displayAddonPrice}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity & CTA */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {/* Quantity control */}
                  <div className="flex items-center border border-border rounded-sm h-12 px-3 bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-1 text-text-secondary hover:text-Primarycolor transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-display font-medium tabular-nums text-Primarycolor">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-1 text-text-secondary hover:text-Primarycolor transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || isVariantSoldOut}
                    className="flex-1 h-12 w-full"
                    size="lg"
                  >
                    {isAddingToCart ? (
                      <span className="flex items-center justify-center gap-2">
                        <CircleNotch size={16} className="animate-spin" />
                        Adding to bag...
                      </span>
                    ) : isVariantSoldOut ? (
                      'Sold out'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <ShoppingBag size={18} weight="light" />
                        Add to shopping bag
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Guarantees */}
              <div className="border-t border-border pt-6 space-y-4 text-xs font-display text-text-secondary">
                <div className="flex items-center gap-3">
                  <Truck size={18} weight="light" className="text-Primarycolor flex-shrink-0" />
                  <span>Fast nationwide delivery across Nigeria & international shipping</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} weight="light" className="text-Primarycolor flex-shrink-0" />
                  <span>100% authentic Prechi guaranteed performance materials</span>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowCounterClockwise size={18} weight="light" className="text-Primarycolor flex-shrink-0" />
                  <span>Hassle-free exchange policy within 7 days</span>
                </div>
              </div>

            </div>
          </div>

          {/* Description & Care Instructions section */}
          <div className="mt-16 sm:mt-20 border-t border-border pt-12 sm:pt-16">
            <DescriptionSection isProduct={isProduct} description={data?.description} data={data} />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;

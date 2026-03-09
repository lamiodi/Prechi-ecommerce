-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
  id integer NOT NULL DEFAULT nextval('addresses_id_seq'::regclass),
  user_id integer NOT NULL,
  address_line_1 character varying NOT NULL,
  landmark character varying,
  city character varying NOT NULL,
  state character varying NOT NULL,
  zip_code character varying,
  country character varying DEFAULT 'Nigeria'::character varying,
  is_default boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  title text,
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.billing_addresses (
  id integer NOT NULL DEFAULT nextval('billing_addresses_id_seq'::regclass),
  user_id integer NOT NULL,
  address_line_1 character varying NOT NULL,
  address_line2 character varying,
  city character varying NOT NULL,
  state character varying NOT NULL,
  zip_code character varying,
  country character varying DEFAULT 'Nigeria'::character varying,
  is_default boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  full_name text,
  email text,
  phone_number text,
  CONSTRAINT billing_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT billing_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.bundle_images (
  id integer NOT NULL DEFAULT nextval('bundle_images_id_seq'::regclass),
  bundle_id integer NOT NULL,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  video_url text,
  media_type character varying DEFAULT 'image'::character varying CHECK (media_type::text = ANY (ARRAY['image'::character varying, 'video'::character varying]::text[])),
  video_thumbnail_url text,
  CONSTRAINT bundle_images_pkey PRIMARY KEY (id),
  CONSTRAINT bundle_images_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id)
);
CREATE TABLE public.bundle_items (
  id integer NOT NULL DEFAULT nextval('bundle_items_id_seq'::regclass),
  bundle_id integer NOT NULL,
  variant_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bundle_items_pkey PRIMARY KEY (id),
  CONSTRAINT bundle_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id)
);
CREATE TABLE public.bundles (
  id integer NOT NULL DEFAULT nextval('bundles_id_seq'::regclass),
  uuid uuid DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  bundle_price numeric NOT NULL,
  sku_prefix character varying,
  bundle_type character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  currency character varying DEFAULT 'NGN'::character varying,
  product_id integer,
  CONSTRAINT bundles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cart (
  id integer NOT NULL DEFAULT nextval('cart_id_seq'::regclass),
  user_id integer NOT NULL,
  total numeric DEFAULT 0.00,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT cart_pkey PRIMARY KEY (id),
  CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.cart_bundle_items (
  id integer NOT NULL DEFAULT nextval('cart_bundle_items_id_seq'::regclass),
  cart_item_id integer NOT NULL,
  variant_id integer NOT NULL,
  size_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cart_bundle_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_bundle_items_cart_item_id_fkey FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(id),
  CONSTRAINT cart_bundle_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT cart_bundle_items_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(id)
);
CREATE TABLE public.cart_items (
  id integer NOT NULL DEFAULT nextval('cart_items_id_seq'::regclass),
  cart_id integer NOT NULL,
  variant_id integer,
  bundle_id integer,
  size_id integer,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  currency character varying DEFAULT 'NGN'::character varying,
  is_bundle boolean DEFAULT false,
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(id),
  CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT cart_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id),
  CONSTRAINT cart_items_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.colors (
  id integer NOT NULL DEFAULT nextval('colors_id_seq'::regclass),
  color_name character varying NOT NULL,
  color_code character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT colors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.newsletter_subscribers (
  id integer NOT NULL DEFAULT nextval('newsletter_subscribers_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  subscribed_at timestamp without time zone DEFAULT now(),
  unsubscribed_at timestamp without time zone,
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id integer NOT NULL,
  variant_id integer,
  bundle_id integer,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  size_id integer,
  product_name character varying,
  image_url text,
  color_name character varying,
  size_name character varying,
  bundle_details text,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT order_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id),
  CONSTRAINT order_items_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(id)
);
CREATE TABLE public.orders (
  id integer NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  uuid uuid DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  reference character varying NOT NULL UNIQUE,
  payment_method character varying,
  payment_status character varying DEFAULT 'pending'::character varying,
  status character varying DEFAULT 'pending'::character varying,
  subtotal numeric DEFAULT 0.00,
  delivery_fee numeric DEFAULT 0.00,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0.00,
  idempotency_key character varying UNIQUE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  email_sent boolean DEFAULT false,
  delivery_fee_paid boolean DEFAULT false,
  shipping_method character varying,
  address_id integer,
  billing_address_id integer,
  cart_id integer,
  shipping_cost numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  note text,
  currency character varying DEFAULT 'NGN'::character varying,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id),
  CONSTRAINT orders_billing_address_id_fkey FOREIGN KEY (billing_address_id) REFERENCES public.billing_addresses(id),
  CONSTRAINT orders_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(id)
);
CREATE TABLE public.product_images (
  id integer NOT NULL DEFAULT nextval('product_images_id_seq'::regclass),
  variant_id integer NOT NULL,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  video_url text,
  media_type character varying DEFAULT 'image'::character varying CHECK (media_type::text = ANY (ARRAY['image'::character varying, 'video'::character varying]::text[])),
  video_thumbnail_url text,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.product_variants (
  id integer NOT NULL DEFAULT nextval('product_variants_id_seq'::regclass),
  product_id integer NOT NULL,
  color_id integer NOT NULL,
  sku character varying NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  name character varying,
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_variants_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(id)
);
CREATE TABLE public.product_videos (
  id integer NOT NULL DEFAULT nextval('product_videos_id_seq'::regclass),
  variant_id integer,
  bundle_id integer,
  video_url text NOT NULL,
  video_thumbnail_url text,
  title character varying,
  description text,
  duration_seconds integer,
  position integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_videos_pkey PRIMARY KEY (id),
  CONSTRAINT product_videos_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT product_videos_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id)
);
CREATE TABLE public.products (
  id integer NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  uuid uuid DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  base_price numeric NOT NULL,
  sku_prefix character varying,
  category character varying,
  gender character varying,
  is_active boolean DEFAULT true,
  is_new_release boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  currency character varying DEFAULT 'NGN'::character varying,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.review_images (
  id integer NOT NULL DEFAULT nextval('review_images_id_seq'::regclass),
  review_id integer,
  image_url text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT review_images_pkey PRIMARY KEY (id),
  CONSTRAINT review_images_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id)
);
CREATE TABLE public.reviews (
  id integer NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  user_id integer,
  product_id integer,
  bundle_id integer,
  rating integer,
  title text,
  comment text,
  helpful integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  deleted_at timestamp without time zone,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT reviews_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id)
);
CREATE TABLE public.sizes (
  id integer NOT NULL DEFAULT nextval('sizes_id_seq'::regclass),
  size_name character varying NOT NULL,
  size_order integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sizes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  uuid uuid DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  first_name character varying,
  last_name character varying,
  username character varying UNIQUE,
  phone_number character varying,
  is_admin boolean DEFAULT false,
  reset_token text,
  reset_token_expires timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  first_order boolean DEFAULT true,
  is_temporary boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.variant_sizes (
  id integer NOT NULL DEFAULT nextval('variant_sizes_id_seq'::regclass),
  variant_id integer NOT NULL,
  size_id integer NOT NULL,
  stock_quantity integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  price numeric DEFAULT 0,
  CONSTRAINT variant_sizes_pkey PRIMARY KEY (id),
  CONSTRAINT variant_sizes_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT variant_sizes_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(id)
);
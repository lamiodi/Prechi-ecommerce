# Backend System Architecture Documentation

## Executive Summary

This document provides a comprehensive analysis of the Prechi e-commerce backend system architecture, performance characteristics, and optimization recommendations. The system is built on Node.js/Express with PostgreSQL database and integrates with multiple third-party services.

## 1. System Architecture Overview

### 1.1 Technology Stack
- **Backend Framework**: Node.js with Express.js
- **Database**: PostgreSQL with connection pooling
- **File Storage**: Cloudinary for image hosting
- **Payment Processing**: Paystack integration
- **Email Service**: Resend for transactional emails
- **Environment**: Development/Production with SSL support

### 1.2 Core Components

#### Application Layer (Express.js)
- **Entry Point**: `server.js` - Configures middleware, CORS, and route mounting
- **Controllers**: Business logic implementation
  - `orderController.js` - Order creation, verification, and management
  - `productController.js` - Product and bundle operations
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, error handling, request parsing

#### Data Layer (PostgreSQL)
- **Connection Pooling**: 10 max connections, 30s idle timeout
- **Schema**: 24 tables with complex relationships
- **Key Tables**: users, products, orders, order_items, bundles, cart

#### Third-Party Integrations
- **Cloudinary**: Product and bundle image management
- **Paystack**: Payment processing
- **Resend**: Email notifications

### 1.3 API Architecture

#### RESTful Endpoints Structure
```
/api/products/:id          - Get product/bundle details
/api/products/             - Create new product (admin)
/api/orders/               - Create new order
/api/orders/verify/:reference - Verify order by reference
/api/orders/:id            - Get order details
/api/orders/user/:userId   - Get user orders
```

## 2. Database Schema Analysis

### 2.1 Table Relationships

#### Core Entity Relationships:
- **users** → **orders** (1:N)
- **users** → **addresses** (1:N)
- **users** → **cart** (1:1)
- **products** → **product_variants** (1:N)
- **product_variants** → **variant_sizes** (1:N)
- **orders** → **order_items** (1:N)
- **bundles** → **bundle_items** (1:N)

#### Key Constraints:
- Unique constraints on email, username, SKU codes
- Foreign key relationships with cascade rules
- Check constraints for data validation (ratings 1-5, positive quantities)

### 2.2 Index Analysis
**Critical Finding**: The current schema lacks essential indexes for performance optimization. Key missing indexes:
- `orders.reference` (frequent lookups)
- `orders.idempotency_key` (duplicate prevention)
- `order_items.order_id` (order retrieval)
- `product_variants.product_id` (product queries)
- `variant_sizes.variant_id` (stock queries)

## 3. Performance Analysis

### 3.1 Critical API Endpoints Performance

#### Order Creation (`/api/orders/`)
**Current Implementation Analysis:**
- **Complexity**: High (737 lines of code)
- **Database Operations**: 15+ queries per order
- **Transaction Scope**: Full order creation in single transaction
- **Validation**: Comprehensive but computationally expensive

**Performance Characteristics:**
- Idempotency key checking (prevents duplicates)
- Stock validation and updates (real-time)
- Price validation with currency conversion
- Bundle configuration validation
- Address creation/validation

**Identified Bottlenecks:**
1. Multiple sequential database queries
2. Complex bundle validation logic
3. Real-time stock updates during transaction
4. No caching for frequently accessed data

#### Product Retrieval (`/api/products/:id`)
**Current Implementation:**
- Dual query approach (product + bundle lookup)
- Complex JSON aggregation for variants and sizes
- No caching mechanism
- Multiple JOIN operations

### 3.2 Database Query Patterns

#### High-Frequency Queries:
1. **Order Reference Lookup**: `SELECT * FROM orders WHERE reference = $1`
2. **Product Variant Fetch**: Complex JOIN across 4+ tables
3. **Stock Validation**: `SELECT stock_quantity FROM variant_sizes WHERE variant_id = $1 AND size_id = $2`
4. **User Order History**: `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`

#### Query Complexity Analysis:
- **Simple Lookups**: 1-2ms (with proper indexes)
- **Complex Joins**: 10-50ms (product with variants)
- **Aggregation Queries**: 20-100ms (order statistics)

## 4. Third-Party Integrations

### 4.1 Cloudinary Integration
**Purpose**: Product and bundle image management
**Implementation**: Direct upload during product creation
**Performance Impact**: Synchronous upload can block product creation

### 4.2 Paystack Integration
**Purpose**: Payment processing
**Implementation**: Webhook-based payment verification
**Performance**: Asynchronous, minimal impact on order creation

### 4.3 Resend Integration
**Purpose**: Email notifications
**Implementation**: Used for international order notifications
**Performance**: Asynchronous processing

## 5. Current Caching Strategy

**Critical Finding**: No caching implementation detected
- No Redis or in-memory caching
- No database query result caching
- No API response caching
- Static assets served without cache headers

## 6. Error Handling and Logging

### 6.1 Current Error Patterns
- Comprehensive validation with detailed error messages
- Database constraint violations properly handled
- Idempotency key conflicts managed
- Stock validation failures with specific messaging

### 6.2 Logging Implementation
- Detailed console logging throughout order creation
- Request/response payload logging for debugging
- Performance metrics not currently logged

## 7. Security Considerations

### 7.1 Current Security Measures
- CORS configuration with origin validation
- Input validation on all endpoints
- SQL injection prevention through parameterized queries
- File upload restrictions via Multer

### 7.2 Identified Security Gaps
- No rate limiting implementation
- No API authentication/authorization visible
- No input sanitization for XSS prevention
- File upload type validation needs review

## 8. Scalability Assessment

### 8.1 Current Limitations
- Single database instance (no read replicas)
- No horizontal scaling capability
- Connection pool limited to 10 connections
- No load balancing configuration
- No CDN for static assets

### 8.2 Performance Bottlenecks
1. **Database Layer**: Missing indexes, no query optimization
2. **Application Layer**: Synchronous third-party integrations
3. **Infrastructure**: No caching, single point of failure
4. **API Design**: Heavy payloads, no pagination

---

*This document continues with detailed performance recommendations and implementation plans in the following sections.*
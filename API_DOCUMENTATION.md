# API Documentation

## Overview
This document provides comprehensive documentation for all backend API endpoints, including request/response formats, authentication requirements, and performance characteristics.

## Authentication
**Current Status**: No authentication middleware detected in the current implementation
**Recommendation**: Implement JWT-based authentication for all protected endpoints

## Core API Endpoints

### Products API

#### Get Product/Bundle by ID
**Endpoint**: `GET /api/products/:id`

**Description**: Retrieves detailed information about a product or bundle, including variants, sizes, and images.

**Request Parameters**:
- `id` (path parameter): Product or Bundle ID (integer)

**Response Format**:
```json
{
  "type": "product",
  "data": {
    "id": 123,
    "name": "Premium Cotton T-Shirt",
    "description": "High-quality cotton t-shirt",
    "price": 49.99,
    "type": "TSHIRT-001",
    "is_active": true,
    "is_new_release": false,
    "category": "clothing",
    "gender": "unisex",
    "variants": [
      {
        "variant_id": 456,
        "color_id": 789,
        "color_name": "Navy Blue",
        "color_code": "#000080",
        "sku": "TSHIRT-001-0",
        "name": "Navy Blue Variant",
        "images": ["https://cloudinary.com/image1.jpg"],
        "sizes": [
          {
            "size_id": 1,
            "size_name": "Small",
            "stock_quantity": 25
          }
        ]
      }
    ]
  }
}
```

**Performance Characteristics**:
- **Query Complexity**: High (4+ table JOINs)
- **Expected Response Time**: 20-50ms
- **Database Queries**: 2 parallel queries (product + bundle)
- **Potential Bottlenecks**: JSON aggregation, multiple JOINs

#### Create Product (Admin)
**Endpoint**: `POST /api/products/`

**Description**: Creates a new product with variants, sizes, and images

**Request Format** (multipart/form-data):
```json
{
  "data": {
    "name": "Product Name",
    "description": "Product description",
    "base_price": 49.99,
    "sku_prefix": "PROD-001",
    "category": "clothing",
    "gender": "unisex",
    "variants": [
      {
        "color_id": 789,
        "name": "Variant Name",
        "sizes": [
          {
            "size_id": 1,
            "stock_quantity": 50
          }
        ]
      }
    ]
  }
}
```

**File Uploads**: 
- `images_0`, `images_1`, etc. (up to 5 images per variant)
- Maximum 5 images per variant
- Supported formats: JPG, PNG, WebP

**Response Format**:
```json
{
  "message": "Product created successfully"
}
```

**Performance Characteristics**:
- **Processing Time**: 500-2000ms (depends on image upload)
- **Database Operations**: Transaction with multiple inserts
- **External Dependencies**: Cloudinary image upload
- **Potential Bottlenecks**: Synchronous image uploads

### Orders API

#### Create Order
**Endpoint**: `POST /api/orders/`

**Description**: Creates a new order with comprehensive validation, stock management, and idempotency support

**Request Headers**:
- `x-idempotency-key` (optional): UUID for duplicate prevention

**Request Format**:
```json
{
  "user_id": 123,
  "address_id": 456,
  "billing_address_id": 789,
  "cart_id": 101,
  "total": 149.99,
  "discount": 10.00,
  "tax": 7.50,
  "shipping_method_id": 1,
  "shipping_cost": 15.00,
  "currency": "USD",
  "reference": "ORDER-ABC123",
  "note": "Gift wrapping requested",
  "exchange_rate": 1.0,
  "base_currency_total": 149.99,
  "converted_total": 149.99,
  "delivery_option": "standard",
  "payment_method": "card",
  "items": [
    {
      "variant_id": 456,
      "size_id": 1,
      "quantity": 2,
      "price": 49.99
    },
    {
      "bundle_id": 789,
      "quantity": 1,
      "price": 49.99,
      "bundle_items": [
        {
          "variant_id": 123,
          "size_id": 2
        },
        {
          "variant_id": 456,
          "size_id": 1
        },
        {
          "variant_id": 789,
          "size_id": 3
        }
      ]
    }
  ]
}
```

**Response Format**:
```json
{
  "order": {
    "id": 12345,
    "reference": "ORDER-ABC123",
    "discount": 10.00
  }
}
```

**Error Responses**:
- `400`: Validation errors (missing fields, invalid data)
- `409`: Conflict (order already exists)
- `500`: Server error

**Performance Characteristics**:
- **Processing Time**: 100-500ms (depends on complexity)
- **Database Queries**: 15+ queries per order
- **Transaction Scope**: Full order creation in single transaction
- **Validation**: Comprehensive stock, price, and data validation
- **Idempotency**: Supported via x-idempotency-key header

**Key Features**:
- Real-time stock validation and updates
- Price validation with currency conversion
- Bundle configuration validation
- Guest user support with address creation
- International shipping handling

#### Verify Order by Reference
**Endpoint**: `GET /api/orders/verify/:reference`

**Description**: Retrieves order details by reference number

**Request Parameters**:
- `reference` (path parameter): Order reference string

**Response Format**:
```json
{
  "order": {
    "id": 12345,
    "reference": "ORDER-ABC123",
    "total": 149.99,
    "status": "pending",
    "payment_status": "pending",
    "created_at": "2024-01-15T10:30:00Z",
    "items": [...],
    "shipping_address": {...},
    "billing_address": {...}
  }
}
```

#### Get User Orders
**Endpoint**: `GET /api/orders/user/:userId`

**Description**: Retrieves all orders for a specific user

**Request Parameters**:
- `userId` (path parameter): User ID (integer)

**Response Format**:
```json
{
  "orders": [
    {
      "id": 12345,
      "reference": "ORDER-ABC123",
      "total": 149.99,
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Order by ID
**Endpoint**: `GET /api/orders/:id`

**Description**: Retrieves detailed order information by order ID

**Request Parameters**:
- `id` (path parameter): Order ID (integer)

**Response Format**: Similar to verify endpoint with full order details

#### Cancel Order
**Endpoint**: `DELETE /api/orders/:orderId`

**Description**: Cancels an existing order (implementation not examined)

**Request Parameters**:
- `orderId` (path parameter): Order ID to cancel

## Performance Metrics

### Current Response Times (Estimated)
- **Product Retrieval**: 20-50ms
- **Order Creation**: 100-500ms
- **Order Verification**: 10-30ms
- **User Orders**: 50-150ms

### Database Query Performance
- **Simple Lookups**: 1-2ms (with indexes)
- **Complex Joins**: 10-50ms
- **Order Creation Queries**: 5-15ms each
- **Stock Updates**: 3-8ms

## Error Handling

### Standard Error Format
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "request": { /* Original request data */ }
}
```

### Common Error Codes
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (duplicate order)
- `500`: Internal Server Error

### Validation Errors
The system provides detailed validation messages for:
- Stock availability
- Price mismatches
- Invalid bundle configurations
- Missing required fields
- Data type validation

## Rate Limiting
**Current Status**: Not implemented
**Recommendation**: Implement rate limiting for order creation (10 requests per minute per user)

## Pagination
**Current Status**: Not implemented for user orders
**Recommendation**: Add pagination for user order history

## Caching Strategy
**Current Status**: No caching implemented
**Recommendation**: Implement Redis caching for:
- Product details (TTL: 1 hour)
- User order history (TTL: 15 minutes)
- Stock levels (TTL: 5 minutes)

---

*This API documentation is based on the current implementation analysis. Recommendations for improvements are included throughout the document.*
# Client Deployment Package - E-commerce System

## 🚀 Quick Start Guide

### System Overview
This is a complete e-commerce platform with:
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express.js + PostgreSQL
- **Features**: Product catalog, shopping cart, order management, payment processing, user authentication, admin dashboard

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn
- Git

## 📋 Environment Setup

### 1. Clone and Install Dependencies
```bash
git clone <your-repo-url> client-ecommerce
cd client-ecommerce

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies  
cd ../Frontend
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb client_ecommerce

# Import schema (from queries.sql)
psql client_ecommerce < Backend/queries.sql
```

### 3. Environment Configuration
Create `.env` files with these variables:

#### Backend/.env
```env
# Database
DATABASE_URL=postgres://username:password@localhost:5432/client_ecommerce
NODE_ENV=development

# Payment Gateway (Paystack)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxx

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key  
CLOUDINARY_API_SECRET=your-api-secret

# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Optional: Email Configuration
SUPPORT_EMAIL=support@clientdomain.com
NO_REPLY_EMAIL=noreply@clientdomain.com
```

#### Frontend/.env
```env
VITE_API_URL=http://localhost:3000
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
VITE_APP_NAME=Client E-commerce
```

## 🚀 Deployment Process

### 1. Development Deployment
```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend  
cd Frontend
npm run dev
```

### 2. Production Build
```bash
# Build frontend
cd Frontend
npm run build

# Start production backend
cd ../Backend
npm start
```

### 3. Database Optimization (Recommended)
Run the optimization scripts from `database_optimization_scripts.sql` for production performance.

## 🔧 Client-Specific Customizations

### Branding Changes
1. **Logo**: Replace `Frontend/public/favicon.png` and update references
2. **Company Name**: Update all "The Tia Brand" references
3. **Colors**: Modify Tailwind CSS in `Frontend/src/index.css`
4. **Email Templates**: Update `Backend/utils/emailService.js`

### Payment Configuration
1. **Paystack**: Update keys in environment variables
2. **Currency**: Modify currency settings in frontend components
3. **Payment Methods**: Configure in `Backend/controllers/paystackController.js`

### Product Catalog
1. **Categories**: Update in database `products` table
2. **Sizes/Colors**: Modify `sizes` and `colors` tables
3. **Shipping**: Configure shipping methods in database

## 📊 Default Admin Access

### Initial Admin User
After database setup, create an admin user:
```sql
INSERT INTO users (first_name, last_name, email, password_hash, is_admin) 
VALUES ('Admin', 'User', 'admin@client.com', 'hashed_password', true);
```

### Admin Dashboard Features
- Product management
- Order processing  
- User management
- Discount codes
- Inventory tracking
- Sales reports

## 🔐 Security Configuration

### Required Security Settings
1. **JWT Secret**: Use strong random string
2. **Database SSL**: Enable in production
3. **CORS**: Update allowed origins in `Backend/server.js`
4. **Environment Variables**: Never commit to version control

### Recommended Security Practices
- Enable HTTPS in production
- Regular database backups
- Monitor application logs
- Keep dependencies updated
- Implement rate limiting

## 📈 Performance Optimization

### Database Indexes
Deploy the recommended indexes from optimization report:
```bash
psql client_ecommerce < database_optimization_scripts.sql
```

### Frontend Optimization
- Enable Vite build optimizations
- Implement lazy loading for images
- Use CDN for static assets
- Enable compression

## 🚨 Troubleshooting Guide

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **Payment Processing Issues**
   - Verify Paystack API keys
   - Check webhook configuration
   - Test with Paystack test cards

3. **Email Delivery Problems**
   - Verify Resend API key
   - Check email templates
   - Monitor email logs

4. **Image Upload Failures**
   - Verify Cloudinary configuration
   - Check file size limits
   - Test with different image formats

### Logging and Monitoring

- Backend logs: Check console output
- Database logs: PostgreSQL query logs
- Frontend errors: Browser console
- Payment logs: Paystack dashboard

## 📞 Support and Maintenance

### Client Onboarding Checklist
- [ ] Environment setup completed
- [ ] Database configured and populated
- [ ] Payment gateway integrated
- [ ] Email service configured
- [ ] Branding customized
- [ ] Admin user created
- [ ] Test transactions processed
- [ ] Performance optimization applied
- [ ] Documentation delivered
- [ ] Training session conducted

### Ongoing Maintenance
- Regular security updates
- Database backups
- Performance monitoring
- Bug fix deployments
- Feature enhancements

## 🎯 Success Metrics

### Deployment Success Criteria
- [ ] Application starts without errors
- [ ] Database connections established
- [ ] Payment processing working
- [ ] Email delivery functional
- [ ] Admin dashboard accessible
- [ ] User registration working
- [ ] Product catalog displayed
- [ ] Order creation functional
- [ ] Performance benchmarks met

### Performance Targets
- Page load: <3 seconds
- API response: <200ms
- Database queries: <50ms
- Payment processing: <5 seconds
- Image upload: <2 seconds

---

## 📋 Next Steps

1. **Immediate**: Set up environment variables
2. **Database**: Import schema and create admin user
3. **Payment**: Configure Paystack test mode
4. **Testing**: Process test orders and payments
5. **Customization**: Apply client branding
6. **Deployment**: Go live with production configuration

For additional support, refer to the detailed documentation in:
- `API_DOCUMENTATION.md` - API endpoints and usage
- `BACKEND_ARCHITECTURE.md` - System architecture  
- `TEST_DOCUMENTATION.md` - Testing procedures
- `DATABASE_OPTIMIZATION_REPORT.md` - Performance guidelines
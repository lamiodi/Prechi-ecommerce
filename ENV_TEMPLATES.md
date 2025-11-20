# Environment Configuration Templates

## Backend Environment (.env)
DATABASE_URL=postgres://username:password@localhost:5432/client_database
NODE_ENV=development
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
RESEND_API_KEY=re_xxxxxxxx
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
JWT_SECRET=generate-strong-random-secret-key-here
SUPPORT_EMAIL=support@clientdomain.com

## Frontend Environment (.env)
VITE_API_URL=http://localhost:3000
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
VITE_APP_NAME="Client E-commerce"

## Production Environment (.env.production)
DATABASE_URL=postgres://prod_user:prod_password@prod-host:5432/prod_db
NODE_ENV=production
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxx
FRONTEND_URL=https://www.clientdomain.com
BACKEND_URL=https://api.clientdomain.com
JWT_SECRET=production-secure-key

## Setup Instructions
1. Copy to Backend/.env and Frontend/.env
2. Replace placeholder values
3. Never commit to version control
4. Use different files for dev/prod
# MCG Payment App

A Progressive Web App (PWA) for the Mendip Caving Group payment system, designed for tablet use with SumUp Air card reader integration.

##  **Architecture**

- **Frontend:** React (via CDN) with Tailwind CSS
- **Backend:** Azure Static Web Apps with Azure Functions
- **Payment Processing:** SumUp Air integration
- **Storage:** Local browser storage with export capabilities
- **Deployment:** Azure Static Web Apps with GitHub Actions

##  **Features**

### **Payment Processing**
- **Bed Nights:** Member/guest pricing with date ranges
- **MCG Membership:** Pro-rata fees based on join date and membership type
- **Day Fees:** Shower and kitchen usage charges
- **Donations:** Flexible amount donations

### **Payment Methods**
- **Card Payments:** SumUp Air integration
- **Bank Transfer (BACS):** With payment details
- **Cash Payments:** With envelope instructions

### **Administrative Features**
- **Fee Management:** Editable membership fee tables
- **Transaction Tracking:** Complete payment history
- **Data Export:** CSV and JSON formats
- **Admin Authentication:** Password-protected access

### **Technical Features**
- **PWA Installation:** Install on tablet home screen
- **Offline Capability:** Local data storage
- **Responsive Design:** Optimized for tablet use
- **Real-time Calculations:** Dynamic fee computation

## 📁 **Project Structure**

```
mcg-payment-app/
├── index.html              # Main application file
├── manifest.json           # PWA manifest
├── api/
│   └── create-checkout/     # Azure Function for SumUp integration
├── .github/
│   └── workflows/           # GitHub Actions for deployment
└── docs/
    ├── README.md           # This file
    └── USER_GUIDE.md       # User operations guide
```

## **Setup & Installation**

### **Prerequisites**
- Azure account with Static Web Apps service
- GitHub repository
- SumUp developer account (for card payments)
- SumUp Air device

### **1. Clone & Deploy**
```bash
# Clone repository
git clone https://github.com/your-org/mcg-payment-app.git
cd mcg-payment-app

# Deploy to Azure Static Web Apps
# (Connected via GitHub Actions - auto-deploys on push)
```

### **2. Configure Azure Static Web App**
1. Create Azure Static Web App resource
2. Connect to GitHub repository
3. Set build configuration:
   - **App location:** `/`
   - **API location:** `api`
   - **Output location:** `/`

### **3. Environment Variables**
Configure in Azure Static Web Apps settings:

```env
# SumUp API Configuration
SUMUP_API_KEY=your_sumup_api_key
SUMUP_MERCHANT_CODE=your_merchant_code
APP_BASE_URL=https://your-app.azurestaticapps.net
NODE_ENV=production  # or 'development' for sandbox
```

### **4. SumUp Integration Setup**
1. Register at https://developer.sumup.com/
2. Create application for MCG Payment App
3. Configure webhook URLs (optional)
4. Get API credentials and merchant code
5. Pair SumUp Air device with tablet

## 💳 **Payment Configuration**

### **SumUp Air Device Setup**
1. Download SumUp app on tablet
2. Pair device via Bluetooth
3. Test connectivity with SumUp app
4. Configure device settings

### **Testing Payment Integration**
```javascript
// Test API endpoint
POST /api/create-checkout
{
  "amount": 10.50,
  "reference": "TEST001",
  "description": "Test transaction"
}
```

### **Sandbox vs Production**
- **Sandbox:** Use `api.sandbox.sumup.com` for testing
- **Production:** Use `api.sumup.com` for live payments
- Switch via `NODE_ENV` environment variable

## 🔧 **Development**

### **Local Development**
```bash
# Serve files locally
npx http-server . -p 8080

# Or use Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli
swa start . --api-location api
```

### **Code Structure**
- **React Components:** Functional components with hooks
- **State Management:** useState for local state
- **Data Persistence:** localStorage with JSON serialization
- **Fee Calculations:** Dynamic pro-rata calculations
- **Error Handling:** Comprehensive try-catch blocks

### **Key Functions**
- `calculateMembershipFee()`: Pro-rata fee calculation
- `processSumUpPayment()`: SumUp API integration
- `exportTransactions()`: Data export functionality
- `saveFees()`: Custom fee table management

## 📊 **Data Management**

### **Local Storage Schema**
```javascript
// Transactions
{
  id: timestamp,
  transactionNumber: "B123456",
  date: ISO_string,
  type: "bed-nights|membership|day-fees|donation",
  amount: number,
  paymentMethod: "sumup|bacs|cash",
  names: array,
  details: object,
  status: "pending|completed|failed|recorded"
}

// Custom Fees
{
  membershipFees: { /* fee table */ },
  bcaFees: { /* BCA fee table */ }
}
```

### **Export Formats**
- **CSV:** For Excel analysis and reporting
- **JSON:** For backup and data migration

## 🔐 **Security**

### **Admin Access**
- Password: `MCG2025` (configurable in code)
- Local authentication only
- No server-side user management

### **Data Protection**
- All data stored locally on device
- No sensitive data transmitted to external services
- HTTPS enforced by Azure Static Web Apps

### **Payment Security**
- SumUp handles all card data (PCI DSS compliant)
- No card details stored in application
- Secure API communication with tokens

## 🚀 **Deployment**

### **Automatic Deployment**
GitHub Actions workflow automatically deploys on push to main branch:

```yaml
# .github/workflows/azure-static-web-apps.yml
name: Azure Static Web Apps CI/CD
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

### **Manual Deployment**
```bash
# Using Azure CLI
az staticwebapp create \
  --name mcg-payment-app \
  --resource-group your-resource-group \
  --source https://github.com/your-org/mcg-payment-app \
  --location "West Europe" \
  --branch main
```

## 📱 **PWA Installation**

### **On Tablet**
1. Open app in browser
2. Use install prompt or browser menu "Add to Home Screen"
3. App appears as native application
4. Works offline with cached data

### **Features**
- Offline functionality
- Home screen icon
- Full-screen experience
- Push notifications (if configured)

## 🔍 **Monitoring**

### **Application Insights** (Optional)
```javascript
// Add to index.html for monitoring
<script>
  // Application Insights configuration
</script>
```

### **Health Checks**
- Monitor API endpoint responses
- Check SumUp device connectivity
- Verify data export functionality

## 📞 **Support**

### **Technical Issues**
- Check browser console for errors
- Verify Azure Function logs
- Test SumUp API connectivity
- Clear browser cache/localStorage

### **SumUp Support**
- Developer docs: https://developer.sumup.com/
- Support: support@sumup.com
- Device issues: Check Bluetooth connectivity

## 📄 **License**

[Include your license information]

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch
3. Make changes and test thoroughly
4. Submit pull request with description

## 📚 **Documentation**

- **User Guide:** See `USER_GUIDE.md` for operational instructions
- **API Documentation:** See SumUp developer documentation
- **Azure Static Web Apps:** Microsoft documentation

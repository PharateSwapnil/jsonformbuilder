
# Duke Energy Data Products Testing - JSON Creator

An industrial-grade JSON form builder web application designed specifically for Duke Energy's Data Products Testing suite. This application provides a comprehensive solution for creating, validating, and managing complex JSON test configurations with real-time preview capabilities.

## 🚀 Features

### Core Functionality
- **Dynamic JSON Form Builder**: Create complex JSON test configurations through an intuitive form interface
- **Real-time JSON Preview**: Live preview with syntax highlighting and error detection
- **Auto-incrementing Feature Numbers**: Automatic feature serial number generation starting from 1
- **Database Management**: Add and manage database connections with credential storage
- **Python Script Integration**: Execute validation and lambda scripts directly from the interface

### User Interface
- **Industrial-grade Design**: Modern, professional UI tailored for enterprise use
- **Duke Energy Branding**: Corporate color scheme and styling
- **Dark/Light Theme Toggle**: Customizable theme preferences
- **Resizable Components**: Adjustable JSON preview panel and form sections
- **Responsive Design**: Works seamlessly across different screen sizes

### Advanced Features
- **Dashboard Analytics**: Comprehensive test execution statistics and visualizations
- **File Operations**: Upload, save, and load JSON configurations
- **Template Loading**: Pre-defined JSON structure templates
- **State File Preview**: View generated state files based on test case ID and action
- **Validation Timer**: 1-minute countdown timer for validation processes
- **Multi-tab Support**: Open new forms in separate windows

## 🏗️ Architecture

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and enhanced developer experience
- **shadcn/ui**: Professional UI component library
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Recharts**: Data visualization for dashboard analytics
- **TanStack Query**: Efficient data fetching and caching

### Backend
- **Express.js**: Fast and minimal web framework
- **TypeScript**: Type-safe server-side development
- **In-memory Storage**: Efficient data management with persistence options
- **File System Integration**: JSON file operations and Python script execution
- **RESTful APIs**: Clean and well-structured API endpoints

## 📋 Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- Modern web browser with JavaScript enabled

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd duke-energy-json-creator

# Install Node.js dependencies
npm install

# Install cross-env for Windows compatibility
npm install cross-env --save-dev
```

### 2. Environment Setup
Create a `.env` file in the root directory (optional):
```bash
NODE_ENV=development
PORT=5000
```

### 3. Development Mode
Start the development server with hot reloading:
```bash
npm run dev
```
- **Port**: 5000 (default)
- **URL**: http://0.0.0.0:5000
- **Features**: Hot reloading, development optimizations

### 4. Production Mode
Build and run the production version:
```bash
# Build the application
npm run build

# Start production server
npm start
```
- **Port**: 3000 (default, configurable via PORT env var)
- **URL**: http://0.0.0.0:3000
- **Features**: Optimized bundles, static file serving

## 🔧 Port Configuration

### Development vs Production Ports
- **Development**: Port 5000 (with Vite HMR)
- **Production**: Port 3000 (serving static files)
- **Custom Port**: Set `PORT` environment variable

### Replit Deployment
When deploying on Replit:
- Port 5000 is automatically forwarded to external port 80/443
- Use `0.0.0.0` as host for external accessibility
- Production builds run on port 3000 internally

### Port Troubleshooting
If you encounter `EADDRINUSE` errors:
1. **Stop running processes**: Kill any existing dev servers
2. **Check port usage**: `lsof -i :5000` (Unix) or `netstat -ano | findstr :5000` (Windows)
3. **Use different port**: Set `PORT=3001` environment variable

## 📁 Project Structure

```
duke-energy-json-creator/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility libraries
├── server/                 # Express.js backend
│   ├── index.ts           # Main server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # In-memory data storage
│   └── vite.ts            # Vite development server setup
├── shared/                 # Shared TypeScript schemas
├── src/common/utils/       # Python utilities
│   ├── execution_lambda.py    # Individual test execution
│   └── validation/
│       └── process_validation.py  # Bulk validation processing
├── test_configs/            # Generated test configuration files
├── test_execution_state/   # Test execution state files
│   ├── create_validation/  # CREATE operation results
│   ├── update_validation/  # UPDATE operation results
│   └── delete_validation/  # DELETE operation results
├── dist/                   # Production build output
│   ├── public/            # Static frontend assets
│   └── index.js           # Bundled server code
└── validation.csv         # Historical validation results
```

## 🚀 Usage Guide

### 1. JSON Builder
- Navigate to the main builder interface
- Fill in test case details (ID, description, action)
- Add features with validation rules
- Preview JSON in real-time
- Save configurations for later use

### 2. Dashboard Analytics
- View comprehensive test execution statistics
- Filter by domain (gas, electric, land)
- Monitor success/failure rates
- Export validation reports

### 3. File Browser
- Browse generated state files
- Preview JSON execution results
- Search and filter files by type

### 4. Python Integration
- Execute individual test cases via "Execute Lambda"
- Run bulk validation via "Validate Features"
- Monitor execution progress and results

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use 127.0.0.1:5000
```
**Solution**: Stop the development server before running production:
```bash
# Kill existing processes on port 5000
killall node  # Unix
# Or find and kill specific process ID
```

#### Build Failures
```bash
npm run build
```
**Common causes**:
- TypeScript compilation errors
- Missing dependencies
- File permission issues

#### Python Script Errors
**Requirements**:
- Python 3.8+ installed
- Required Python packages available
- Proper file permissions on script files

### Development Tips

#### Hot Reloading
Development mode includes automatic browser refresh when files change.

#### API Testing
Use browser DevTools Network tab to monitor API requests and responses.

#### Error Logging
Check browser console and server console for detailed error messages.

## 🔐 Security Considerations

### File Access
- File operations restricted to project directory
- Path validation prevents directory traversal attacks
- Read-only access to execution state files

### Environment Variables
- Sensitive data should use environment variables
- Never commit credentials to version control
- Use `.env` files for local development

## 📊 Performance

### Frontend Optimizations
- Component memoization for expensive operations
- TanStack Query for efficient data fetching
- Lazy loading for large datasets

### Backend Optimizations
- File system caching for directory structures
- Process pooling for Python script execution
- Efficient JSON parsing and validation

## 🔄 Deployment

### Replit Deployment
1. Ensure all dependencies are installed
2. Build the production version
3. Configure environment variables if needed
4. Use the "Production" workflow or run manually

### Manual Deployment
```bash
# Complete deployment workflow
npm install
npm run build
npm start
```

## 📝 API Documentation

### Core Endpoints
- `GET /api/validation-csv` - Fetch validation results
- `POST /api/save` - Save JSON configuration
- `POST /api/execute-lambda` - Execute Python validation
- `GET /api/execution-files` - Browse state files

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Install dependencies
4. Make changes with proper TypeScript types
5. Test both development and production builds
6. Submit a pull request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Comprehensive error handling

## 📄 License

This project is proprietary software developed for Duke Energy's internal use.

## 🆘 Support

For technical support or questions:
1. Check this README and CONFIG.md for detailed configuration
2. Review console logs for error details
3. Verify all prerequisites are installed
4. Test with both development and production modes

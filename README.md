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
- **React Query**: Efficient data fetching and caching

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

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd duke-energy-json-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Application**
   ```bash
   npm run dev
   ```
   
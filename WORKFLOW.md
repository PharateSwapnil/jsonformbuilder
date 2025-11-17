
# Duke Energy Data Products Testing - Complete Workflow Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [File Structure & Purpose](#file-structure--purpose)
4. [Component Workflows](#component-workflows)
5. [API Endpoints](#api-endpoints)
6. [Python Script Execution](#python-script-execution)
7. [Data Flow](#data-flow)
8. [User Journey](#user-journey)

---

## 🎯 Project Overview

**Duke Energy Data Products Testing** is a full-stack web application designed for creating, validating, and managing test cases for data products. The application provides a dynamic JSON form builder, execution state monitoring, and comprehensive validation workflows.

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: File-based storage (JSON/CSV)
- **Styling**: Tailwind CSS + shadcn/ui
- **Python**: Validation scripts executed via Node.js spawn

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (React App)                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Dashboard     │  JSON Builder   │      File Browser           │
│   - Analytics   │  - Form Builder │      - State Files         │
│   - Filtering   │  - JSON Editor  │      - Search & Filter     │
│   - Real-time   │  - Validation   │      - Content Preview     │
└─────────────────┴─────────────────┴─────────────────────────────┘
                           │
                    ┌─────────────┐
                    │  HTTP API   │
                    │ (port 5000) │
                    └─────────────┘
                           │
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Express.js)                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│    Routes       │   Storage       │    Python Execution        │
│  - REST API     │ - File System   │  - spawn() process          │
│  - Validation   │ - JSON/CSV      │  - Lambda execution         │
│  - File Ops     │ - State mgmt    │  - Validation scripts       │
└─────────────────┴─────────────────┴─────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────┐
│                 FILE SYSTEM STORAGE                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  test_configs/  │test_execution_  │     validation.csv          │
│  - *.json       │state/           │  - Historical results       │
│  - Test configs │- create_valid/  │  - Dashboard analytics      │
│                 │- update_valid/  │                             │
│                 │- delete_valid/  │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────┐
│                 PYTHON SCRIPTS                                 │
├─────────────────┬─────────────────────────────────────────────┤
│execution_lambda │    process_validation.py                   │
│.py              │    - Validates test cases                  │
│- Test execution │    - Updates validation.csv                │
│- State generation│    - Generates state files                │
└─────────────────┴─────────────────────────────────────────────┘
```

---

## 📁 File Structure & Purpose

### Frontend Files (`client/src/`)

#### **Pages**
| File | Purpose | Key Features |
|------|---------|--------------|
| `dashboard.tsx` | Main analytics dashboard | - Real-time data visualization<br>- Advanced filtering<br>- Pagination<br>- Auto-refresh (2min intervals) |
| `json-builder.tsx` | Main builder interface | - Layout management<br>- Component orchestration<br>- State coordination |
| `not-found.tsx` | 404 error page | - User-friendly error handling |

#### **Components**
| File | Purpose | Key Features |
|------|---------|--------------|
| `form-builder.tsx` | Dynamic form creation | - Multi-feature forms<br>- Validation rules<br>- Searchable dropdowns<br>- Real-time suggestions |
| `json-editor.tsx` | JSON preview/edit | - CodeMirror integration<br>- Syntax highlighting<br>- Format validation |
| `file-browser.tsx` | State file explorer | - Directory navigation<br>- File search & filter<br>- Content preview<br>- Tab organization |
| `action-sidebar.tsx` | Action controls | - Workflow triggers<br>- File operations<br>- Validation controls |
| `header.tsx` | Navigation | - Route management<br>- Theme toggle |

#### **Hooks**
| File | Purpose | Functionality |
|------|---------|---------------|
| `use-json-form.ts` | Form state management | - Form data persistence<br>- Local storage integration<br>- State synchronization |
| `use-toast.ts` | Notification system | - Success/error messages<br>- User feedback |
| `use-mobile.tsx` | Responsive utilities | - Mobile detection<br>- Adaptive layouts |

#### **Utilities**
| File | Purpose | Functions |
|------|---------|-----------|
| `json-utils.ts` | JSON operations | - Validation<br>- Formatting<br>- Schema compliance |
| `utils.ts` | Common utilities | - API requests<br>- Helper functions |
| `queryClient.ts` | React Query config | - Cache management<br>- Auto-refresh setup |

### Backend Files (`server/`)

| File | Purpose | Key Responsibilities |
|------|---------|---------------------|
| `index.ts` | Server entry point | - Express app setup<br>- Middleware configuration<br>- Error handling<br>- Port binding (5000) |
| `routes.ts` | API endpoints | - 20+ REST endpoints<br>- File operations<br>- Python script execution<br>- Database simulation |
| `storage.ts` | Data persistence | - File system operations<br>- Mock database functions<br>- CRUD operations |
| `vite.ts` | Development server | - Hot reload<br>- Static file serving<br>- Development middleware |

### Python Scripts (`src/common/utils/`)

| File | Purpose | Current State | Intended Function |
|------|---------|---------------|-------------------|
| `execution_lambda.py` | Test execution | Simplified (prints "hello world") | - Process test configurations<br>- Generate execution states<br>- Create state.json files |
| `validation/process_validation.py` | Feature validation | Simplified (prints "hello world") | - Validate test cases<br>- Update validation.csv<br>- Generate validation reports |

### Configuration Files

| File | Purpose | Contents |
|------|---------|----------|
| `shared/schema.ts` | Data validation | - Zod schemas<br>- Type definitions<br>- Validation rules |
| `CONFIG.md` | Project documentation | - Architecture details<br>- Component specifications |
| `featureOptions.json` | Domain configurations | - Gas, Electric, Land features<br>- Dropdown options |

---

## 🔄 Component Workflows

### 1. Dashboard Workflow
```
User visits Dashboard → API fetches validation.csv → Data processed → 
Filters applied → Charts rendered → Auto-refresh (2min) → Repeat
```

**Key Operations:**
- **Data Fetching**: `GET /api/validation-csv` every 2 minutes
- **Filtering**: Real-time client-side filtering by domain, stage, status, date
- **Pagination**: 10 items per page
- **Analytics**: Success rates, test counts by stage

### 2. Form Builder Workflow
```
User opens Form → Load template/blank → Fill form fields → 
Real-time validation → Generate JSON → Save configuration → 
Execute validation → View results
```

**Key Operations:**
- **Form Management**: Dynamic feature addition/removal
- **Validation**: Schema-based validation using Zod
- **Suggestions**: Auto-load test case suggestions
- **Search**: Feature dropdown with search capability

### 3. File Browser Workflow
```
User opens Browser → Fetch file structure → Organize by validation type → 
Apply search filter → Select file → Preview content → Download/view
```

**Key Operations:**
- **File Organization**: Separate tabs for CREATE/UPDATE/DELETE
- **Search**: Real-time filtering by filename/path
- **Preview**: JSON syntax highlighting
- **Navigation**: Directory tree with expand/collapse

---

## 🌐 API Endpoints

### Test Case Management
| Endpoint | Method | Purpose | Request/Response |
|----------|--------|---------|------------------|
| `/api/test-cases` | GET | List all test cases | Returns: `TestCase[]` |
| `/api/test-cases/:id` | GET | Get specific test case | Returns: `TestCase` |
| `/api/test-cases` | POST | Create new test case | Body: `InsertTestCase`, Returns: `TestCase` |
| `/api/test-cases/:id` | PUT | Update test case | Body: `Partial<InsertTestCase>` |
| `/api/test-cases/:id` | DELETE | Delete test case | Returns: `204 No Content` |

### File Operations
| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/save` | POST | Save JSON configuration | Body: JSON data |
| `/api/upload-json` | POST | Validate uploaded JSON | Body: `{jsonData}` |
| `/api/load-template` | GET | Load blank template | Returns: Default structure |
| `/api/execution-files` | GET | Get file structure | Returns: Directory tree |
| `/api/execution-files/content` | GET | Get file content | Query: `path` |

### Python Script Execution
| Endpoint | Method | Purpose | Execution Details |
|----------|--------|---------|-------------------|
| `/api/execute-lambda` | POST | Run test execution | Executes: `execution_lambda.py` |
| `/api/validate-features` | POST | Run validation | Executes: `process_validation.py` |

### Data Retrieval
| Endpoint | Method | Purpose | Data Source |
|----------|--------|---------|-------------|
| `/api/validation-csv` | GET | Get validation results | `validation.csv` or mock data |
| `/api/dashboard-stats` | GET | Get analytics | Computed from validation results |
| `/api/state-json/:testCaseId/:action` | GET | Get state file | `test_execution_state/{action}_validation/` |

---

## 🐍 Python Script Execution

### Current Implementation
The application executes Python scripts through Node.js using the `spawn` function:

```typescript
async function executeScript(scriptPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn("python3", [scriptPath]);
    let output = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || `Process exited with code ${code}`));
      }
    });
  });
}
```

### Script Purposes

#### `execution_lambda.py`
**Intended Purpose:**
- Process test case configurations
- Execute validation logic
- Generate state files in `test_execution_state/`
- Return execution results

**Current State:** Simplified - only prints "hello world"

#### `process_validation.py`
**Intended Purpose:**
- Validate test case features
- Update `validation.csv` with results
- Generate comprehensive validation reports
- Handle database connections and SQL queries

**Current State:** Simplified - only prints "hello world"

### Execution Triggers
1. **Manual Execution**: "Execute Lambda" button in JSON Builder
2. **Validation Process**: "Validate Features" button (1-minute delay)
3. **Scheduled Tasks**: Could be extended for automated runs

---

## 📊 Data Flow

### 1. Test Case Creation Flow
```
Form Input → Validation → JSON Generation → File Save → 
Python Execution → State File Creation → Dashboard Update
```

### 2. Validation Flow
```
User Trigger → API Call → Python Script → CSV Update → 
Dashboard Refresh → Analytics Update → User Notification
```

### 3. File Management Flow
```
File System → API Endpoints → React Components → 
User Interface → File Operations → State Updates
```

---

## 👤 User Journey

### Scenario 1: Creating a New Test Case
1. **Navigation**: User visits JSON Builder page
2. **Form Setup**: Clicks "New Form" to start fresh
3. **Configuration**: 
   - Enters test case ID and description
   - Selects domain (gas/electric/land)
   - Chooses features from searchable dropdown
   - Adds validation rules with database queries
4. **Generation**: Clicks "Generate JSON" to create configuration
5. **Validation**: Reviews JSON in editor panel
6. **Execution**: Clicks "Execute Lambda" to run test
7. **Results**: Views execution state and results
8. **Monitoring**: Checks dashboard for validation results

### Scenario 2: Monitoring Test Results
1. **Dashboard Access**: User visits Dashboard page
2. **Data Review**: Views test execution statistics
3. **Filtering**: Applies filters by domain, stage, status, date
4. **Analysis**: Reviews success rates and failure patterns
5. **Investigation**: Clicks on failed tests to see error details
6. **Action**: Returns to JSON Builder to modify test cases

### Scenario 3: Browsing Execution States
1. **File Browser**: Opens execution state browser
2. **Navigation**: Switches between CREATE/UPDATE/DELETE tabs
3. **Search**: Uses search to find specific test case files
4. **Preview**: Clicks on files to view execution state
5. **Analysis**: Reviews JSON content for debugging

---

## 🔧 Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# Server runs on port 5000
# Frontend: React + Vite (HMR enabled)
# Backend: Express + tsx (auto-reload)
```

### File Watching
- **Frontend**: Vite watches React components for changes
- **Backend**: tsx watches TypeScript files for changes
- **Hot Reload**: Instant updates without page refresh

### Deployment
- **Production**: Static files served by Express
- **Build Process**: `npm run build` generates optimized bundle
- **Port**: Always runs on 5000 (production ready)

---

## 📈 Performance & Optimization

### Frontend Optimizations
- **React Query**: Intelligent caching and background updates
- **Code Splitting**: Lazy loading of routes and components
- **Memoization**: useMemo for expensive computations
- **Virtual Scrolling**: Efficient rendering of large lists

### Backend Optimizations
- **File Caching**: Reduce file system reads
- **Response Compression**: Gzip for API responses
- **Connection Pooling**: For future database integration
- **Error Handling**: Comprehensive error boundaries

### Data Management
- **Local Storage**: Form state persistence
- **Session Storage**: Temporary filter states
- **File System**: Structured directory organization
- **CSV Processing**: Efficient parsing and filtering

---

## 🚀 Future Enhancements

### Planned Features
1. **Real Database Integration**: Replace file-based storage
2. **Advanced Analytics**: More sophisticated dashboards
3. **User Authentication**: Role-based access control
4. **WebSocket Integration**: Real-time updates
5. **Export Capabilities**: PDF/Excel report generation
6. **Batch Operations**: Multiple test case processing
7. **API Documentation**: Swagger/OpenAPI integration
8. **Testing Suite**: Comprehensive unit/integration tests

### Technical Debt
1. **Python Scripts**: Currently simplified, need full implementation
2. **Error Handling**: More robust error boundaries
3. **Validation**: Enhanced schema validation
4. **Performance**: Optimize large dataset handling
5. **Security**: Input sanitization and CSRF protection

---

## 📝 Summary

This Duke Energy Data Products Testing application represents a comprehensive solution for managing test case configurations, executing validations, and monitoring results. The architecture supports scalable development with clear separation of concerns, robust data flow, and user-friendly interfaces.

The current implementation provides a solid foundation with room for enhancement, particularly in the Python script execution layer and advanced analytics capabilities.

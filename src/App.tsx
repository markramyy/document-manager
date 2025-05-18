import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { AppProvider, useAppContext } from './contexts/AppContext';
import FileUpload from './components/FileUpload';
import FolderManager from './components/FolderManager';
import TagManager from './components/TagManager';
import PermissionManager from './components/PermissionManager';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const AppRoutes: React.FC = () => {
  const { currentUser, selectedFolderId, documentTags, setDocumentTags } = useAppContext();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/upload" replace />}
      />
      <Route
        path="/upload"
        element={
          <FileUpload
            onUploadComplete={(fileId, metadata) => {
              console.log('Upload completed:', {
                fileId,
                metadata,
                folderId: selectedFolderId,
                tags: documentTags
              });
            }}
          />
        }
      />
      <Route
        path="/folders"
        element={
          <FolderManager
            onFolderSelect={(id) => {}}
            selectedFolderId={selectedFolderId}
          />
        }
      />
      <Route
        path="/tags"
        element={
          <TagManager
            onTagsChange={setDocumentTags}
          />
        }
      />
      <Route
        path="/permissions"
        element={
          <PermissionManager
            documentId={selectedFolderId || ''}
            currentUserId={currentUser.id}
          />
        }
      />
      <Route
        path="/login"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

const AppContent: React.FC = () => {
  const { currentUser, handleLogout } = useAppContext();

  if (!currentUser) {
    return null; // Or a login component
  }

  return (
    <MainLayout currentUser={currentUser} onLogout={handleLogout}>
      <AppRoutes />
    </MainLayout>
  );
};

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        {children}
      </AppProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;

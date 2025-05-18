import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tag } from '../utils/tagManagement';
import { User, initializePermissions } from '../utils/permissionManagement';

export interface Document {
  id: string;
  title: string;
  description: string;
  tags: Tag[];
  folderId: string | null;
}

interface AppContextType {
  currentUser: User | null;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  documentTags: Tag[];
  setDocumentTags: (tags: Tag[]) => void;
  handleLogout: () => void;
  documents: Document[];
  addDocument: (doc: Document) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [documentTags, setDocumentTags] = useState<Tag[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    // Initialize permissions and get the admin user
    initializePermissions();
    // For demo purposes, we'll use the first admin user as the current user
    // In a real app, this would come from authentication
    const adminUser: User = {
      id: 'admin',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin'
    };
    setCurrentUser(adminUser);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    // In a real app, you would also clear any auth tokens, etc.
  }, []);

  const addDocument = useCallback((doc: Document) => {
    setDocuments(prev => [...prev, doc]);
  }, []);

  const value = {
    currentUser,
    selectedFolderId,
    setSelectedFolderId,
    documentTags,
    setDocumentTags,
    handleLogout,
    documents,
    addDocument
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
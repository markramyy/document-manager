import { v4 as uuidv4 } from 'uuid';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  path: string[];
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderInput {
  id: string;
  name?: string;
  parentId?: string | null;
}

export interface FolderError {
  type: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'DUPLICATE_NAME' | 'INVALID_OPERATION';
  message: string;
  details?: any;
}

// In-memory storage for folders (replace with actual backend storage later)
let folders: Folder[] = [];

export const createFolder = (input: CreateFolderInput): Folder | FolderError => {
  try {
    // Validate folder name
    if (!input.name.trim()) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Folder name cannot be empty'
      };
    }

    // Check for duplicate names in the same parent folder
    const existingFolder = folders.find(
      f => f.name.toLowerCase() === input.name.toLowerCase() &&
           f.parentId === (input.parentId || null)
    );

    if (existingFolder) {
      return {
        type: 'DUPLICATE_NAME',
        message: 'A folder with this name already exists in this location'
      };
    }

    // Get parent folder if parentId is provided
    let parentFolder: Folder | undefined;
    let path: string[] = [];

    if (input.parentId) {
      parentFolder = folders.find(f => f.id === input.parentId);
      if (!parentFolder) {
        return {
          type: 'NOT_FOUND',
          message: 'Parent folder not found'
        };
      }
      path = [...parentFolder.path, parentFolder.name];
    }

    const newFolder: Folder = {
      id: uuidv4(),
      name: input.name.trim(),
      parentId: input.parentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      path
    };

    folders.push(newFolder);
    return newFolder;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to create folder',
      details: error
    };
  }
};

export const updateFolder = (input: UpdateFolderInput): Folder | FolderError => {
    try {
        const folderIndex = folders.findIndex(f => f.id === input.id);
        if (folderIndex === -1) {
            return {
                type: 'NOT_FOUND',
                message: 'Folder not found'
            };
        }

        const folder = folders[folderIndex];

        // Check for duplicate names if name is being updated
        if (input.name !== undefined && input.name !== folder.name) {
            const existingFolder = folders.find(
                f => f.name.toLowerCase() === input.name!.toLowerCase() &&
                    f.parentId === (input.parentId ?? folder.parentId) &&
                    f.id !== folder.id
            );

            if (existingFolder) {
                return {
                type: 'DUPLICATE_NAME',
                message: 'A folder with this name already exists in this location'
                };
            }
        }

        // Update folder properties
        const updatedFolder: Folder = {
            ...folder,
            name: input.name ?? folder.name,
            parentId: input.parentId ?? folder.parentId,
            updatedAt: new Date()
            };

            // Update path if parent changed
            if (input.parentId !== undefined && input.parentId !== folder.parentId) {
            if (input.parentId === null) {
                updatedFolder.path = [];
            } else {
                const parentFolder = folders.find(f => f.id === input.parentId);
                if (!parentFolder) {
                return {
                    type: 'NOT_FOUND',
                    message: 'Parent folder not found'
                };
                }
                updatedFolder.path = [...parentFolder.path, parentFolder.name];
            }
        }

        folders[folderIndex] = updatedFolder;
        return updatedFolder;
    } catch (error) {
        return {
            type: 'INVALID_OPERATION',
            message: 'Failed to update folder',
            details: error
        };
    }
};

export const deleteFolder = (folderId: string): boolean | FolderError => {
    try {
        const folderIndex = folders.findIndex(f => f.id === folderId);
        if (folderIndex === -1) {
        return {
            type: 'NOT_FOUND',
            message: 'Folder not found'
        };
        }

        // Check if folder has children
        const hasChildren = folders.some(f => f.parentId === folderId);
        if (hasChildren) {
        return {
            type: 'INVALID_OPERATION',
            message: 'Cannot delete folder that contains other folders'
        };
        }

        folders = folders.filter(f => f.id !== folderId);
        return true;
    } catch (error) {
        return {
        type: 'INVALID_OPERATION',
        message: 'Failed to delete folder',
        details: error
        };
    }
};

export const getFolder = (folderId: string): Folder | FolderError => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
        return {
        type: 'NOT_FOUND',
        message: 'Folder not found'
        };
    }
    return folder;
};

export const getFolderChildren = (parentId: string | null): Folder[] => {
    return folders.filter(f => f.parentId === parentId);
};

export const getFolderPath = (folderId: string): Folder[] | FolderError => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
        return {
        type: 'NOT_FOUND',
        message: 'Folder not found'
        };
    }

    const path: Folder[] = [];
    const getFolderById = (id: string) => folders.find(f => f.id === id);
    let currentId = folderId;

    while (currentId) {
        const currentFolder = getFolderById(currentId);
        if (!currentFolder) break;

        path.unshift(currentFolder);
        currentId = currentFolder.parentId || '';
    }

    return path;
};

export const getBreadcrumbPath = (folderId: string | null): string[] | FolderError => {
    if (!folderId) {
        return ['Root'];
    }

    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
        return {
        type: 'NOT_FOUND',
        message: 'Folder not found'
        };
    }

    const path: Folder[] = [];
    const getFolderById = (id: string) => folders.find(f => f.id === id);
    let currentId = folderId;

    while (currentId) {
        const currentFolder = getFolderById(currentId);
        if (!currentFolder) break;

        path.unshift(currentFolder);
        currentId = currentFolder.parentId || '';
    }

    return path.map(folder => folder.name);
};

// Initialize with a root folder
export const initializeFolders = () => {
    if (folders.length === 0) {
        createFolder({ name: 'Root', parentId: null });
    }
};

export const getAllFolders = (): Folder[] => {
  return folders;
};

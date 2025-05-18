import { v4 as uuidv4 } from 'uuid';

export type PermissionLevel = 'view' | 'edit' | 'download' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[]; // User IDs
}

export interface Permission {
  id: string;
  documentId: string;
  granteeId: string; // User or Group ID
  granteeType: 'user' | 'group';
  level: PermissionLevel;
  grantedBy: string; // User ID
  grantedAt: Date;
  updatedAt: Date;
}

export interface PermissionError {
  type: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INVALID_OPERATION' | 'UNAUTHORIZED';
  message: string;
  details?: any;
}

// In-memory storage (replace with actual backend storage later)
let users: User[] = [];
let groups: Group[] = [];
let permissions: Permission[] = [];

// Helper function to check if a user has a specific permission level
const hasPermissionLevel = (userLevel: PermissionLevel, requiredLevel: PermissionLevel): boolean => {
  const levels: PermissionLevel[] = ['view', 'edit', 'download', 'admin'];
  return levels.indexOf(userLevel) >= levels.indexOf(requiredLevel);
};

// Helper function to get all permissions for a document
const getDocumentPermissions = (documentId: string): Permission[] => {
  return permissions.filter(p => p.documentId === documentId);
};

// Helper function to get all permissions for a user (including group permissions)
const getUserPermissions = (userId: string): Permission[] => {
  const userGroups = groups.filter(g => g.members.includes(userId));
  const groupIds = userGroups.map(g => g.id);

  return permissions.filter(p =>
    (p.granteeType === 'user' && p.granteeId === userId) ||
    (p.granteeType === 'group' && groupIds.includes(p.granteeId))
  );
};

export const createUser = (name: string, email: string, role: 'user' | 'admin' = 'user'): User | PermissionError => {
  try {
    if (!name.trim() || !email.trim()) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Name and email are required'
      };
    }

    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return {
        type: 'INVALID_OPERATION',
        message: 'User with this email already exists'
      };
    }

    const newUser: User = {
      id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role
    };

    users.push(newUser);
    return newUser;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to create user',
      details: error
    };
  }
};

export const createGroup = (name: string, description?: string): Group | PermissionError => {
  try {
    if (!name.trim()) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Group name is required'
      };
    }

    const existingGroup = groups.find(g => g.name.toLowerCase() === name.toLowerCase());
    if (existingGroup) {
      return {
        type: 'INVALID_OPERATION',
        message: 'Group with this name already exists'
      };
    }

    const newGroup: Group = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim(),
      members: []
    };

    groups.push(newGroup);
    return newGroup;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to create group',
      details: error
    };
  }
};

export const addUserToGroup = (userId: string, groupId: string): boolean | PermissionError => {
  try {
    const user = users.find(u => u.id === userId);
    if (!user) {
      return {
        type: 'NOT_FOUND',
        message: 'User not found'
      };
    }

    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return {
        type: 'NOT_FOUND',
        message: 'Group not found'
      };
    }

    if (groups[groupIndex].members.includes(userId)) {
      return {
        type: 'INVALID_OPERATION',
        message: 'User is already a member of this group'
      };
    }

    groups[groupIndex].members.push(userId);
    return true;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to add user to group',
      details: error
    };
  }
};

export const removeUserFromGroup = (userId: string, groupId: string): boolean | PermissionError => {
  try {
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return {
        type: 'NOT_FOUND',
        message: 'Group not found'
      };
    }

    const memberIndex = groups[groupIndex].members.indexOf(userId);
    if (memberIndex === -1) {
      return {
        type: 'NOT_FOUND',
        message: 'User is not a member of this group'
      };
    }

    groups[groupIndex].members.splice(memberIndex, 1);
    return true;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to remove user from group',
      details: error
    };
  }
};

export const grantPermission = (
  documentId: string,
  granteeId: string,
  granteeType: 'user' | 'group',
  level: PermissionLevel,
  grantedBy: string
): Permission | PermissionError => {
  try {
    // Validate grantee exists
    if (granteeType === 'user' && !users.find(u => u.id === granteeId)) {
      return {
        type: 'NOT_FOUND',
        message: 'User not found'
      };
    }
    if (granteeType === 'group' && !groups.find(g => g.id === granteeId)) {
      return {
        type: 'NOT_FOUND',
        message: 'Group not found'
      };
    }

    // Check if permission already exists
    const existingPermission = permissions.find(
      p => p.documentId === documentId &&
           p.granteeId === granteeId &&
           p.granteeType === granteeType
    );

    if (existingPermission) {
      // Update existing permission
      existingPermission.level = level;
      existingPermission.updatedAt = new Date();
      return existingPermission;
    }

    // Create new permission
    const newPermission: Permission = {
      id: uuidv4(),
      documentId,
      granteeId,
      granteeType,
      level,
      grantedBy,
      grantedAt: new Date(),
      updatedAt: new Date()
    };

    permissions.push(newPermission);
    return newPermission;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to grant permission',
      details: error
    };
  }
};

export const revokePermission = (
  documentId: string,
  granteeId: string,
  granteeType: 'user' | 'group'
): boolean | PermissionError => {
  try {
    const permissionIndex = permissions.findIndex(
      p => p.documentId === documentId &&
           p.granteeId === granteeId &&
           p.granteeType === granteeType
    );

    if (permissionIndex === -1) {
      return {
        type: 'NOT_FOUND',
        message: 'Permission not found'
      };
    }

    permissions.splice(permissionIndex, 1);
    return true;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to revoke permission',
      details: error
    };
  }
};

export const checkPermission = (
  documentId: string,
  userId: string,
  requiredLevel: PermissionLevel
): boolean => {
  // Admin users have all permissions
  const user = users.find(u => u.id === userId);
  if (user?.role === 'admin') return true;

  // Get all permissions for the user (including group permissions)
  const userPermissions = getUserPermissions(userId);

  // Find the highest permission level for this document
  const documentPermissions = userPermissions.filter(p => p.documentId === documentId);
  if (documentPermissions.length === 0) return false;

  const highestLevel = documentPermissions.reduce((highest, current) => {
    return hasPermissionLevel(current.level, highest) ? current.level : highest;
  }, 'view' as PermissionLevel);

  return hasPermissionLevel(highestLevel, requiredLevel);
};

export const getDocumentAccessList = (documentId: string): {
  users: { user: User; permission: Permission }[];
  groups: { group: Group; permission: Permission }[];
} => {
  const documentPermissions = getDocumentPermissions(documentId);

  return {
    users: documentPermissions
      .filter(p => p.granteeType === 'user')
      .map(p => ({
        user: users.find(u => u.id === p.granteeId)!,
        permission: p
      })),
    groups: documentPermissions
      .filter(p => p.granteeType === 'group')
      .map(p => ({
        group: groups.find(g => g.id === p.granteeId)!,
        permission: p
      }))
  };
};

// Initialize with an admin user
export const initializePermissions = () => {
  if (users.length === 0) {
    createUser('Admin', 'admin@example.com', 'admin');
  }
};

export const getAllUsers = (): User[] => users;
export const getAllGroups = (): Group[] => groups;
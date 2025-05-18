import { v4 as uuidv4 } from 'uuid';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentTag {
  documentId: string;
  tagId: string;
}

export interface TagError {
  type: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'DUPLICATE_NAME' | 'INVALID_OPERATION';
  message: string;
  details?: any;
}

// In-memory storage (replace with actual backend storage later)
let tags: Tag[] = [];
let documentTags: DocumentTag[] = [];

export const createTag = (name: string, color?: string): Tag | TagError => {
  try {
    // Validate tag name
    if (!name.trim()) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Tag name cannot be empty'
      };
    }

    // Check for duplicate names
    const existingTag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
      return {
        type: 'DUPLICATE_NAME',
        message: 'A tag with this name already exists'
      };
    }

    const newTag: Tag = {
      id: uuidv4(),
      name: name.trim(),
      color,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    tags.push(newTag);
    return newTag;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to create tag',
      details: error
    };
  }
};

export const updateTag = (id: string, name: string, color?: string): Tag | TagError => {
  try {
    const tagIndex = tags.findIndex(t => t.id === id);
    if (tagIndex === -1) {
      return {
        type: 'NOT_FOUND',
        message: 'Tag not found'
      };
    }

    // Check for duplicate names
    if (name !== tags[tagIndex].name) {
      const existingTag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existingTag) {
        return {
          type: 'DUPLICATE_NAME',
          message: 'A tag with this name already exists'
        };
      }
    }

    const updatedTag: Tag = {
      ...tags[tagIndex],
      name: name.trim(),
      color,
      updatedAt: new Date()
    };

    tags[tagIndex] = updatedTag;
    return updatedTag;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to update tag',
      details: error
    };
  }
};

export const deleteTag = (id: string): boolean | TagError => {
  try {
    const tagIndex = tags.findIndex(t => t.id === id);
    if (tagIndex === -1) {
      return {
        type: 'NOT_FOUND',
        message: 'Tag not found'
      };
    }

    // Remove tag from all documents
    documentTags = documentTags.filter(dt => dt.tagId !== id);
    tags = tags.filter(t => t.id !== id);
    return true;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to delete tag',
      details: error
    };
  }
};

export const getTag = (id: string): Tag | TagError => {
  const tag = tags.find(t => t.id === id);
  if (!tag) {
    return {
      type: 'NOT_FOUND',
      message: 'Tag not found'
    };
  }
  return tag;
};

export const getAllTags = (): Tag[] => {
  return [...tags];
};

export const addTagToDocument = (documentId: string, tagId: string): boolean | TagError => {
  try {
    // Check if tag exists
    const tag = tags.find(t => t.id === tagId);
    if (!tag) {
      return {
        type: 'NOT_FOUND',
        message: 'Tag not found'
      };
    }

    // Check if document already has this tag
    const existingTag = documentTags.find(
      dt => dt.documentId === documentId && dt.tagId === tagId
    );
    if (existingTag) {
      return {
        type: 'DUPLICATE_NAME',
        message: 'Document already has this tag'
      };
    }

    documentTags.push({ documentId, tagId });
    return true;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to add tag to document',
      details: error
    };
  }
};

export const removeTagFromDocument = (documentId: string, tagId: string): boolean | TagError => {
  try {
    const tagIndex = documentTags.findIndex(
      dt => dt.documentId === documentId && dt.tagId === tagId
    );
    if (tagIndex === -1) {
      return {
        type: 'NOT_FOUND',
        message: 'Tag not found on document'
      };
    }

    documentTags = documentTags.filter(
      dt => !(dt.documentId === documentId && dt.tagId === tagId)
    );
    return true;
  } catch (error) {
    return {
      type: 'INVALID_OPERATION',
      message: 'Failed to remove tag from document',
      details: error
    };
  }
};

export const getDocumentTags = (documentId: string): Tag[] => {
  const documentTagIds = documentTags
    .filter(dt => dt.documentId === documentId)
    .map(dt => dt.tagId);
  return tags.filter(tag => documentTagIds.includes(tag.id));
};

export const getDocumentsByTag = (tagId: string): string[] => {
  return documentTags
    .filter(dt => dt.tagId === tagId)
    .map(dt => dt.documentId);
};
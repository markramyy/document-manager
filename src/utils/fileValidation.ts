// File type definitions
export interface FileTypeDefinition {
  mimeType: string;
  extension: string;
  maxSize: number; // in bytes
  description: string;
}

// Supported file types with their configurations
export const SUPPORTED_FILE_TYPES: FileTypeDefinition[] = [
  {
    mimeType: 'application/pdf',
    extension: '.pdf',
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'PDF Document'
  },
  {
    mimeType: 'application/msword',
    extension: '.doc',
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Word Document (DOC)'
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Word Document (DOCX)'
  },
  {
    mimeType: 'application/vnd.ms-excel',
    extension: '.xls',
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Excel Spreadsheet (XLS)'
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Excel Spreadsheet (XLSX)'
  }
];

// Validation error types
export enum ValidationErrorType {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  EMPTY_FILE = 'EMPTY_FILE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  details?: {
    fileType?: string;
    maxSize?: number;
    actualSize?: number;
  };
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: ValidationError;
  fileType?: FileTypeDefinition;
}

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Main validation function
export const validateFile = (file: File): ValidationResult => {
  try {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: {
          type: ValidationErrorType.EMPTY_FILE,
          message: 'No file provided'
        }
      };
    }

    // Get file extension
    const extension = getFileExtension(file.name);

    // Find matching file type definition
    const fileType = SUPPORTED_FILE_TYPES.find(
      type => type.mimeType === file.type || type.extension === `.${extension}`
    );

    // Check if file type is supported
    if (!fileType) {
      return {
        isValid: false,
        error: {
          type: ValidationErrorType.INVALID_FILE_TYPE,
          message: 'Unsupported file type',
          details: {
            fileType: file.type
          }
        }
      };
    }

    // Check file size
    if (file.size > fileType.maxSize) {
      return {
        isValid: false,
        error: {
          type: ValidationErrorType.FILE_TOO_LARGE,
          message: `File size exceeds the maximum allowed size of ${formatFileSize(fileType.maxSize)}`,
          details: {
            maxSize: fileType.maxSize,
            actualSize: file.size
          }
        }
      };
    }

    // File is valid
    return {
      isValid: true,
      fileType
    };
  } catch (error) {
    return {
      isValid: false,
      error: {
        type: ValidationErrorType.UNKNOWN_ERROR,
        message: 'An unexpected error occurred during file validation',
        details: {
          fileType: file?.type
        }
      }
    };
  }
};

// Helper function to get supported file extensions for input accept attribute
export const getSupportedFileExtensions = (): string => {
  return SUPPORTED_FILE_TYPES
    .map(type => type.extension)
    .join(',');
};

// Helper function to get supported file types description
export const getSupportedFileTypesDescription = (): string => {
  return SUPPORTED_FILE_TYPES
    .map(type => `${type.description} (${type.extension})`)
    .join(', ');
};

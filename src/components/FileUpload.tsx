import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Fade,
  LinearProgress,
  Breadcrumbs,
  Link,
  alpha,
  useTheme,
  MenuItem,
  Avatar,
  Grow
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { Tag } from '../utils/tagManagement';
import TagManager from './TagManager';
import { useAppContext } from '../contexts/AppContext';
import { getBreadcrumbPath, getFolderChildren, getAllFolders } from '../utils/folderManagement';
import {
  validateFile,
  formatFileSize,
  getSupportedFileExtensions,
  getSupportedFileTypesDescription,
  FileTypeDefinition
} from '../utils/fileValidation';

// Animations
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Styled components
const UploadBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderColor: theme.palette.primary.dark,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(45deg,
      ${alpha(theme.palette.primary.main, 0.1)},
      ${alpha(theme.palette.secondary.main, 0.1)})`,
    backgroundSize: '200% 200%',
    animation: `${gradientAnimation} 3s ease infinite`,
    zIndex: 0,
  }
}));

const UploadIcon = styled(CloudUploadIcon)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
  animation: `${pulseAnimation} 2s infinite ease-in-out`,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
      }
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: 2,
      }
    }
  }
}));

const UploadButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  textTransform: 'none',
  fontSize: '1.1rem',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  }
}));

const FileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  marginBottom: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)}, ${alpha(theme.palette.secondary.light, 0.08)})`,
}));

interface FileMetadata {
  title: string;
  description: string;
  tags: Tag[];
}

interface FileUploadProps {
  onUploadComplete: (fileId: string, metadata: {
    title: string;
    description: string;
    tags: Tag[];
  }) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const theme = useTheme();
  const { selectedFolderId, setSelectedFolderId, addDocument } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileTypeDefinition | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata>({
    title: '',
    description: '',
    tags: []
  });
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Get all folders for dropdown
  const allFolders = getAllFolders();

  const breadcrumbPathResult = selectedFolderId ? getBreadcrumbPath(selectedFolderId) : ['Root'];
  const breadcrumbPath = 'type' in breadcrumbPathResult ? ['Root'] : breadcrumbPathResult;

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setSelectedFolderId(null);
    } else {
      // Find the folder ID at the clicked index
      const folders = getFolderChildren(index === 0 ? null : selectedFolderId);
      const folderName = breadcrumbPath[index];
      const folder = folders.find(f => f.name === folderName);
      if (folder) {
        setSelectedFolderId(folder.id);
      }
    }
  };

  const handleFileValidation = (selectedFile: File) => {
    const validationResult = validateFile(selectedFile);
    if (!validationResult.isValid) {
      setError(validationResult.error?.message || 'Invalid file');
    } else {
      setError(null);
      setFileType(validationResult.fileType || null);
    }
    return validationResult;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validationResult = handleFileValidation(selectedFile);
      if (validationResult.isValid) {
        setFile(selectedFile);
        // Auto-populate title with filename (without extension)
        setMetadata(prev => ({
          ...prev,
          title: selectedFile.name.replace(/\.[^/.]+$/, '')
        }));
      }
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      const validationResult = handleFileValidation(droppedFile);
      if (validationResult.isValid) {
        setFile(droppedFile);
        setMetadata(prev => ({
          ...prev,
          title: droppedFile.name.replace(/\.[^/.]+$/, '')
        }));
      }
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!metadata.title.trim()) {
      setError('Please provide a title for the document');
      return;
    }

    try {
      // Validate file again before upload
      const validationResult = validateFile(file);
      if (!validationResult.isValid) {
        setError(validationResult.error?.message || 'Invalid file');
        return;
      }

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Generate unique identifier for the file
      const fileId = uuidv4();

      // Add document to context
      addDocument({
        id: fileId,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        folderId: selectedFolderId || null,
      });

      if (onUploadComplete) {
        onUploadComplete(fileId, metadata);
      }

      // Reset form
      setFile(null);
      setFileType(null);
      setMetadata({ title: '', description: '', tags: [] });
      setUploadProgress(0);
      setError(null);
    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploadProgress(0);
    }
  };

  const handleTagsChange = (newTags: Tag[]) => {
    setMetadata(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  return (
    <Box sx={{
      maxWidth: 800,
      mx: 'auto',
      p: 3,
      '& > *': {
        animation: 'fadeIn 0.5s ease-in-out'
      }
    }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          textAlign: 'center',
          fontWeight: 600,
          color: 'primary.main',
          mb: 4
        }}
      >
        Upload Document
      </Typography>

      {/* Folder Selection Dropdown */}
      <TextField
        select
        label="Select Folder"
        value={selectedFolderId || ''}
        onChange={e => setSelectedFolderId(e.target.value || null)}
        fullWidth
        sx={{ mb: 3 }}
      >
        {allFolders.map(folder => (
          <MenuItem key={folder.id} value={folder.id}>
            {folder.name}
          </MenuItem>
        ))}
      </TextField>

      {/* Folder Breadcrumb */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Current Folder:
          </Typography>
        </Box>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="folder navigation"
        >
          <Link
            component="button"
            variant="body1"
            onClick={() => handleBreadcrumbClick(-1)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.primary',
              textDecoration: 'none',
              '&:hover': { color: 'primary.main' }
            }}
          >
            Root
          </Link>
          {breadcrumbPath.map((folder, index) => (
            <Link
              key={index}
              component="button"
              variant="body1"
              onClick={() => handleBreadcrumbClick(index)}
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {folder}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>

      <Fade in={true} timeout={500}>
        <UploadBox
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            backgroundColor: isDragging ? 'action.hover' : 'background.default',
            mb: 3,
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <input
            type="file"
            accept={getSupportedFileExtensions()}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <UploadIcon />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                Drag and drop your file here
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                or click to browse files
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  padding: 1,
                  borderRadius: 1,
                  display: 'inline-block'
                }}
              >
                Supported formats: {getSupportedFileTypesDescription()}
              </Typography>
            </Box>
          </label>
        </UploadBox>
      </Fade>

      {file && (
        <Grow in={true} timeout={300}>
          <FileCard>
            <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', mr: 2 }}>
              {file.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {file.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {formatFileSize(file.size)}
                {fileType && ` • ${fileType.description}`}
              </Typography>
            </Box>
          </FileCard>
        </Grow>
      )}

      {error && (
        <Fade in={true} timeout={300}>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: 28
              }
            }}
          >
            {error}
          </Alert>
        </Fade>
      )}

      <StyledTextField
        fullWidth
        label="Title"
        value={metadata.title}
        onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
        margin="normal"
        required
        variant="outlined"
      />

      <StyledTextField
        fullWidth
        label="Description"
        value={metadata.description}
        onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
        margin="normal"
        multiline
        rows={3}
        variant="outlined"
      />

      <Box sx={{ mt: 3, mb: 3 }}>
        <TagManager
          onTagsChange={handleTagsChange}
          selectedTags={metadata.tags}
        />
      </Box>

      {uploadProgress > 0 && (
        <Fade in={true} timeout={300}>
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              sx={{ mt: 1 }}
            >
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        </Fade>
      )}

      <UploadButton
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || uploadProgress > 0 || !selectedFolderId}
        fullWidth
        size="large"
        startIcon={<CloudUploadIcon />}
      >
        {!selectedFolderId
          ? 'Select a folder first'
          : uploadProgress > 0
          ? 'Uploading...'
          : 'Upload Document'}
      </UploadButton>
    </Box>
  );
};

export default FileUpload;
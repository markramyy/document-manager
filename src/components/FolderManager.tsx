import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Fade,
  Alert,
  alpha,
  Avatar,
  Stack,
  Grow
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Folder as FolderIcon,
  CreateNewFolder as CreateFolderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import {
  Folder,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderChildren,
  getBreadcrumbPath,
  initializeFolders
} from '../utils/folderManagement';
import { useAppContext } from '../contexts/AppContext';
import Chip from '@mui/material/Chip';

const FolderContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  boxShadow: theme.shadows[2],
}));

const FolderList = styled(List)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  borderRadius: theme.spacing(1),
}));

const FolderListItem = styled(ListItem)(({ theme }) => ({
  margin: theme.spacing(0.5, 0),
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transform: 'translateX(4px)',
  },
}));

const BreadcrumbContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const DocumentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[3],
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)}, ${alpha(theme.palette.secondary.light, 0.08)})`,
}));

interface FolderManagerProps {
  onFolderSelect?: (folderId: string | null) => void;
  selectedFolderId?: string | null;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  onFolderSelect,
  selectedFolderId = null
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [breadcrumbPath, setBreadcrumbPath] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const { documents } = useAppContext();

  useEffect(() => {
    initializeFolders();
    loadFolders(null);
  }, []);

  useEffect(() => {
    if (currentFolderId) {
      const path = getBreadcrumbPath(currentFolderId);
      if (!('type' in path)) {
        setBreadcrumbPath(path);
      }
    } else {
      setBreadcrumbPath(['Root']);
    }
  }, [currentFolderId]);

  const loadFolders = (parentId: string | null) => {
    const children = getFolderChildren(parentId);
    setFolders(children);
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    loadFolders(folderId);
    if (onFolderSelect) {
      onFolderSelect(folderId);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(null);
      loadFolders(null);
      if (onFolderSelect) {
        onFolderSelect(null);
      }
    } else {
      const path = getBreadcrumbPath(currentFolderId!);
      if (!('type' in path)) {
        const folderId = folders.find(f => f.name === path[index])?.id;
        if (folderId) {
          handleFolderClick(folderId);
        }
      }
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    const result = createFolder({
      name: newFolderName.trim(),
      parentId: currentFolderId
    });

    if ('type' in result) {
      setError(result.message);
    } else {
      setNewFolderName('');
      setIsCreateDialogOpen(false);
      loadFolders(currentFolderId);
    }
  };

  const handleEditFolder = () => {
    if (!editingFolder || !newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    const result = updateFolder({
      id: editingFolder.id,
      name: newFolderName.trim()
    });

    if ('type' in result) {
      setError(result.message);
    } else {
      setNewFolderName('');
      setEditingFolder(null);
      setIsEditDialogOpen(false);
      loadFolders(currentFolderId);
    }
  };

  const handleDeleteFolder = () => {
    if (!deletingFolder) return;

    const result = deleteFolder(deletingFolder.id);
    if (typeof result === 'object' && 'type' in result) {
      setError(result.message);
    } else {
      setDeletingFolder(null);
      setIsDeleteDialogOpen(false);
      loadFolders(currentFolderId);
    }
  };

  const openEditDialog = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (folder: Folder) => {
    setDeletingFolder(folder);
    setIsDeleteDialogOpen(true);
  };

  // After the FolderList, show documents in the current folder
  const docsInFolder = documents.filter(doc => (doc.folderId || null) === (currentFolderId || null));

  return (
    <FolderContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Folders
        </Typography>
        <Tooltip title="Create New Folder">
          <IconButton
            color="primary"
            onClick={() => setIsCreateDialogOpen(true)}
            sx={{ '&:hover': { transform: 'scale(1.1)' } }}
          >
            <CreateFolderIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <BreadcrumbContainer>
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
            <HomeIcon sx={{ mr: 0.5 }} />
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
      </BreadcrumbContainer>

      {error && (
        <Fade in={true}>
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        </Fade>
      )}

      <FolderList>
        {folders.map((folder) => (
          <FolderListItem
            key={folder.id}
            onClick={() => handleFolderClick(folder.id)}
            sx={{
              backgroundColor: selectedFolderId === folder.id
                ? (theme) => alpha(theme.palette.primary.main, 0.1)
                : 'transparent'
            }}
          >
            <ListItemIcon>
              <FolderIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={folder.name}
              secondary={`Created: ${new Date(folder.createdAt).toLocaleDateString()}`}
            />
            <ListItemSecondaryAction>
              <Tooltip title="Edit Folder">
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(folder);
                  }}
                  sx={{ mr: 1, '&:hover': { color: 'primary.main' } }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Folder">
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialog(folder);
                  }}
                  sx={{ '&:hover': { color: 'error.main' } }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </FolderListItem>
        ))}
      </FolderList>

      {/* Show documents in this folder */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>Documents in this folder</Typography>
        {docsInFolder.length === 0 && (
          <Typography color="text.secondary">No documents in this folder.</Typography>
        )}
        <Stack spacing={2}>
          {docsInFolder.map(doc => (
            <Grow in={true} key={doc.id}>
              <DocumentCard>
                <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', mr: 2 }}>
                  {doc.title.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{doc.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {doc.tags.map(tag => (
                      <Chip key={tag.id} label={tag.name} sx={{ backgroundColor: tag.color, color: '#fff', fontWeight: 600 }} />
                    ))}
                  </Box>
                </Box>
              </DocumentCard>
            </Grow>
          ))}
        </Stack>
      </Box>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEditFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditFolder} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Folder</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the folder "{deletingFolder?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteFolder}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </FolderContainer>
  );
};

export default FolderManager;
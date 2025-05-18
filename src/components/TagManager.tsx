import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Fade,
  Alert,
  alpha,
  Autocomplete,
  Chip,
  Stack,
  Avatar,
  Grow
} from '@mui/material';
import {
  Label as LabelIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Tag, createTag, updateTag, deleteTag, getAllTags } from '../utils/tagManagement';
import { styled } from '@mui/material/styles';

interface TagManagerProps {
  onTagsChange?: (tags: Tag[]) => void;
  selectedTags?: Tag[];
}

const TagCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  marginBottom: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)}, ${alpha(theme.palette.secondary.light, 0.08)})`,
}));

const TagManager: React.FC<TagManagerProps> = ({
  onTagsChange,
  selectedTags = []
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#1976d2');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = () => {
    const allTags = getAllTags();
    setTags(allTags);
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      setError('Tag name cannot be empty');
      return;
    }

    const result = createTag(newTagName.trim(), newTagColor);
    if ('type' in result) {
      setError(result.message);
    } else {
      setNewTagName('');
      setNewTagColor('#1976d2');
      setIsCreateDialogOpen(false);
      loadTags();
    }
  };

  const handleEditTag = () => {
    if (!editingTag || !newTagName.trim()) {
      setError('Tag name cannot be empty');
      return;
    }

    const result = updateTag(editingTag.id, newTagName.trim(), newTagColor);
    if ('type' in result) {
      setError(result.message);
    } else {
      setNewTagName('');
      setNewTagColor('#1976d2');
      setEditingTag(null);
      setIsEditDialogOpen(false);
      loadTags();
    }
  };

  const handleDeleteTag = () => {
    if (!deletingTag) return;

    const result = deleteTag(deletingTag.id);
    if (typeof result === 'object' && 'type' in result) {
      setError(result.message);
    } else {
      setDeletingTag(null);
      setIsDeleteDialogOpen(false);
      loadTags();
    }
  };

  const handleTagSelect = (
    event: React.SyntheticEvent,
    value: string | Tag | null,
    reason: string
  ) => {
    if (value && typeof value !== 'string' && onTagsChange) {
      const isAlreadySelected = selectedTags.some(tag => tag.id === value.id);
      if (!isAlreadySelected) {
        onTagsChange([...selectedTags, value]);
      }
    }
  };

  const handleTagCreate = (inputValue: string) => {
    if (inputValue.trim()) {
      const result = createTag(inputValue.trim(), '#1976d2');
      if (!('type' in result)) {
        loadTags();
        if (onTagsChange) {
          onTagsChange([...selectedTags, result]);
        }
      }
    }
  };

  const removeSelectedTag = (tagToRemove: Tag) => {
    if (onTagsChange) {
      onTagsChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Tag Management
          </Typography>
          <Tooltip title="Create New Tag">
            <IconButton
              color="primary"
              onClick={() => setIsCreateDialogOpen(true)}
              sx={{ '&:hover': { transform: 'scale(1.1)' } }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

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

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            Select or Create Tags
          </Typography>
          <Autocomplete
            freeSolo
            options={tags}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option.name
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search or create tags"
                variant="outlined"
                fullWidth
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LabelIcon
                    sx={{
                      mr: 1,
                      color: option.color || 'primary.main',
                    }}
                  />
                  {option.name}
                </Box>
              </li>
            )}
            onChange={handleTagSelect}
            onInputChange={(event, value) => setSearchInput(value)}
            onKeyPress={(event) => {
              if (event.key === 'Enter' && searchInput.trim()) {
                event.preventDefault();
                handleTagCreate(searchInput);
                setSearchInput('');
              }
            }}
          />
        </Box>

        {selectedTags.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Selected Tags
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selectedTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  onDelete={() => removeSelectedTag(tag)}
                  sx={{
                    backgroundColor: alpha(tag.color || '#1976d2', 0.1),
                    color: tag.color || 'primary.main',
                    '& .MuiChip-deleteIcon': {
                      color: tag.color || 'primary.main',
                      '&:hover': {
                        color: 'error.main',
                      },
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Grow in={true} timeout={500}>
          <TagCard>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>Available Tags</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {tags.map(tag => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  avatar={<Avatar sx={{ bgcolor: tag.color || 'primary.main', color: '#fff' }}>{tag.name.charAt(0).toUpperCase()}</Avatar>}
                  sx={{ backgroundColor: alpha(tag.color || '#1976d2', 0.1), color: tag.color || 'primary.main', fontWeight: 600, mb: 1 }}
                />
              ))}
            </Stack>
          </TagCard>
        </Grow>
      </Paper>

      {/* Create Tag Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <DialogTitle>Create New Tag</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            fullWidth
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Tag Color"
            type="color"
            fullWidth
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTag} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit Tag</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            fullWidth
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Tag Color"
            type="color"
            fullWidth
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditTag} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Tag Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the tag "{deletingTag?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTag} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TagManager;
import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Fade,
  Grow,
  Alert,
  alpha,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Stack,
  ListItemIcon
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Delete as DeleteIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Add as AddIcon
} from '@mui/icons-material';
import {
  User,
  Group,
  Permission,
  PermissionLevel,
  createUser,
  createGroup,
  grantPermission,
  revokePermission,
  getDocumentAccessList,
  getAllUsers,
  getAllGroups
} from '../utils/permissionManagement';

const PermissionContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(3),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)}, ${alpha(theme.palette.secondary.light, 0.08)})`,
  boxShadow: theme.shadows[4],
  marginTop: theme.spacing(2),
}));

const SectionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  boxShadow: theme.shadows[2],
  marginBottom: theme.spacing(3),
}));

const PermissionList = styled(List)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
  borderRadius: theme.spacing(1),
}));

const PermissionListItem = styled(ListItem)(({ theme }) => ({
  margin: theme.spacing(0.5, 0),
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s cubic-bezier(.4,2,.6,1)',
  boxShadow: theme.shadows[1],
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'scale(1.01)',
    boxShadow: theme.shadows[3],
  },
}));

const FancyDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

const PermissionChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  textTransform: 'capitalize',
  letterSpacing: 0.5,
  fontSize: '0.95rem',
}));

const getAvatarColor = (name: string) => {
  // Simple hash for color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 60%, 60%)`;
  return color;
};

interface PermissionManagerProps {
  documentId: string;
  currentUserId: string;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({
  documentId,
  currentUserId
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isGrantPermissionDialogOpen, setIsGrantPermissionDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedGrantee, setSelectedGrantee] = useState<User | Group | null>(null);
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState<PermissionLevel>('view');
  const [accessList, setAccessList] = useState<{
    users: { user: User; permission: Permission }[];
    groups: { group: Group; permission: Permission }[];
  }>({ users: [], groups: [] });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);

  const loadAccessList = useCallback(() => {
    const list = getDocumentAccessList(documentId);
    setAccessList(list);
    setAllUsers(getAllUsers());
    setAllGroups(getAllGroups());
  }, [documentId]);

  useEffect(() => {
    loadAccessList();
  }, [loadAccessList, isCreateUserDialogOpen, isCreateGroupDialogOpen]);

  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setError('Name and email are required');
      return;
    }
    const result = createUser(newUserName.trim(), newUserEmail.trim());
    if ('type' in result) {
      setError(result.message);
    } else {
      setNewUserName('');
      setNewUserEmail('');
      setIsCreateUserDialogOpen(false);
      loadAccessList();
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      setError('Group name is required');
      return;
    }
    const result = createGroup(newGroupName.trim(), newGroupDescription.trim());
    if ('type' in result) {
      setError(result.message);
    } else {
      setNewGroupName('');
      setNewGroupDescription('');
      setIsCreateGroupDialogOpen(false);
      loadAccessList();
    }
  };

  const handleGrantPermission = () => {
    if (!selectedGrantee) {
      setError('Please select a user or group');
      return;
    }
    const result = grantPermission(
      documentId,
      selectedGrantee.id,
      'id' in selectedGrantee && 'email' in selectedGrantee ? 'user' : 'group',
      selectedPermissionLevel,
      currentUserId
    );
    if ('type' in result) {
      setError(result.message);
    } else {
      setSelectedGrantee(null);
      setSelectedPermissionLevel('view');
      setIsGrantPermissionDialogOpen(false);
      loadAccessList();
    }
  };

  const handleRevokePermission = (granteeId: string, granteeType: 'user' | 'group') => {
    const result = revokePermission(documentId, granteeId, granteeType);
    if (typeof result === 'object' && 'type' in result) {
      setError(result.message);
    } else if (result === true) {
      loadAccessList();
    }
  };

  const getPermissionColor = (level: PermissionLevel) => {
    switch (level) {
      case 'admin':
        return 'error';
      case 'edit':
        return 'warning';
      case 'download':
        return 'info';
      default:
        return 'success';
    }
  };

  return (
    <PermissionContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1, color: 'primary.main' }}>
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Document Permissions
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Create User">
            <IconButton
              color="primary"
              onClick={() => setIsCreateUserDialogOpen(true)}
              sx={{ boxShadow: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'primary.light' } }}
            >
              <PersonIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Create Group">
            <IconButton
              color="secondary"
              onClick={() => setIsCreateGroupDialogOpen(true)}
              sx={{ boxShadow: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'secondary.light' } }}
            >
              <GroupIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Grant Permission">
            <IconButton
              color="success"
              onClick={() => setIsGrantPermissionDialogOpen(true)}
              sx={{ boxShadow: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'success.light' } }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Stack>
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

      <Grow in={true} timeout={500}>
        <SectionCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
            User Permissions
          </Typography>
          <PermissionList>
            {accessList.users.map(({ user, permission }) => (
              <PermissionListItem key={permission.id}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: getAvatarColor(user.name), color: '#fff' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={user.name}
                  secondary={user.email}
                />
                <PermissionChip
                  label={permission.level}
                  size="small"
                  color={getPermissionColor(permission.level)}
                  sx={{ ml: 1 }}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Revoke Permission">
                    <IconButton
                      edge="end"
                      onClick={() => handleRevokePermission(user.id, 'user')}
                      sx={{ '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </PermissionListItem>
            ))}
          </PermissionList>
        </SectionCard>
      </Grow>

      <Grow in={true} timeout={700}>
        <SectionCard>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'secondary.dark' }}>
            Group Permissions
          </Typography>
          <PermissionList>
            {accessList.groups.map(({ group, permission }) => (
              <PermissionListItem key={permission.id}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: getAvatarColor(group.name), color: '#fff' }}>
                    <GroupIcon />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={group.name}
                  secondary={group.description || `${group.members.length} members`}
                />
                <PermissionChip
                  label={permission.level}
                  size="small"
                  color={getPermissionColor(permission.level)}
                  sx={{ ml: 1 }}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Revoke Permission">
                    <IconButton
                      edge="end"
                      onClick={() => handleRevokePermission(group.id, 'group')}
                      sx={{ '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </PermissionListItem>
            ))}
          </PermissionList>
        </SectionCard>
      </Grow>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onClose={() => setIsCreateUserDialogOpen(false)}>
        <FancyDialogTitle>
          <PersonIcon color="primary" /> Create New User
        </FancyDialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            sx={{ mb: 1 }}
            helperText="User will be able to log in with this email."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateUserDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupDialogOpen} onClose={() => setIsCreateGroupDialogOpen(false)}>
        <FancyDialogTitle>
          <GroupIcon color="secondary" /> Create New Group
        </FancyDialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            sx={{ mb: 1 }}
            helperText="Describe the purpose of this group."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateGroupDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained" color="secondary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grant Permission Dialog */}
      <Dialog open={isGrantPermissionDialogOpen} onClose={() => setIsGrantPermissionDialogOpen(false)}>
        <FancyDialogTitle>
          <AddIcon color="success" /> Grant Permission
        </FancyDialogTitle>
        <DialogContent>
          <Autocomplete
            options={[...allUsers, ...allGroups]}
            getOptionLabel={(option) =>
              'email' in option ? `${option.name} (${option.email})` : option.name
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select User or Group"
                margin="dense"
                fullWidth
                helperText="Type to search users or groups."
              />
            )}
            onChange={(_, value) => setSelectedGrantee(value)}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {'email' in option ? (
                    <Avatar sx={{ bgcolor: getAvatarColor(option.name), color: '#fff', width: 28, height: 28, mr: 1 }}>
                      {option.name.charAt(0).toUpperCase()}
                    </Avatar>
                  ) : (
                    <Avatar sx={{ bgcolor: getAvatarColor(option.name), color: '#fff', width: 28, height: 28, mr: 1 }}>
                      <GroupIcon fontSize="small" />
                    </Avatar>
                  )}
                  {option.name}
                </Box>
              </li>
            )}
          />
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
            <InputLabel>Permission Level</InputLabel>
            <Select
              value={selectedPermissionLevel}
              label="Permission Level"
              onChange={(e) => setSelectedPermissionLevel(e.target.value as PermissionLevel)}
            >
              <MenuItem value="view">View</MenuItem>
              <MenuItem value="edit">Edit</MenuItem>
              <MenuItem value="download">Download</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsGrantPermissionDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleGrantPermission} variant="contained" color="success">
            Grant
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionContainer>
  );
};

export default PermissionManager;
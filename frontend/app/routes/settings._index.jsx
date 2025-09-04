import { useLoaderData, useFetcher } from '@remix-run/react';
import { json } from '@remix-run/node';
import { useState, useEffect } from 'react';

// material
import {
  Card,
  Box,
  Stack,
  Button,
  Container,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Paper,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';

import {
  Google as GoogleIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

// components
import Page from '~/components/Page';
import { graphQLClient, gql } from '~/graphql';

// GraphQL queries and mutations
const SETTINGS_QUERY = gql`
  query SettingsQuery {
    notificationSettings {
      id
      dailyEmailEnabled
      emailAddress
      emailTime
      timezone
    }
    googleCredentials {
      id
      accountId
      accountName
      isActive
      lastUsed
    }
    calendarSettings {
      id
      calendarId
      calendarName
      isEnabled
      googleCredentials {
        id
        accountName
      }
    }
  }
`;

// GraphQL mutations for server-side actions
const UPDATE_NOTIFICATION_SETTINGS = gql`
  mutation UpdateNotificationSettings($data: NotificationSettingsInput!) {
    updateNotificationSettings(data: $data) {
      id
      dailyEmailEnabled
      emailAddress
      emailTime
      timezone
    }
  }
`;

const VALIDATE_GOOGLE_CREDENTIALS = gql`
  mutation ValidateGoogleCredentials($input: GoogleOAuthInput!) {
    validateGoogleCredentials(input: $input) {
      id
      accountId
      accountName
    }
  }
`;

const REMOVE_GOOGLE_CREDENTIALS = gql`
  mutation RemoveGoogleCredentials($credentialsId: UUID!) {
    removeGoogleCredentials(credentialsId: $credentialsId)
  }
`;

const TOGGLE_CALENDAR_SETTING = gql`
  mutation ToggleCalendarSetting($calendarId: UUID!, $isEnabled: Boolean!) {
    toggleCalendarSetting(calendarId: $calendarId, isEnabled: $isEnabled) {
      id
      isEnabled
      calendarName
    }
  }
`;

const SEND_TEST_EMAIL = gql`
  mutation SendTestCalendarEmail {
    sendTestCalendarEmail
  }
`;

export async function loader() {
  const { data } = await graphQLClient.query({
    query: SETTINGS_QUERY
  });
  return json({ ...data });
}

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    switch (intent) {
      case 'updateNotifications': {
        const data = JSON.parse(formData.get('data'));
        const { data: result } = await graphQLClient.mutate({
          mutation: UPDATE_NOTIFICATION_SETTINGS,
          variables: { data }
        });
        return json({ success: true, data: result.updateNotificationSettings[0] });
      }

      case 'validateCredentials': {
        const input = {
          accountId: formData.get('accountId'),
          accountName: formData.get('accountName'),
          credentialsJson: formData.get('credentialsJson')
        };
        const { data: result } = await graphQLClient.mutate({
          mutation: VALIDATE_GOOGLE_CREDENTIALS,
          variables: { input }
        });
        return json({ success: true, data: result.validateGoogleCredentials });
      }

      case 'removeCredentials': {
        const credentialsId = formData.get('credentialsId');
        const { data: result } = await graphQLClient.mutate({
          mutation: REMOVE_GOOGLE_CREDENTIALS,
          variables: { credentialsId }
        });
        return json({ success: true, removed: result.removeGoogleCredentials });
      }

      case 'toggleCalendar': {
        const calendarId = formData.get('calendarId');
        const isEnabled = formData.get('isEnabled') === 'true';
        const { data: result } = await graphQLClient.mutate({
          mutation: TOGGLE_CALENDAR_SETTING,
          variables: { calendarId, isEnabled }
        });
        return json({ success: true, data: result.toggleCalendarSetting });
      }

      case 'sendTestEmail': {
        const { data: result } = await graphQLClient.mutate({
          mutation: SEND_TEST_EMAIL
        });
        return json({ success: true, sent: result.sendTestCalendarEmail });
      }

      default:
        return json({ error: 'Unknown intent' }, { status: 400 });
    }
  } catch (error) {
    console.error('Settings action error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export default function SettingsPage() {
  const data = useLoaderData();
  const fetcher = useFetcher();
  
  const [credentialsDialog, setCredentialsDialog] = useState(false);
  const [credentialsData, setCredentialsData] = useState({
    accountId: '',
    accountName: '',
    credentialsJson: ''
  });
  const [validationError, setValidationError] = useState('');

  const notificationSettings = data.notificationSettings;
  const googleCredentials = data.googleCredentials || [];
  const calendarSettings = data.calendarSettings || [];

  // Local state for notification form
  const [localNotificationSettings, setLocalNotificationSettings] = useState({
    dailyEmailEnabled: notificationSettings.dailyEmailEnabled,
    emailAddress: notificationSettings.emailAddress || '',
    emailTime: notificationSettings.emailTime || '07:00',
    timezone: notificationSettings.timezone || 'America/New_York'
  });

  // Update local state when data changes (e.g., after successful save)
  useEffect(() => {
    setLocalNotificationSettings({
      dailyEmailEnabled: notificationSettings.dailyEmailEnabled,
      emailAddress: notificationSettings.emailAddress || '',
      emailTime: notificationSettings.emailTime || '07:00',
      timezone: notificationSettings.timezone || 'America/New_York'
    });
  }, [notificationSettings]);

  const handleNotificationToggle = (field, value) => {
    // For toggles, update both local state and submit immediately
    setLocalNotificationSettings(prev => ({ ...prev, [field]: value }));
    
    const updateData = { ...notificationSettings, [field]: value };
    delete updateData.id; // Remove id from update data
    
    fetcher.submit(
      { 
        intent: 'updateNotifications',
        data: JSON.stringify(updateData)
      },
      { method: 'post' }
    );
  };

  const handleNotificationFieldChange = (field, value) => {
    // For text fields, only update local state
    setLocalNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveNotificationSettings = () => {
    // Save all notification settings
    const updateData = { ...localNotificationSettings };
    
    fetcher.submit(
      { 
        intent: 'updateNotifications',
        data: JSON.stringify(updateData)
      },
      { method: 'post' }
    );
  };

  const validateCredentials = () => {
    setValidationError('');
    
    fetcher.submit(
      { 
        intent: 'validateCredentials',
        accountId: credentialsData.accountId,
        accountName: credentialsData.accountName,
        credentialsJson: credentialsData.credentialsJson
      },
      { method: 'post' }
    );
  };

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      const lastSubmission = fetcher.formData?.get('intent');
      
      if (fetcher.data.success) {
        switch (lastSubmission) {
          case 'validateCredentials':
            setCredentialsDialog(false);
            setCredentialsData({ accountId: '', accountName: '', credentialsJson: '' });
            setValidationError('');
            window.location.reload(); // Refresh to show new credentials
            break;
          case 'removeCredentials':
            window.location.reload();
            break;
          case 'toggleCalendar':
            // Calendar toggle handled - the UI will update automatically
            break;
          case 'updateNotifications':
            // Settings saved successfully - no action needed, state will update
            break;
          case 'sendTestEmail':
            alert('Test email sent successfully!');
            break;
        }
      } else if (fetcher.data.error) {
        switch (lastSubmission) {
          case 'validateCredentials':
            setValidationError(fetcher.data.error);
            break;
          case 'sendTestEmail':
            alert('Error sending test email');
            break;
          default:
            console.error('Error:', fetcher.data.error);
        }
      }
    }
  }, [fetcher.data, fetcher.state]);

  const removeCredentials = (credentialsId) => {
    fetcher.submit(
      { 
        intent: 'removeCredentials',
        credentialsId: credentialsId
      },
      { method: 'post' }
    );
  };

  const toggleCalendarSetting = (calendarId, isEnabled) => {
    fetcher.submit(
      { 
        intent: 'toggleCalendar',
        calendarId: calendarId,
        isEnabled: isEnabled.toString()
      },
      { method: 'post' }
    );
  };

  const sendTestEmail = () => {
    fetcher.submit(
      { 
        intent: 'sendTestEmail'
      },
      { method: 'post' }
    );
  };

  return (
    <Page title="Settings">
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Settings
          </Typography>
        </Stack>

        <Stack spacing={4}>
          {/* Google Authentication Section */}
          <Card>
            <Box sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <SecurityIcon />
                <Typography variant="h6">Google Authentication</Typography>
              </Stack>
              
              {googleCredentials.length === 0 ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No Google accounts connected. Connect your Google account to enable calendar features.
                </Alert>
              ) : (
                <List>
                  {googleCredentials.map((cred) => (
                    <ListItem key={cred.id}>
                      <ListItemIcon>
                        <GoogleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={cred.accountName}
                        secondary={`Account ID: ${cred.accountId} • Last used: ${
                          cred.lastUsed ? new Date(cred.lastUsed).toLocaleString() : 'Never'
                        }`}
                      />
                      <ListItemSecondaryAction>
                        <Chip 
                          label={cred.isActive ? 'Active' : 'Inactive'} 
                          color={cred.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <IconButton 
                          edge="end" 
                          onClick={() => removeCredentials(cred.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              <Button
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={() => setCredentialsDialog(true)}
                sx={{ mt: 2 }}
              >
                Connect Google Account
              </Button>
            </Box>
          </Card>

          {/* Calendar Settings Section */}
          {calendarSettings.length > 0 && (
            <Card>
              <Box sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <CalendarIcon />
                  <Typography variant="h6">Calendar Settings</Typography>
                </Stack>
                
                <List>
                  {calendarSettings.map((setting) => (
                    <ListItem key={setting.id}>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={setting.calendarName || setting.calendarId}
                        secondary={`Account: ${setting.googleCredentials.accountName}`}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={setting.isEnabled}
                          onChange={(e) => {
                            toggleCalendarSetting(setting.id, e.target.checked);
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Card>
          )}

          {/* Notification Settings Section */}
          <Card>
            <Box sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <NotificationsIcon />
                <Typography variant="h6">Notification Settings</Typography>
              </Stack>

              <Stack spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localNotificationSettings.dailyEmailEnabled}
                      onChange={(e) => handleNotificationToggle('dailyEmailEnabled', e.target.checked)}
                    />
                  }
                  label="Daily Calendar Email"
                />

                {localNotificationSettings.dailyEmailEnabled && (
                  <>
                    <TextField
                      label="Email Address"
                      type="email"
                      value={localNotificationSettings.emailAddress}
                      onChange={(e) => handleNotificationFieldChange('emailAddress', e.target.value)}
                      fullWidth
                      helperText="Email address to receive daily calendar summaries"
                    />

                    <TextField
                      label="Email Time"
                      type="time"
                      value={localNotificationSettings.emailTime}
                      onChange={(e) => handleNotificationFieldChange('emailTime', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      helperText="Time to send daily calendar email"
                    />

                    <TextField
                      label="Timezone"
                      value={localNotificationSettings.timezone}
                      onChange={(e) => handleNotificationFieldChange('timezone', e.target.value)}
                      fullWidth
                      helperText="Your local timezone for calendar events"
                    />

                    <Stack direction="row" spacing={2} sx={{ alignSelf: 'flex-start' }}>
                      <Button
                        variant="contained"
                        onClick={saveNotificationSettings}
                        disabled={fetcher.state !== 'idle'}
                      >
                        {fetcher.state !== 'idle' ? 'Saving...' : 'Save Settings'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<EmailIcon />}
                        onClick={sendTestEmail}
                        disabled={fetcher.state !== 'idle'}
                      >
                        {fetcher.state !== 'idle' ? 'Sending...' : 'Send Test Email'}
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Box>
          </Card>
        </Stack>

        {/* Google Credentials Dialog */}
        <Dialog open={credentialsDialog} onClose={() => setCredentialsDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Connect Google Account</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                Paste your Google Calendar API credentials JSON. This will be validated and stored securely.
              </Alert>
              
              {validationError && (
                <Alert severity="error">
                  {validationError}
                </Alert>
              )}
              
              <TextField
                label="Account ID"
                value={credentialsData.accountId}
                onChange={(e) => setCredentialsData({...credentialsData, accountId: e.target.value})}
                fullWidth
                helperText="Unique identifier (e.g., 'primary', 'work', 'personal')"
              />

              <TextField
                label="Account Name"
                value={credentialsData.accountName}
                onChange={(e) => setCredentialsData({...credentialsData, accountName: e.target.value})}
                fullWidth
                helperText="Display name for this account"
              />

              <TextField
                label="Google Credentials JSON"
                value={credentialsData.credentialsJson}
                onChange={(e) => setCredentialsData({...credentialsData, credentialsJson: e.target.value})}
                multiline
                rows={6}
                fullWidth
                helperText="Paste your Google Calendar API credentials JSON (must include client_id, client_secret, and refresh_token)"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCredentialsDialog(false)}>Cancel</Button>
            <Button 
              onClick={validateCredentials} 
              variant="contained"
              disabled={fetcher.state !== 'idle'}
            >
              {fetcher.state !== 'idle' ? 'Validating...' : 'Validate & Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Page>
  );
}
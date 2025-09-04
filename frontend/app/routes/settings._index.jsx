import { useLoaderData, useFetcher } from '@remix-run/react';
import { json } from '@remix-run/node';
import { useState } from 'react';

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

const START_GOOGLE_OAUTH = gql`
  mutation StartGoogleOAuth($input: GoogleOAuthInput!) {
    startGoogleOAuth(input: $input)
  }
`;

const COMPLETE_GOOGLE_OAUTH = gql`
  mutation CompleteGoogleOAuth($input: GoogleOAuthInput!) {
    completeGoogleOAuth(input: $input) {
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
        const result = await makeGraphQLRequest(UPDATE_NOTIFICATION_SETTINGS, { data });
        return json({ success: true, data: result.data.updateNotificationSettings });
      }

      case 'startOAuth': {
        const input = {
          accountId: formData.get('accountId'),
          accountName: formData.get('accountName'),
          credentialsJson: formData.get('credentialsJson')
        };
        const { data: result } = await graphQLClient.mutate({
          mutation: START_GOOGLE_OAUTH,
          variables: { input }
        });
        return json({ success: true, authUrl: result.startGoogleOAuth });
      }

      case 'completeOAuth': {
        const input = {
          accountId: formData.get('accountId'),
          accountName: formData.get('accountName'),
          credentialsJson: formData.get('credentialsJson'),
          authCode: formData.get('authCode')
        };
        const { data: result } = await graphQLClient.mutate({
          mutation: COMPLETE_GOOGLE_OAUTH,
          variables: { input }
        });
        return json({ success: true, data: result.completeGoogleOAuth });
      }

      case 'removeCredentials': {
        const credentialsId = formData.get('credentialsId');
        const { data: result } = await graphQLClient.mutate({
          mutation: REMOVE_GOOGLE_CREDENTIALS,
          variables: { credentialsId }
        });
        return json({ success: true, removed: result.removeGoogleCredentials });
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
  
  const [oauthDialog, setOauthDialog] = useState(false);
  const [oauthStep, setOauthStep] = useState(1); // 1: credentials, 2: auth code
  const [oauthData, setOauthData] = useState({
    accountId: '',
    accountName: '',
    credentialsJson: '',
    authCode: ''
  });
  const [oauthUrl, setOauthUrl] = useState('');

  const notificationSettings = data.notificationSettings;
  const googleCredentials = data.googleCredentials || [];
  const calendarSettings = data.calendarSettings || [];

  const handleNotificationChange = (field, value) => {
    const updateData = { ...notificationSettings };
    updateData[field] = value;
    delete updateData.id; // Remove id from update data
    
    fetcher.submit(
      { 
        intent: 'updateNotifications',
        data: JSON.stringify(updateData)
      },
      { method: 'post' }
    );
  };

  const startGoogleAuth = async () => {
    const formData = new FormData();
    formData.append('intent', 'startOAuth');
    formData.append('accountId', oauthData.accountId);
    formData.append('accountName', oauthData.accountName);
    formData.append('credentialsJson', oauthData.credentialsJson);

    try {
      const response = await fetch('/settings', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      
      if (result.success) {
        setOauthUrl(result.authUrl);
        setOauthStep(2);
      } else {
        console.error('Error starting OAuth:', result.error);
      }
    } catch (error) {
      console.error('Error starting OAuth:', error);
    }
  };

  const completeGoogleAuth = async () => {
    const formData = new FormData();
    formData.append('intent', 'completeOAuth');
    formData.append('accountId', oauthData.accountId);
    formData.append('accountName', oauthData.accountName);
    formData.append('credentialsJson', oauthData.credentialsJson);
    formData.append('authCode', oauthData.authCode);

    try {
      const response = await fetch('/settings', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      
      if (result.success) {
        setOauthDialog(false);
        setOauthStep(1);
        setOauthData({ accountId: '', accountName: '', credentialsJson: '', authCode: '' });
        window.location.reload(); // Refresh to show new credentials
      } else {
        console.error('Error completing OAuth:', result.error);
      }
    } catch (error) {
      console.error('Error completing OAuth:', error);
    }
  };

  const removeCredentials = async (credentialsId) => {
    const formData = new FormData();
    formData.append('intent', 'removeCredentials');
    formData.append('credentialsId', credentialsId);

    try {
      const response = await fetch('/settings', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      
      if (result.success) {
        window.location.reload();
      } else {
        console.error('Error removing credentials:', result.error);
      }
    } catch (error) {
      console.error('Error removing credentials:', error);
    }
  };

  const sendTestEmail = async () => {
    const formData = new FormData();
    formData.append('intent', 'sendTestEmail');

    try {
      const response = await fetch('/settings', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Test email sent successfully!');
      } else {
        console.error('Error sending test email:', result.error);
        alert('Error sending test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Error sending test email');
    }
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
                onClick={() => setOauthDialog(true)}
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
                            // Handle calendar enable/disable
                            // This would need additional GraphQL mutation
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
                      checked={notificationSettings.dailyEmailEnabled}
                      onChange={(e) => handleNotificationChange('dailyEmailEnabled', e.target.checked)}
                    />
                  }
                  label="Daily Calendar Email"
                />

                {notificationSettings.dailyEmailEnabled && (
                  <>
                    <TextField
                      label="Email Address"
                      type="email"
                      value={notificationSettings.emailAddress || ''}
                      onChange={(e) => handleNotificationChange('emailAddress', e.target.value)}
                      fullWidth
                      helperText="Email address to receive daily calendar summaries"
                    />

                    <TextField
                      label="Email Time"
                      type="time"
                      value={notificationSettings.emailTime || '07:00'}
                      onChange={(e) => handleNotificationChange('emailTime', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      helperText="Time to send daily calendar email"
                    />

                    <TextField
                      label="Timezone"
                      value={notificationSettings.timezone || 'America/New_York'}
                      onChange={(e) => handleNotificationChange('timezone', e.target.value)}
                      fullWidth
                      helperText="Your local timezone for calendar events"
                    />

                    <Button
                      variant="outlined"
                      startIcon={<EmailIcon />}
                      onClick={sendTestEmail}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Send Test Email
                    </Button>
                  </>
                )}
              </Stack>
            </Box>
          </Card>
        </Stack>

        {/* Google OAuth Dialog */}
        <Dialog open={oauthDialog} onClose={() => setOauthDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Connect Google Account</DialogTitle>
          <DialogContent>
            {oauthStep === 1 ? (
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Alert severity="info">
                  You'll need Google Calendar API credentials. Create them in the Google Cloud Console.
                </Alert>
                
                <TextField
                  label="Account ID"
                  value={oauthData.accountId}
                  onChange={(e) => setOauthData({...oauthData, accountId: e.target.value})}
                  fullWidth
                  helperText="Unique identifier (e.g., 'primary', 'work', 'personal')"
                />

                <TextField
                  label="Account Name"
                  value={oauthData.accountName}
                  onChange={(e) => setOauthData({...oauthData, accountName: e.target.value})}
                  fullWidth
                  helperText="Display name for this account"
                />

                <TextField
                  label="Google Credentials JSON"
                  value={oauthData.credentialsJson}
                  onChange={(e) => setOauthData({...oauthData, credentialsJson: e.target.value})}
                  multiline
                  rows={6}
                  fullWidth
                  helperText="Paste the contents of your Google API credentials.json file"
                />
              </Stack>
            ) : (
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Alert severity="info">
                  Click the link below to authorize access to your Google Calendar, then paste the authorization code.
                </Alert>
                
                <Button
                  variant="contained"
                  href={oauthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                >
                  Authorize Google Access
                </Button>

                <TextField
                  label="Authorization Code"
                  value={oauthData.authCode}
                  onChange={(e) => setOauthData({...oauthData, authCode: e.target.value})}
                  fullWidth
                  helperText="Paste the authorization code from Google"
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOauthDialog(false)}>Cancel</Button>
            {oauthStep === 1 ? (
              <Button onClick={startGoogleAuth} variant="contained">
                Next
              </Button>
            ) : (
              <Button onClick={completeGoogleAuth} variant="contained">
                Complete Setup
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Container>
    </Page>
  );
}
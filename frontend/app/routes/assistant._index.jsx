import Grid from '@mui/material/Unstable_Grid2';
import { 
    TextField, 
    Button, 
    Paper, 
    Card, 
    CardContent, 
    CardActions, 
    Chip,
    IconButton,
    Divider,
    Box,
    Stack
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import Page from '~/components/Page';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';

import { useFormik } from 'formik';
import { useState } from 'react';

import { redirect, json } from "@remix-run/node";
import { gql, graphQLClient } from '~/graphql';
import { useFetcher, Link, useLoaderData } from '@remix-run/react';
import { jsonToFormData, formDataToJson } from '~/utils/formUtils';


const LoadPromptTemplates = gql`
query LoadPromptTemplates{
    promptTemplates{
        id
        name
        systemMessage
        requestTemplate
    }
}
`
const StartConversation = gql`
mutation StartConversation($system: String!, $request: String!){
    startConversation(system: $system, request: $request){
        id
    }
}
`

export async function action({ request }){
    const formData = await request.formData();
    const ask = formDataToJson(formData)
    
    const { data } = await graphQLClient.query({
        query: StartConversation,
        variables: {
            ...ask
        }
    });

    return redirect(`/assistant/conversations/${data.startConversation.id}`);
};

export async function loader({request, params}){
    const { data } = await graphQLClient.query({
        query: LoadPromptTemplates
    });
    return json(data);
}

export default function Assistant(){
    const { promptTemplates } = useLoaderData();
    const [isAsking, setIsAsking] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const fetcher = useFetcher();

    const formik = useFormik({
        initialValues: {
            system: "",
            request: ""
        },
        onSubmit: (values) => {
          submit(values)
        }
    });

    const submit = async (request) => {
        setIsAsking(true);
        fetcher.submit(jsonToFormData(request), {
            method: "POST",
            action: `/assistant`,
        });
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        formik.setValues({
            system: template.systemMessage || "",
            request: template.requestTemplate || ""
        });
    };

    const handleClearTemplate = () => {
        setSelectedTemplate(null);
        formik.setValues({
            system: "",
            request: ""
        });
    };

    return (
        <Page title="AI Assistant">
            <Box sx={{ mb: 4 }}>
                <Grid container justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            AI Assistant
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Chat with your AI assistant using custom prompts
                        </Typography>
                    </Box>
                    <Button
                        component={Link}
                        to="/assistant/conversations"
                        startIcon={<HistoryIcon />}
                        variant="outlined"
                        size="large"
                    >
                        View Conversations
                    </Button>
                </Grid>
            </Box>

            <Grid container spacing={3}>
                {/* Prompt Templates Sidebar */}
                <Grid xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    Prompt Templates
                                </Typography>
                                <IconButton 
                                    component={Link} 
                                    to="/assistant/templates/new"
                                    size="small"
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>
                            
                            {selectedTemplate && (
                                <Box mb={2}>
                                    <Chip
                                        label={`Using: ${selectedTemplate.name}`}
                                        onDelete={handleClearTemplate}
                                        color="primary"
                                        variant="filled"
                                    />
                                </Box>
                            )}

                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {promptTemplates.map((template) => (
                                    <ListItem key={template.id} disablePadding>
                                        <ListItemButton
                                            onClick={() => handleTemplateSelect(template)}
                                            selected={selectedTemplate?.id === template.id}
                                        >
                                            <ListItemIcon>
                                                <ChatIcon />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={template.name}
                                                secondary={template.systemMessage ? 
                                                    `${template.systemMessage.slice(0, 50)}...` : 
                                                    'No system message'
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                                {promptTemplates.length === 0 && (
                                    <ListItem>
                                        <ListItemText 
                                            primary="No templates yet"
                                            secondary="Create your first template to get started"
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Chat Interface */}
                <Grid xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Chat Interface
                            </Typography>
                            
                            <Stack spacing={3}>
                                {/* System Prompt Section */}
                                <Accordion defaultExpanded={false}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>
                                            System Prompt {selectedTemplate && `(${selectedTemplate.name})`}
                                            {formik.values.system && (
                                                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                    - {formik.values.system.slice(0, 60)}{formik.values.system.length > 60 ? '...' : ''}
                                                </Typography>
                                            )}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            name="system"
                                            label="System message (optional)"
                                            placeholder="You are a helpful assistant..."
                                            value={formik.values.system}
                                            onChange={formik.handleChange}
                                            variant="outlined"
                                        />
                                    </AccordionDetails>
                                </Accordion>

                                {/* User Message Section */}
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Your Message
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={8}
                                        name="request"
                                        placeholder="Type your question or request here..."
                                        value={formik.values.request}
                                        onChange={formik.handleChange}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                </Box>
                            </Stack>
                        </CardContent>
                        
                        <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3 }}>
                            <LoadingButton
                                variant="contained"
                                size="large"
                                loading={isAsking}
                                loadingIndicator="Sending..."
                                onClick={formik.handleSubmit}
                                startIcon={<SendIcon />}
                                disabled={!formik.values.request.trim()}
                            >
                                Send Message
                            </LoadingButton>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </Page>
    )
}
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { NoSsr } from '@mui/base';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import Page from '~/components/Page';
import StreamingResponse from '~/components/StreamingResponse';
import { 
    Paper, 
    Card, 
    CardContent, 
    CardActions,
    Box,
    Avatar,
    IconButton,
    Fab,
    InputAdornment
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import { gql, graphQLClient } from '~/graphql';
import { Stack } from "@mui/material";
import { markDownToHtml } from '~/utils/markdown';
import MarkdownBox from '~/components/MarkdownBox';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { jsonToFormData, formDataToJson } from '~/utils/formUtils';

const ConversationQuery = gql`
query GetConversation($conversationId: ID!){
    assistantConversation(pk: $conversationId){
        id
        systemMessage
        description
        createdAt
        messages{
            id
            role
            content
            createdAt
        }
    }
}
`

const SendMessageMutation = gql`
mutation SendMessage($conversationId: UUID!, $request: String!){
    sendMessageStreaming(conversationID: $conversationId, request: $request){
        id
        content
        createdAt
    }
}
`


export async function action({ request, params }) {
    const formData = await request.formData();
    const message = formDataToJson(formData);
    
    const { data } = await graphQLClient.query({
        query: SendMessageMutation,
        variables: {
            conversationId: params.conversationId,
            request: message.request
        }
    });

    // Return the message ID and user message for streaming
    return json({ 
        messageId: data.sendMessageStreaming.id,
        userMessage: {
            content: message.request,
            createdAt: new Date().toISOString()
        }
    });
}

export async function loader({request, params}){
    const { data } = await graphQLClient.query({
        query: ConversationQuery,
        variables: {
            conversationId: params.conversationId
        }
    });

    return json(data);
}

function ChatMessage({ message, role, datetime, rawText }) {
    const theme = useTheme();
    const isUser = role === 'user';

    const copy = async () => {
        await navigator.clipboard.writeText(rawText || message);
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            mb: 3
        }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                maxWidth: '80%',
                gap: 1
            }}>
                <Avatar sx={{ 
                    bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
                    width: 32, 
                    height: 32 
                }}>
                    {isUser ? <PersonIcon /> : <SmartToyIcon />}
                </Avatar>
                
                <Card sx={{ 
                    backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[100],
                    color: isUser ? 'white' : 'inherit',
                    flexGrow: 1
                }}>
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        {role === 'user' ? (
                            <Typography variant="body1">{message}</Typography>
                        ) : (
                            <MarkdownBox dangerouslySetInnerHTML={{__html: markDownToHtml(message)}} />
                        )}
                        
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            mt: 1 
                        }}>
                            {datetime && (
                                <Typography variant="caption" sx={{ 
                                    color: isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary' 
                                }} suppressHydrationWarning={true}>
                                    {dayjs(datetime).format("MMM DD, h:mm A")}
                                </Typography>
                            )}
                            <IconButton 
                                size="small" 
                                onClick={copy}
                                sx={{ 
                                    color: isUser ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                                    ml: 'auto'
                                }}
                            >
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}

export default function ConversationDetail(){
    const loaderData = useLoaderData();
    const fetcher = useFetcher();
    const [isAsking, setIsAsking] = useState(false);

    // Handle case where conversation data is null (race condition)
    if (!loaderData || !loaderData.assistantConversation) {
        return (
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '50vh'
            }}>
                <Typography variant="h6" color="text.secondary">
                    Loading conversation...
                </Typography>
            </Box>
        );
    }

    const { assistantConversation } = loaderData;

    const formik = useFormik({
        initialValues: {
            request: ''
        },
        onSubmit: async (values) => {
            setIsAsking(true);
            fetcher.submit(jsonToFormData(values), {
                method: "POST"
            });
            formik.resetForm();
        }
    });

    // Handle streaming completion
    const handleStreamingComplete = () => {
        setIsAsking(false);
        // Refresh to get final state with new message
        window.location.reload();
    };

    // If we're currently streaming, show the streaming component
    if (fetcher.data && fetcher.data.messageId && isAsking) {
        return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header with system prompt */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Accordion defaultExpanded={false}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">
                                System Prompt
                                {assistantConversation.systemMessage && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        - {assistantConversation.systemMessage.slice(0, 60)}{assistantConversation.systemMessage.length > 60 ? '...' : ''}
                                    </Typography>
                                )}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" sx={{ 
                                backgroundColor: 'grey.50', 
                                p: 2, 
                                borderRadius: 1,
                                fontFamily: 'monospace'
                            }}>
                                {assistantConversation.systemMessage || 'No system prompt provided'}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Paper>

                {/* Show existing messages and streaming response */}
                <Paper sx={{ flexGrow: 1, p: 3, mb: 2, overflow: 'auto' }}>
                    <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                        {/* Existing messages */}
                        {assistantConversation.messages.map((msg) => (
                            <ChatMessage
                                key={msg.id}
                                message={msg.content}
                                role={msg.role}
                                datetime={msg.createdAt}
                                rawText={msg.content}
                            />
                        ))}
                        
                        {/* Streaming response */}
                        <StreamingResponse
                            messageId={fetcher.data.messageId}
                            userMessage={fetcher.data.userMessage}
                            onComplete={handleStreamingComplete}
                        />
                    </Box>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with system prompt */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Accordion defaultExpanded={false}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">
                            System Prompt
                            {assistantConversation.systemMessage && (
                                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    - {assistantConversation.systemMessage.slice(0, 60)}{assistantConversation.systemMessage.length > 60 ? '...' : ''}
                                </Typography>
                            )}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2" sx={{ 
                            backgroundColor: 'grey.50', 
                            p: 2, 
                            borderRadius: 1,
                            fontFamily: 'monospace'
                        }}>
                            {assistantConversation.systemMessage || 'No system prompt provided'}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </Paper>

            {/* Chat Messages */}
            <Paper sx={{ flexGrow: 1, p: 3, mb: 2, overflow: 'auto' }}>
                <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                    {assistantConversation.messages.map((msg) => (
                        <ChatMessage
                            key={msg.id}
                            message={msg.content}
                            role={msg.role}
                            datetime={msg.createdAt}
                            rawText={msg.content}
                        />
                    ))}
                </Box>
            </Paper>

            {/* Follow-up Input */}
            <Paper sx={{ p: 2 }}>
                <Box component="form" onSubmit={formik.handleSubmit}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        name="request"
                        placeholder="Continue the conversation..."
                        value={formik.values.request}
                        onChange={formik.handleChange}
                        variant="outlined"
                        disabled={isAsking}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <LoadingButton
                                        type="submit"
                                        variant="contained"
                                        loading={isAsking}
                                        disabled={!formik.values.request.trim()}
                                        sx={{ minWidth: 100 }}
                                    >
                                        <SendIcon />
                                    </LoadingButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>
            </Paper>
        </Box>
    )
}
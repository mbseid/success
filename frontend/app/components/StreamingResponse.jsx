import { useState, useEffect } from 'react';
import { useEventSource } from 'remix-utils';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';

import { 
    Box,
    Paper,
    Avatar,
    IconButton,
    Typography,
    Card,
    CardContent,
    CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { markDownToHtml } from '~/utils/markdown';
import MarkdownBox from '~/components/MarkdownBox';

function ChatMessage({ message, role, datetime, rawText, isStreaming = false }) {
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
                            <Box>
                                <MarkdownBox dangerouslySetInnerHTML={{__html: markDownToHtml(message)}} />
                                {isStreaming && (
                                    <Box component="span" sx={{ 
                                        animation: 'blink 1s infinite',
                                        '@keyframes blink': {
                                            '0%, 50%': { opacity: 1 },
                                            '51%, 100%': { opacity: 0 }
                                        }
                                    }}>
                                        ▋
                                    </Box>
                                )}
                            </Box>
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
                                }}>
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

export default function StreamingResponse({ messageId, userMessage, onComplete }) {
    const [streamingMessage, setStreamingMessage] = useState(null);
    const [isComplete, setIsComplete] = useState(false);

    // Use EventSource to stream message updates
    const eventSourceData = useEventSource(
        messageId ? `/stream/message/${messageId}` : null,
        {
            event: "message-update",
        }
    );

    // Handle streaming updates from EventSource
    useEffect(() => {
        if (eventSourceData) {
            try {
                const messageUpdate = JSON.parse(eventSourceData);
                setStreamingMessage(messageUpdate);
                
                // Simple completion detection - if content is substantial and ends with punctuation
                if (messageUpdate.content && messageUpdate.content.length > 20 && 
                    (messageUpdate.content.endsWith('.') || 
                     messageUpdate.content.endsWith('!') || 
                     messageUpdate.content.endsWith('?') ||
                     messageUpdate.content.endsWith('\n'))) {
                    // Give it a moment to ensure completion, then callback
                    setTimeout(() => {
                        setIsComplete(true);
                        if (onComplete) {
                            onComplete(messageUpdate);
                        }
                    }, 2000);
                }
            } catch (error) {
                console.error('Error parsing streaming data:', error);
            }
        }
    }, [eventSourceData, onComplete]);

    return (
        <Box>
            {/* Show user message */}
            {userMessage && (
                <ChatMessage
                    message={userMessage.content}
                    role="user"
                    datetime={userMessage.createdAt}
                    rawText={userMessage.content}
                />
            )}

            {/* Show streaming assistant response */}
            {streamingMessage ? (
                <ChatMessage
                    message={streamingMessage.content}
                    role="assistant"
                    datetime={streamingMessage.createdAt}
                    rawText={streamingMessage.content}
                    isStreaming={!isComplete}
                />
            ) : (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '200px'
                }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Waiting for AI response...
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
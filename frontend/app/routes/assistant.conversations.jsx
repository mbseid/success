import { json } from "@remix-run/node";
import { useLoaderData, Link, Outlet } from "@remix-run/react";
import { NoSsr } from '@mui/base';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';

import Page from '~/components/Page';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Tooltip from '@mui/material/Tooltip';
import { gql, graphQLClient } from '~/graphql';
import { Stack } from "@mui/material";

const ConversationsQuery = gql`
query GetConversations{
    assistantConversations{
        id
        systemMessage
        description
        createdAt
        previewText
    }
}
`

export async function loader({request, params}){
    const { data } = await graphQLClient.query({
        query: ConversationsQuery
    });
    return json(data);
}

export default function AssistantConversations(){
    const { assistantConversations } = useLoaderData();

    return (
        <Page title="AI Conversations">
            <Grid container>
                <Grid item xs={12} >
                    <Typography variant="h5" className="header-message">AI Conversations</Typography>
                </Grid>
            </Grid>
            <Grid container component={Paper}>
                <Grid item xs={3} style={{borderRight: "1px solid lightgrey"}}>
                    <Grid item xs={12} style={{padding: '10px'}}>
                        <TextField id="outlined-basic-email" label="Search" variant="outlined" fullWidth />
                    </Grid>
                    <Divider />
                    <List>
                        {assistantConversations.reverse().map(({id, previewText, createdAt, systemMessage}) => {
                            return (
                                <ListItemButton key={id}
                                                divider={true}
                                                component={Link}
                                                to={`/assistant/conversations/${id}`}>
                                    <Stack>
                                        <Tooltip title={previewText}>
                                            <Typography variant="body2" gutterBottom>
                                                {previewText.slice(0, 30)}
                                                {previewText.length > 30 ? '...' : ''}
                                            </Typography>
                                        </Tooltip>
                                        <NoSsr>
                                            <Typography variant="body2" color="text.secondary">
                                                {dayjs(createdAt).format("MM/DD/YYYY")}
                                            </Typography>
                                        </NoSsr>
                                        {systemMessage && (
                                            <Typography variant="caption" color="text.secondary">
                                                System: {systemMessage.slice(0, 20)}...
                                            </Typography>
                                        )}
                                    </Stack>
                                </ListItemButton>
                            );
                        })}
                    </List>
                </Grid>
                <Grid item xs={9}>
                    <Outlet />
                </Grid>
            </Grid>
        </Page>
    )
}
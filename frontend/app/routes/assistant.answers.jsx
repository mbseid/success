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
import { markDownToHtml } from '~/utils/markdown';
import MarkdownBox from '~/components/MarkdownBox';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const AssistantAnswerQuery = gql`
query GetAnswer{
    assistantAnswers{
        id
        request
        datetime
    }
}
`

export async function loader({request, params}){
    const { data } = await graphQLClient.query({
        query: AssistantAnswerQuery,
        variables: {
          answerId: params.answerId
        }
    });
    return json(data);
}

export default function AssistantAnswer(){
    const { assistantAnswers } = useLoaderData();

    return (
        <Page title="Assistant Response">
            <Grid container>
                <Grid item xs={12} >
                    <Typography variant="h5" className="header-message">Assistant Answers</Typography>
                </Grid>
            </Grid>
            <Grid container component={Paper}>
                <Grid item xs={3} style={{borderRight: "1px solid lightgrey"}}>
                    <Grid item xs={12} style={{padding: '10px'}}>
                        <TextField id="outlined-basic-email" label="Search" variant="outlined" fullWidth />
                    </Grid>
                    <Divider />
                    <List>
                        {assistantAnswers.reverse().map(({id, request, datetime}) => {
                            return (
                                <ListItemButton key={id}
                                                divider={true}
                                                component={Link}
                                                to={`/assistant/answers/${id}`}>
                                    <Stack>
                                        <Tooltip title={request}>
                                            <Typography variant="body2" gutterBottom>
                                                {request.slice(0, 20)}
                                            </Typography>
                                        </Tooltip>
                                        <NoSsr>
                                            <Typography variant="body2" color="text.secondary">
                                                {dayjs(datetime).format("MM/DD/YYYY")}
                                            </Typography>
                                        </NoSsr>
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
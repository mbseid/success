import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
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
import Button from '@mui/material/Button';
import { gql, graphQLClient } from '~/graphql';
import { Stack } from "@mui/material";
import { markDownToHtml } from '~/utils/markdown';
import MarkdownBox from '~/components/MarkdownBox';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const AssistantAnswerQuery = gql`
query GetAnswer($answerId: ID!){
    assistantAnswer(pk: $answerId){
        id
        system
        request
        response
    }
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

    data.assistantAnswer.responseMarkdown = markDownToHtml(data.assistantAnswer.response)
    return json(data);
}

function ChatRow({text, role, rawText}){
    const theme = useTheme();

    let align = 'left',
        background = theme.palette.grey[100];

    
    if(role == "user"){
        align = 'right';
        background = 'inherit';
    }

    const copy = async () => {
        await navigator.clipboard.writeText(rawText);
    }
    return (
        <ListItem sx={{textAlign: align, backgroundColor: background}}>
            <Grid container>
                <Grid item xs={12} justifyContent="flex-end">
                    <Button variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={copy}
                            size='small'>
                        Copy
                    </Button>
                </Grid>
            
                <Grid item xs={12}>
                    <MarkdownBox dangerouslySetInnerHTML={{__html: text}} />
                </Grid>
            </Grid>
        </ListItem>
    )
}
export default function AssistantAnswer(){
    const { assistantAnswer, assistantAnswers } = useLoaderData();

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
                                                to={`/assistant/answer/${id}`}>
                                    <Stack>
                                        <Typography variant="body2" gutterBottom>
                                            {request.slice(0, 10)}
                                        </Typography>
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
                    <List>
                        <ChatRow key="1" text={assistantAnswer.request} rawText={assistantAnswer.request} role='user' />
                        <ChatRow key="2" text={assistantAnswer.responseMarkdown} rawText={assistantAnswer.response} role='assistant' />
                    </List>
                    <Divider />
                    {/* <Grid container style={{padding: '20px'}}>
                        <Grid item xs={11}>
                            <TextField id="outlined-basic-email" label="Type Something" fullWidth />
                        </Grid>
                        <Grid item xs={1} align="right">
                            <Fab color="primary" aria-label="add"><SendIcon /></Fab>
                        </Grid>
                    </Grid> */}
                </Grid>
            </Grid>
        </Page>
    )
}
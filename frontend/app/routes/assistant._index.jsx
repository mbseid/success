import Grid from '@mui/material/Unstable_Grid2';
import { TextField, Button } from '@mui/material';
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
const AskAssistant = gql`
mutation AskAssistant($system: String!, $request: String!){
    assistant(system: $system, request: $request){
        id
    }
}
`

export async function action({ request }){
    const formData = await request.formData();
    const ask = formDataToJson(formData)
    
    const { data } = await graphQLClient.query({
        query: AskAssistant,
        variables: {
            ...ask
        }
    });

    return redirect(`/assistant/answer/${data.assistant.id}`);
};

export async function loader({request, params}){
    const { data } = await graphQLClient.query({
        query: LoadPromptTemplates
    });
    return json(data);
}

export default function Assistant(){
    const { promptTemplates } = useLoaderData();
    const [isAsking, setIsAsking] = useState(false)
    const [answer, setAnswer] = useState()

    const fetcher = useFetcher();
    
    const prompt = {
        name: "Default",
        system_message: "",
        request_template: ""
    }

    const formik = useFormik({
        initialValues: {
            system: prompt.system_message,
            request: prompt.request_template
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

    }

    return (
        <Page title="Assistant">
            <Grid container justifyContent="space-between" alignItems="center">
                <h1>Assistant</h1>
                <Link to="/assistant/answers">see answers</Link>
            </Grid>
            <Grid container spacing={2}>
                <Grid xs={4}>
                    <h2>Prompt List</h2>
                    <List>
                        {promptTemplates.map((promptTemplate) => {
                            return (
                                <ListItemButton>
                                    <ListItemText primary={promptTemplate.name} />
                                </ListItemButton>
                            )
                        })}
                        
                    </List>
                    <Link to="/assistant/templates/new">Add</Link>
                </Grid>
                <Grid xs={8}>
                    <h2>Ask Away</h2>
                    <Accordion>
                        <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        >
                            <Typography>System Prompt: {prompt.name}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TextField fullWidth
                                        multiline
                                        name='system'
                                        value={formik.values.system}
                                        onChange={formik.handleChange}
                                        variant="standard" />
                        </AccordionDetails>
                    </Accordion>
                    <TextField fullWidth
                                multiline
                                minRows={12}
                                name='request'
                                value={formik.values.request}
                                onChange={formik.handleChange}/>
                    <LoadingButton variant="contained"
                            loading={isAsking}
                            loadingIndicator="Loading…"
                            onClick={formik.handleSubmit}>
                            <span>Ask</span>
                    </LoadingButton>
                </Grid>
            </Grid>
        </Page>
    )
}
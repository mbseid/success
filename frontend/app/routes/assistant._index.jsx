import Grid from '@mui/material/Unstable_Grid2';
import { TextField, Button } from '@mui/material';
import Page from '~/components/Page';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFormik } from 'formik';
import { useState } from 'react';

import { redirect } from "@remix-run/node";
import { gql, graphQLClient } from '~/graphql';

const AskAssistant = gql`
mutation AskAssistant($system: String!, $request: String!){
    assistant(system: $system, request: $request){
        id
    }
}
`

export async function action ({ request }){
    const ask = await request.json();
    
    const { data } = await graphQLClient.query({
        query: AskAssistant,
        variables: {
            ...ask
        }
    });

    return redirect(`/assistant/answer/${data.assistant.id}`);
};

export default function Assistant(){
    const [isAsking, setIsAsking] = useState(false)
    const [answer, setAnswer] = useState()
    
    const prompt = {
        name: "Spotify Workplace",
        system_message: "Testing",
        request_template: 'Be a parrot and make a noise!'
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
        const response = await fetch(`/assistant`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(request)  
            }
        )

        const body = await response.json()

        console.log(body)
    }

    return (
        <Page title="Assistant">
            <h1>Assistant</h1>
            <Grid container spacing={2}>
                <Grid xs={4}>
                    <h2>Prompt List</h2>
                    <Button variant="contained" onClick={submit}>Ask</Button>
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
                    <Button variant="contained"
                            onClick={formik.handleSubmit}>
                            Ask
                    </Button>
                </Grid>
            </Grid>
        </Page>
    )
}
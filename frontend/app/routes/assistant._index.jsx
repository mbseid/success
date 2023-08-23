import Grid from '@mui/material/Unstable_Grid2';
import { TextField, Button } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
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
import { useFetcher } from '@remix-run/react';
import { jsonToFormData, formDataToJson } from '~/utils/formUtils';


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

export default function Assistant(){
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
import Grid from '@mui/material/Unstable_Grid2';
import { TextField, Button, Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import Page from '~/components/Page';
import EditIcon from '@mui/icons-material/Edit';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { useFormik } from 'formik';
import { useState } from 'react';

import { json } from "@remix-run/node";
import { gql, graphQLClient } from '~/graphql';
import { useFetcher } from '@remix-run/react';
import { jsonToFormData, formDataToJson } from '~/utils/formUtils';

const CopyEditMutation = gql`
mutation CopyEdit($text: String!, $editorType: String){
    copyEdit(text: $text, editorType: $editorType)
}
`

export async function action({ request }){
    const formData = await request.formData();
    const { text, editorType } = formDataToJson(formData)
    
    const { data } = await graphQLClient.query({
        query: CopyEditMutation,
        variables: {
            text,
            editorType
        }
    });

    return json({ response: data.copyEdit });
};

export default function CopyEditor(){
    const [isEditing, setIsEditing] = useState(false)
    const fetcher = useFetcher();
    
    // Get the response from fetcher.data instead of actionData
    const editedResponse = fetcher.data?.response;

    const formik = useFormik({
        initialValues: {
            text: '',
            editorType: 'spotify'
        },
        onSubmit: (values) => {
            submit(values)
        }
    });

    const submit = async (request) => {
        setIsEditing(true);

        fetcher.submit(jsonToFormData(request), {
            method: "POST",
            action: `/copy-editor`,
        });
    }
    
    // Update loading state based on fetcher state
    const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";

    return (
        <Page title="Copy Editor">
            <Grid container spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid xs={12}>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <EditIcon color="primary" fontSize="large" />
                        <Typography variant="h4" component="h1">
                            Copy Editor
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Use AI to improve your text with different editing styles. Choose between Spotify's culture-focused editing or simple grammar and clarity improvements.
                    </Typography>
                </Grid>

                <Grid xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Original Text
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Editor Type</InputLabel>
                                <Select
                                    name="editorType"
                                    value={formik.values.editorType}
                                    onChange={formik.handleChange}
                                    label="Editor Type"
                                >
                                    <MenuItem value="spotify">Spotify Editor</MenuItem>
                                    <MenuItem value="simple">Simple Editor</MenuItem>
                                </Select>
                            </FormControl>
                            <Tooltip title={
                                formik.values.editorType === 'spotify' 
                                    ? "Improve your text to match Spotify's culture and values. The AI will make your content clear, concise, fun, and engaging while maintaining a college reading level."
                                    : "Improve your text for grammar, spelling, clarity, and readability. The AI will maintain your original style while fixing errors and enhancing clarity."
                            }>
                                <IconButton>
                                    <HelpOutlineIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <TextField 
                            fullWidth
                            multiline
                            minRows={10}
                            name='text'
                            placeholder="Enter your text here for editing..."
                            value={formik.values.text}
                            onChange={formik.handleChange}
                            variant="outlined"
                            sx={{ mb: 2 }}
                        />
                        <LoadingButton 
                            variant="contained"
                            loading={isLoading}
                            loadingIndicator="Editing..."
                            onClick={formik.handleSubmit}
                            disabled={Boolean(!formik.values.text.trim() || isLoading)}
                            startIcon={<EditIcon />}
                            fullWidth
                        >
                            Edit Copy
                        </LoadingButton>
                    </Paper>
                </Grid>

                <Grid xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Edited Text
                        </Typography>
                        <TextField 
                            fullWidth
                            multiline
                            minRows={12}
                            value={editedResponse || ''}
                            variant="outlined"
                            InputProps={{
                                readOnly: true,
                            }}
                            placeholder="Edited text will appear here..."
                            sx={{ 
                                mb: 2,
                                '& .MuiInputBase-input': {
                                    backgroundColor: '#f5f5f5'
                                }
                            }}
                        />
                        {editedResponse && (
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => {
                                    navigator.clipboard.writeText(editedResponse);
                                }}
                            >
                                Copy to Clipboard
                            </Button>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Page>
    )
}
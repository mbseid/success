import { Container, Grid, Stack, Typography } from '@mui/material';
import Page from '~/components/Page';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';


import { useSubmit } from '@remix-run/react';
import { redirect } from '@remix-run/node';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { gql, graphQLClient } from '~/graphql';
import { jsonToFormData, formDataToJson } from '~/utils/formUtils';


const promptTemplateValidation = yup.object({
    name: yup
        .string()
        .required(),
    systemMessage: yup
        .string()
        .required(),
    requestTemplate: yup
        .string()
        .required()
    });

const CreatePromptTemplate = gql`
mutation ($data: PromptTemplateInput!) {
  createPromptTemplate(data: $data) {
    id
  }
}
`;

export const action = async ({ request }) => {
  const formData = await request.formData();
  const promptTemplate = formDataToJson(formData)
  const { data } = await graphQLClient.mutate({
    mutation: CreatePromptTemplate,
    variables: {
      data: promptTemplate
    }
  })
  return redirect(`/assistant`);
}

export default function NewAssistantTemplate(){
    const submit = useSubmit()

    const input = (field) => {
        return <TextField
                fullWidth
                id={field}
                name={field}
                label={field}
                value={formik.values[field]}
                onChange={formik.handleChange}
                error={formik.touched[field] && Boolean(formik.errors[field])}
                helperText={formik.touched[field] && formik.errors[field]}
            />
    }

    const inputText = (field, label) => {
        return <TextField
                multiline
                fullWidth
                minRows={7}
                id={field}
                name={field}
                label={label}
                value={formik.values[field]}
                onChange={formik.handleChange}
                error={formik.touched[field] && Boolean(formik.errors[field])}
                helperText={formik.touched[field] && formik.errors[field]}
            />
    }
    const formik = useFormik({
        initialValues: {
            name: '',
            systemMessage: '',
            requestTemplate: ''
        },
        validationSchema: promptTemplateValidation,
        onSubmit: (values) => {
          submit(jsonToFormData(values), {
            method: "post",
            action: '/assistant/templates/new'
          })
        }
    });
    return (
      <Page title="Add Prompt Template">
        <Container>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom>
              Add Prompt Template
            </Typography>
          </Stack>
          <Grid container>
            <form onSubmit={formik.handleSubmit}>
              {input('name')}
              {inputText('systemMessage', 'System Message')}
              {inputText('requestTemplate', 'Request Template')}
              <Button color="primary" variant="contained" fullWidth type="submit">
                Submit
              </Button>
            </form>
          </Grid>
        </Container>
      </Page>
    );
};

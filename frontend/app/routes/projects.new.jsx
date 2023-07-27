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
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

const projectValidation = yup.object({
    name: yup
        .string()
        .required(),
    description: yup
        .string(),
    due: yup
        .date()
        .required(),
    });

const CreateProject = gql`
mutation ($data: ProjectInput!) {
  createProject(data: $data) {
    id
  }
}
`;

export const action = async ({ request }) => {
  const formData = await request.formData();
  const project = formDataToJson(formData)
  const { data } = await graphQLClient.mutate({
    mutation: CreateProject,
    variables: {
      data: project
    }
  })
  return redirect(`/`);
}

export default function NewProject(){
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
    const formik = useFormik({
        initialValues: {
            name: '',
            description: '',
            due: new Date()
        },
        validationSchema: projectValidation,
        onSubmit: (values) => {
          values.due = values.due.toISOString().slice(0,10);

          submit(jsonToFormData(values), {
            method: "post",
            action: '/projects/new'
          })
        }
    });
    return (
      <Page title="Add Person">
        <Container>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom>
              Add Project
            </Typography>
          </Stack>
          <Grid container>
            <form onSubmit={formik.handleSubmit}>
              {input('name')}
              {input('description')}
              <DesktopDatePicker
                label="Date"
                inputFormat="MM/dd/yyyy"
                value={formik.values['due']}
                onChange={(newDate) => formik.setFieldValue('due', newDate)}
                renderInput={(params) => <TextField {...params} />}
              />
              <Button color="primary" variant="contained" fullWidth type="submit">
                Submit
              </Button>
            </form>
          </Grid>
        </Container>
      </Page>
    );
};

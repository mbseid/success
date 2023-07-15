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


const personValidation = yup.object({
    name: yup
        .string()
        .required(),
    email: yup
        .string()
        .required(),
    team: yup
        .string()
        .required(),
    role: yup
        .string()
        .required(),
    });

const CreatePerson = gql`
mutation ($data: PersonInput!) {
  createPerson(data: $data) {
    id
  }
}
`;

export const action = async ({ request }) => {
  const formData = await request.formData();
  const person = formDataToJson(formData)
  const { data } = await graphQLClient.mutate({
    mutation: CreatePerson,
    variables: {
      data: person
    }
  })
  return redirect(`/people/${data.createPerson.id}`);
}

export default function NewPerson(){
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
            email: '',
            team: '',
            role: ''
        },
        validationSchema: personValidation,
        onSubmit: (values) => {
          submit(jsonToFormData(values), {
            method: "post",
            action: '/people/new'
          })
        }
    });
    return (
      <Page title="Add Person">
        <Container>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom>
              Add Person
            </Typography>
          </Stack>
          <Grid container>
            <form onSubmit={formik.handleSubmit}>
              {input('name')}
              {input('email')}
              {input('team')}
              {input('role')}
              <Button color="primary" variant="contained" fullWidth type="submit">
                Submit
              </Button>
            </form>
          </Grid>
        </Container>
      </Page>
    );
};

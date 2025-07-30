import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Container, Grid, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Page from '~/components/Page';
import { gql, graphQLClient } from '~/graphql';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { jsonToFormData, formDataToJson } from '~/utils/formUtils';
import { useSubmit } from '@remix-run/react';

const query = gql`
  query GetPerson($personId: ID!) {
    person(pk: $personId){
      id
      name
      email
      team
      role
    }
  }
`;

const UpdatePerson = gql`
mutation ($data: PersonInput!, $filters: PersonFilter) {
  updatePeople(data: $data, filters: $filters) {
    id
  }
}
`;

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

export async function loader({ request, params }){
  
    const { data } = await graphQLClient.query({
        query,
        variables: {
            personId: params.personId
        }
    });
    return json({ ...data });
}

export const action = async ({ request, params }) => {
  const formData = await request.formData();
  const person = formDataToJson(formData)
  const people = await graphQLClient.mutate({
    mutation: UpdatePerson,
    variables: {
      data: person,
      filters: {
        id: {
          exact: params.personId
        }
      }
    }
  })
  return redirect(`/people/${params.personId}`);
};

export default function EditPerson() {
  console.log("wupt")
    const { person } = useLoaderData();
    const submit = useSubmit();

    const input = (field, label) => {
        return <TextField
                fullWidth
                id={field}
                name={field}
                label={label || field}
                value={formik.values[field]}
                onChange={formik.handleChange}
                error={formik.touched[field] && Boolean(formik.errors[field])}
                helperText={formik.touched[field] && formik.errors[field]}
                sx={{ mb: 2 }}
            />
    }

    const formik = useFormik({
        initialValues: {
            name: person.name || '',
            email: person.email || '',
            team: person.team || '',
            role: person.role || ''
        },
        validationSchema: personValidation,
        onSubmit: (values) => {
          submit(jsonToFormData(values), {
            method: "post",
            action: `/people/${person.id}/edit`
          })
        }
    });

    return (
      <Page title="Edit Person2">
        <Container>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom>
              Edit Person
            </Typography>
          </Stack>
          <Grid container>
            <Grid item xs={12} md={6}>
              <form onSubmit={formik.handleSubmit}>
                <Stack spacing={2}>
                  {input('name', 'Name')}
                  {input('email', 'Email')}
                  {input('team', 'Team')}
                  {input('role', 'Role')}
                  <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Button color="primary" variant="contained" type="submit">
                      Save Changes
                    </Button>
                    <Button variant="outlined" href={`/people/${person.id}`}>
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              </form>
            </Grid>
          </Grid>
        </Container>
      </Page>
    );
}; 
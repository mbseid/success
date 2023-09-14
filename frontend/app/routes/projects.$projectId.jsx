
import { useState } from 'react';
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
    Box,
    Button,
    Container,
    Stack,
    TextField,
    Typography,
    Grid
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { gql, graphQLClient } from '~/graphql';
import Page from '~/components/Page';
import MarkdownBox from '~/components/MarkdownBox';
import { markDownToHtml } from '~/utils/markdown';

import { namedAction } from "remix-utils";
import { jsonToFormData, formDataToJson } from '~/utils/formUtils';


const query = gql`
query GetProject($projectId: ID!) {
    project(pk: $projectId) {
        id
        name
        description
        due
        complete
        notes
        order
    }
}
`

const UpdateLink = gql`
mutation ($data: ProjectPartialInput!, $filters: ProjectFilter) {
  updateProject(data: $data, filters: $filters) {
    id
  }
}
`;

export async function action({ request, params }) {
    const filter = {
        id: {
            exact: params.projectId
        }
    }

    return namedAction(request, {
        async complete() {
            const { data } = await graphQLClient.query({
                query: UpdateLink,
                variables: {
                    data: {
                        complete: true
                    },
                    filters: filter
                }
            });
            return redirect("/")
        },
        async update() {
            const formData = await request.formData();
            const values = formDataToJson(formData);
            const { data } = await graphQLClient.query({
                query: UpdateLink,
                variables: {
                    data: {
                        notes: values.notes
                    },
                    filters: filter
                }
            });
            return redirect(`/projects/${params.projectId}`)
        },
    });
}
export async function loader({ request, params }) {
    const { data } = await graphQLClient.query({
        query,
        variables: {
            projectId: params.projectId
        }
    });

    data.project.notes_html = markDownToHtml(data.project.notes)

    return json(data);
}

export const meta = ({ data }) => {
    return [{ title: `${data.project.name} | Project | Success` }];
}

function ProfileCover({ project, completeClick, editClick }) {
    const { name, description, due } = project;
    const [completeOpen, setCompleteOpen] = useState(false)

    const completeProject = () => {
        setCompleteOpen(false)
        completeClick()
    }

    return (
        <Box
            sx={{
                mt: { xs: 1, md: 0 },
                p: 2,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                textAlign: { xs: 'center', md: 'left' },
                display: 'flex',
                justifyContent: 'space-between',
            }}
        >
            <Stack>
                <Typography variant="h4">{name}</Typography>
                <Typography variant="button" sx={{ opacity: 0.72 }}>{`DUE: ${due}`}</Typography>
            </Stack>
            <Box>
                <Button sx={{ mr: 1 }} variant="outlined" color="info"
                    onClick={editClick}>
                    Edit
                </Button>
                <Button variant="contained" color="success"
                    onClick={() => setCompleteOpen(true)}>
                    Complete
                </Button>
                <Dialog
                    open={completeOpen}
                    onClose={() => setCompleteOpen(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">
                        {"Have you completed this project?"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Are you fully done with this body of work? Once complete, this project will
                            be hidden unless explicitly searched for.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCompleteOpen(false)}>No, more work</Button>
                        <Button onClick={completeProject} autoFocus>
                            Woot! I'm done
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>

    );
}


export default function ProjectView() {

    const [editNote, setEditNotes] = useState(false)
    const [notes, setNotes] = useState()

    const { project } = useLoaderData()

    const editNotes = () => {
        setNotes(project.notes)
        setEditNotes(true)
    }

    const saveNotes = () => {
        submit(jsonToFormData({
            notes
        }), {
            method: "post",
            action: `/projects/${project.id}?/update`,
            replace: true
        })
        setEditNotes(false)

    }

    const submit = useSubmit();

    const completeProject = () => {
        const values = {}
        submit(jsonToFormData(values), {
            method: "post",
            action: `/projects/${project.id}?/complete`
        })
    }

    const editProject = () => {

    }

    return (
        <Page title="People">
            <Container>
                <Stack spacing={3}>
                    {project ?
                        <>
                            <ProfileCover project={project} completeClick={completeProject} editClick={editProject} />
                            <Box sx={{
                                p: 2
                            }}>
                                {!editNote ?
                                    <Grid>
                                        <MarkdownBox dangerouslySetInnerHTML={{ __html: project.notes_html }} />

                                        <Button onClick={editNotes} variant="outlined">Modify Notes</Button>
                                    </Grid>
                                    :
                                    <>
                                        <TextField
                                            multiline
                                            fullWidth
                                            minRows={4}
                                            placeholder="Project Notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            sx={{
                                                '& fieldset': {
                                                    borderWidth: `1px !important`,
                                                    borderColor: (theme) => `${theme.palette.grey[500_32]} !important`,
                                                },
                                            }}
                                        />
                                        <Button onClick={saveNotes} variant="outlined">Save</Button>
                                    </>
                                }
                            </Box>
                        </>
                        :
                        <h6>loading....</h6>
                    }

                </Stack>
            </Container>
        </Page>
    );
}
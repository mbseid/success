import React, {useState} from 'react';

import Page from '../components/Page';
import {
  Button,
  Container,
  Stack,
  TextField,
  Box,
  Typography,
  Card,
  Grid
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Projects } from '~/api/projects'

import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from "react-router-dom";
import { useTracker } from 'meteor/react-meteor-data';
import { sortBy } from 'lodash';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import MarkdownBox from '~//components/MarkdownBox'
import { colorCode } from './utils/colors';



// ----------------------------------------------------------------------

ProfileCover.propTypes = {
};

function ProfileCover({ project, completeClick, editClick }) {
  const { name, description, due } = project;
  const [ completeOpen, setCompleteOpen ] = useState(false)

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
        backgroundColor: colorCode(project)
      }}
    >
      <Stack>
        <Typography variant="h4">{name}</Typography>
        <Typography variant="button" sx={{ opacity: 0.72 }}>{`DUE: ${due.toDateString().toUpperCase()}`}</Typography>
      </Stack>
      <Box>
          <Button sx={{mr: 1}} variant="outlined" color="info"
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

export default function ViewProject(){
  const [editNote, setEditNotes] = useState(false)
  const [notes, setNotes] = useState()

  const params = useParams();
  const navigate = useNavigate();

  const project = useTracker(() => {
    return Projects.findOne({_id: params.id})
  });

  const editNotes = () => {
      setNotes(project.notes)
      setEditNotes(true)
  }

  const saveNotes = () => {
      Projects.update(project._id, {
        $set: {
            notes: notes
        }
      })
      setEditNotes(false)
  }

  const completeProject = () => {
    Projects.update(project._id, {
        $set: {
            complete: true
        }
    })
    navigate('/projects')
  }
  const editProject = () => {
    navigate(`/projects/${project._id}/edit`)
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
              {!editNote?
                  <MarkdownBox>
                      <Box sx={{marginY: 3}}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {project.notes}
                        </ReactMarkdown>
                      </Box>
                      <Button onClick={editNotes} variant="outlined">Modify Notes</Button>
                  </MarkdownBox>
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
  )
}

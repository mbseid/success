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
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { People } from '~/api/people'

import PropTypes from 'prop-types';
import { useNavigate, useParams } from "react-router-dom";
import { useTracker } from 'meteor/react-meteor-data';
import { sortBy } from 'lodash';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

import MarkdownBox from '~//components/MarkdownBox'



// ----------------------------------------------------------------------

ProfileCover.propTypes = {
};

function ProfileCover({ person }) {
  const { name, team, role } = person;

  return (
    <Box
      sx={{
        mt: { xs: 1, md: 0 },
        textAlign: { xs: 'center', md: 'left' },
      }}
    >
      <Stack>
        <Typography variant="h4">{name}</Typography>
        <Typography sx={{ opacity: 0.72 }}>{`${role} @ ${team}`}</Typography>
      </Stack>
    </Box>

  );
}

function AddNoteForm({onSubmit, onCancel}){
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date())
  const submit = () => {
    const log = {
      note,
      date
    }
    onSubmit(log)
  }
  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <TextField
          multiline
          fullWidth
          minRows={4}
          placeholder="Record what you are discussing"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{
            '& fieldset': {
              borderWidth: `1px !important`,
              borderColor: (theme) => `${theme.palette.grey[500_32]} !important`,
            },
          }}
        />

        <DesktopDatePicker
          label="Date"
          inputFormat="MM/dd/yyyy"
          value={date}
          onChange={(newDate) => setDate(newDate)}
          renderInput={(params) => <TextField {...params} />}
        />
      </Stack>

      <Box
        sx={{
          mt: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'end',
          flexDirection: 'row-reverse',
          columnGap: '2rem'
        }}
      >
        <Button variant="contained" onClick={submit}>Save</Button>
        <Button variant="outlined" color="error" onClick={onCancel}>Cancel</Button>
      </Box>
    </Card>
  )
}

export default function ViewPerson(){
  const [addNote, setAddNote] = useState(false)

  const params = useParams();
  const navigate = useNavigate();

  const person = useTracker(() => {
    return People.findOne({_id: params.id})
  });

  const submitNote = (log) => {
    People.update(person._id, {
      $push: {
        log
      }
    })
    setAddNote(false)
  }
  return (
    <Page title="People">
      <Container>
        <Stack spacing={3}>
          {person ?
          <>
            <ProfileCover person={person} />
            {!addNote?
              <Grid container>
                <Grid item s={3}>
                  <Button variant="contained" onClick={() => setAddNote(true)}>
                    Add Note
                  </Button>
                </Grid>
              </Grid>
            :
              <AddNoteForm
                onSubmit={submitNote}
                onCancel={() => setAddNote(false)}
                />
            }
            <Timeline>
              {sortBy(person.log, 'date').reverse().map((log, index) => {
                return (
                  <TimelineItem key={index}>
                    <TimelineOppositeContent color="text.secondary" style={{flex: 0.1}}>
                      {log.date.toDateString()}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <MarkdownBox>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                          {log.note}
                        </ReactMarkdown>
                      </MarkdownBox>
                    </TimelineContent>
                  </TimelineItem>
                )
              })}
            </Timeline>
          </>
          :
          <h6>loading....</h6>
          }

        </Stack>
      </Container>
    </Page>
  )
}

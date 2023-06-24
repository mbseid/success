import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { useState } from 'react';
import { gql, graphQLClient } from '~/graphql';

import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import Page from '~/components/Page';

import { markDownToHtml } from '~/utils/markdown';

import MarkdownBox from '~/components/MarkdownBox';

import { jsonToFormData } from '~/utils/formUtils';

import lodash from 'lodash';

import { parseISO } from 'date-fns'


const query = gql`
query GetPerson($personId: ID!) {
    person(pk: $personId) {
        id
        name
        team
        role
        logs {
            id
            note
            date
        }
    }
}
`

export async function loader({ request, params }){
    const { data } = await graphQLClient.query({
        query,
        variables: {
          personId: params.personId
        }
    });

    const mappedLogs = data.person.logs.map((log) => {
      return {
        id: log.id,
        note: markDownToHtml(log.note),
        date: log.date
      }

    })
    let newData = lodash.cloneDeep(data)
    lodash.set(newData, 'person.logs', mappedLogs)

    return json(newData);
}


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
      date: date.toISOString().slice(0,10)
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
  const { person } = useLoaderData();
  const submit = useSubmit();

  const submitNote = (log) => {
    submit(jsonToFormData(log), {
      method: 'post',
      action: `/people/${person.id}/log`
    })
  }

  const logs = person.logs.map((l) => {
    return {
      ...l,
      date: parseISO(l.date)
    }
  })
  
  return (
    <Page title="People">
      <Container>
        <Stack spacing={3}>
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
                {lodash.sortBy(logs, 'date').reverse().map((log) => {
                return (
                    <TimelineItem key={log.id}>
                      <TimelineOppositeContent color="text.secondary" style={{flex: 0.1}}>
                          {log.date.toDateString()}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                          <TimelineDot />
                          <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                          <MarkdownBox dangerouslySetInnerHTML={{__html: log.note}}>
                          </MarkdownBox>
                      </TimelineContent>
                    </TimelineItem>
                )
                })}
            </Timeline>
        </Stack>
      </Container>
    </Page>
  )
}

import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Projects } from '~/api/projects';
import { Me } from '~/api/me';

import TextField from '@mui/material/TextField';
import { Link as RouterLink } from 'react-router-dom';
// components
import Page from '../components/Page';
import Iconify from '../components/Iconify';
import Scrollbar from '../components/Scrollbar';
import {
  Card,
  Box,
  Table,
  Stack,
  Avatar,
  Button,
  Checkbox,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableSortLabel,
  TableContainer,
  TablePagination,
  Link,
} from '@mui/material';
import TableHead from '../components/TableHead';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { colorCode } from './utils/colors';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'due', label: 'Due Date', alignRight: false },
  { id: '' },
];

export function ProjectList(){
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  const {projects, me} = useTracker(() => {
    return {
      projects: Projects.find({complete: false}).fetch(),
      me: Me.findOne({})
    }
  }, []);

  const handleRequestSort = () => {}

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

  }



  return (
    <Page title="Projects">
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Projects
          </Typography>
          <Button variant="contained" component={RouterLink} to="/projects/new" startIcon={<Iconify icon="eva:plus-fill" />}>
            New Project
          </Button>
        </Stack>

        <Card>
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <TableHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  onRequestSort={handleRequestSort}
                />
              <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable">
                  {(provided, snapshot) => (
                    <TableBody
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                    {projects.map((project, index) => {
                      const { _id, name, due } = project;

                      return (
                        <Draggable key={_id} draggableId={_id} index={index}>
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                backgroundColor: colorCode(project)
                              }}
                            >
                              <TableCell component="th" scope="row">
                                <Link component={RouterLink} to={`/projects/${_id}`}>
                                  {name}
                                </Link>
                              </TableCell>
                              <TableCell align="left">{due.toDateString()}</TableCell>
                              <TableCell align="right">
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    </TableBody>
                    )}
                </Droppable>
              </DragDropContext>
            </Table>
          </TableContainer>
        </Card>
      </Container>
    </Page>
  );
}

import { useState } from 'react';
import { ListItem, ListItemText, List, Button, Grid, Typography } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import TextField from '@mui/material/TextField';
import { useFetcher, Link } from '@remix-run/react';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree';


const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",

    // change background colour if dragging
    background: isDragging ? "lightgreen" : "inherit",

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? "lightblue" : "inherit",
    padding: 8,
});

export default function ProjectList({ projects }) {

    const [localItems, setLocalItems] = useState(projects)
    //const [quickCreateProjectName, setQucikCreateProjectName] = useState("")
    // const []

    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        const projectId = result.draggableId
        const order = result.source.index

        setLocalItems((prev) => {
            const temp = [...prev];
            const d = temp[result.destination.index];
            temp[result.destination.index] = temp[result.source.index];
            temp[result.source.index] = d;

            fetch(`/projects/${projectId}/order`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                order
              })  
            })

            return temp;
        });
    }

    return (
        <Grid container
                >
            {/* <TextField 
                label="Quick Add Project"
                variant="outlined"
                value={quickCreateProjectName}
                onChange={(e) => setCreateProjectName(e.target.value)}
                /> */}
            <Grid container padding={2} justifyContent="space-between">
                <Grid item>
                <Typography variant="h5" gutterBottom
                            sx={{
                              py: 1,
                              textAlign: 'center'
                            }}>
                  <AccountTreeIcon /> Projects
                </Typography>
                </Grid>
                <Grid item xs={4}>
                    <Button to={`/projects/new`}
                            component={Link}
                            variant="contained"
                            endIcon={<AddIcon />} >
                        Create Project
                    </Button> 
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={12}>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="droppable">
                            {(provided, snapshot) => (
                                <List
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    style={getListStyle(snapshot.isDraggingOver)}
                                >
                                    {localItems.map((item, index) => (
                                        <Draggable key={item.id} draggableId={item.id} index={index}>
                                            {(provided, snapshot) => (
                                                <ListItem
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={getItemStyle(
                                                        snapshot.isDragging,
                                                        provided.draggableProps.style
                                                    )}
                                                >
                                                    <ListItemText
                                                        primary={item.name}
                                                        secondary={item.due}
                                                    />
                                                </ListItem>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </List>
                            )}
                        </Droppable>
                    </DragDropContext>
                </Grid>
            </Grid>
        </Grid>
        
    );
}
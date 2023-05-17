import palette from '~//theme/palette'

export function colorCode(project){
  const days = Math.round(
    (project.due - (new Date())) / (1000 * 3600 * 24)
  );

  if( days > 14 ){
    return null;
  } else if ( days > 0){
    return palette.warning.lighter;
  } else {
    return palette.error.lighter;
  }
}

import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(({ spacing }) => ({
    container: {
        width: spacing(120),
    },
    buttonContainer: {
        padding: spacing(2),
    },
}));

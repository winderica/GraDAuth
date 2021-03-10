import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(({ spacing }) => ({
    container: {
        width: spacing(100),
    },
    button: {
        marginTop: spacing(2),
    },
}));

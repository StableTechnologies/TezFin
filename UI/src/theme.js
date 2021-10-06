import { createTheme, adaptV4Theme } from '@mui/material/styles';
const theme = createTheme(adaptV4Theme({
   typography: {
    fontFamily: "Poppins, Inter"
   }
}));

export default theme;
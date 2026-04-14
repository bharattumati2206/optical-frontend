import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#465fff',
    },
    secondary: {
      main: '#16b364',
    },
    background: {
      default: '#f5f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#101828',
      secondary: '#667085',
    },
    divider: '#eaecf0',
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: ['Plus Jakarta Sans', 'Manrope', 'Segoe UI', 'sans-serif'].join(','),
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #eaecf0',
          boxShadow: '0 2px 4px rgba(16, 24, 40, 0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

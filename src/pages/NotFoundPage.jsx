import { Box, Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Stack spacing={1.5} textAlign="center">
        <Typography variant="h3">404</Typography>
        <Typography color="text.secondary">Page not found.</Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained">
          Back to Dashboard
        </Button>
      </Stack>
    </Box>
  )
}

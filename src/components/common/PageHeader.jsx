import { Stack, Typography } from '@mui/material'

export default function PageHeader({ title, subtitle, action }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={1.5}
    >
      <Stack spacing={0.4}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' } }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>

      {action || null}
    </Stack>
  )
}

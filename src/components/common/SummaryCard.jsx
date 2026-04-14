import PropTypes from 'prop-types'
import { Avatar, Box, Card, Stack, Typography } from '@mui/material'

function formatDisplayValue(value, isCurrency) {
  if (isCurrency) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  }

  return new Intl.NumberFormat('en-IN').format(Number(value || 0))
}

const TONES = {
  blue: {
    from: 'rgba(59, 130, 246, 0.14)',
    to: 'rgba(14, 165, 233, 0.08)',
    badge: 'rgba(37, 99, 235, 0.2)',
    glow: 'rgba(37, 99, 235, 0.24)',
    text: '#123153',
    muted: '#2f4f73',
  },
  violet: {
    from: 'rgba(139, 92, 246, 0.14)',
    to: 'rgba(99, 102, 241, 0.08)',
    badge: 'rgba(99, 102, 241, 0.2)',
    glow: 'rgba(99, 102, 241, 0.22)',
    text: '#2d2362',
    muted: '#4d4583',
  },
  teal: {
    from: 'rgba(20, 184, 166, 0.14)',
    to: 'rgba(6, 182, 212, 0.08)',
    badge: 'rgba(13, 148, 136, 0.2)',
    glow: 'rgba(13, 148, 136, 0.22)',
    text: '#0f3b3c',
    muted: '#2a5a5b',
  },
  rose: {
    from: 'rgba(244, 63, 94, 0.14)',
    to: 'rgba(249, 115, 22, 0.08)',
    badge: 'rgba(225, 29, 72, 0.2)',
    glow: 'rgba(225, 29, 72, 0.2)',
    text: '#4f2230',
    muted: '#754150',
  },
}

export default function SummaryCard({ title, value, isCurrency = false, caption = '', icon = null, tone = 'blue' }) {
  const palette = TONES[tone] || TONES.blue

  return (
    <Card
      sx={{
        p: 2.1,
        minHeight: 142,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(140deg, ${palette.from} 0%, ${palette.to} 100%)`,
        borderColor: 'rgba(255, 255, 255, 0.38)',
        boxShadow: '0 8px 18px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: -28,
          top: -32,
          width: 110,
          height: 110,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${palette.glow} 0%, rgba(255,255,255,0) 72%)`,
          pointerEvents: 'none',
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack spacing={0.9}>
          <Typography variant="body2" sx={{ color: palette.muted }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ color: palette.text }}>
            {formatDisplayValue(value, isCurrency)}
          </Typography>
          <Typography variant="caption" sx={{ color: palette.muted, fontWeight: 600 }}>
            {caption}
          </Typography>
        </Stack>

        <Avatar sx={{ width: 42, height: 42, bgcolor: palette.badge, color: palette.text }}>{icon}</Avatar>
      </Stack>
    </Card>
  )
}

SummaryCard.propTypes = {
  caption: PropTypes.string,
  icon: PropTypes.node,
  isCurrency: PropTypes.bool,
  tone: PropTypes.oneOf(['blue', 'violet', 'teal', 'rose']),
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
}

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()

  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(form)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background:
          'radial-gradient(circle at top right, rgba(70,95,255,0.18), transparent 30%), radial-gradient(circle at bottom left, rgba(22,179,100,0.16), transparent 32%), #f7f9fc',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 430 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.4} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Optical billing and management panel
              </Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <TextField
              label="Username or Email"
              name="username"
              value={form.username}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
            />

            <Button type="submit" variant="contained" disabled={loading} size="large" sx={{ mt: 0.5 }}>
              {loading ? <CircularProgress size={21} color="inherit" /> : 'Login'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

import { useState } from 'react'
import { Alert, Button, Card, CardContent, Grid, MenuItem, Stack, TextField } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { customerService } from '../services/customerService'

const initialForm = {
  name: '',
  phone: '',
  email: '',
  age: '',
  gender: 'MALE',
  address: '',
}

function validateCustomerForm(form) {
  const errors = {}

  if (!form.name.trim()) {
    errors.name = 'Customer name is required.'
  }

  if (!String(form.age).trim()) {
    errors.age = 'Age is required.'
  } else if (Number(form.age) <= 0) {
    errors.age = 'Age must be greater than 0.'
  }

  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (!/^\d{10}$/.test(form.phone.trim())) {
    errors.phone = 'Phone number must be 10 digits.'
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

export default function CustomerCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async () => {
    const validationErrors = validateCustomerForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setError('Please correct the highlighted fields.')
      return
    }

    setSaving(true)
    setError('')
    setFieldErrors({})

    try {
      const createdCustomer = await customerService.createCustomer({
        ...form,
        age: form.age ? Number(form.age) : null,
      })

      const customerId = createdCustomer?.id || createdCustomer?.customerId
      navigate(customerId ? `/customers/${customerId}` : '/customers')
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create customer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2.2}>
      <PageHeader
        title="Create Customer"
        subtitle="Register a new customer before adding prescriptions or invoices."
        action={<Button variant="outlined" onClick={() => navigate('/customers')}>Back to Customers</Button>}
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Customer Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                error={Boolean(fieldErrors.phone)}
                helperText={fieldErrors.phone}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                required
                type="number"
                label="Age"
                name="age"
                value={form.age}
                onChange={handleChange}
                error={Boolean(fieldErrors.age)}
                helperText={fieldErrors.age}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField select fullWidth label="Gender" name="gender" value={form.gender} onChange={handleChange}>
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
                <MenuItem value="OTHERS">Others</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline minRows={3} label="Address" name="address" value={form.address} onChange={handleChange} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="outlined" onClick={() => navigate('/customers')}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Create Customer'}
        </Button>
      </Stack>
    </Stack>
  )
}

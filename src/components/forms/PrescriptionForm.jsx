import PropTypes from 'prop-types'
import { Box, Grid, Stack, TextField, Typography } from '@mui/material'

const EYE_TABLE_COLUMNS = '1.25fr repeat(4, 1fr)'

const EYE_ROWS = [
  {
    label: 'RIGHT (OD)',
    tone: { color: '#5A5CF6', bg: '#EEF0FF' },
    fields: [
      { name: 'rightEyeSph', placeholder: 'SPH' },
      { name: 'rightEyeCyl', placeholder: 'CYL' },
      { name: 'rightEyeAxis', placeholder: 'AXIS' },
      { name: 'additionPower', placeholder: 'ADD' },
    ],
  },
  {
    label: 'LEFT (OS)',
    tone: { color: '#0EA47A', bg: '#E8FAF4' },
    fields: [
      { name: 'leftEyeSph', placeholder: 'SPH' },
      { name: 'leftEyeCyl', placeholder: 'CYL' },
      { name: 'leftEyeAxis', placeholder: 'AXIS' },
      { name: 'additionPower', placeholder: 'ADD' },
    ],
  },
]

function PrescriptionField({ value, name, placeholder, onChange, disabled = false }) {
  return (
    <TextField
      fullWidth
      size="small"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      sx={{
        '& .MuiOutlinedInput-root': {
          height: 36,
          borderRadius: 1.5,
          backgroundColor: '#fff',
        },
      }}
    />
  )
}

export default function PrescriptionForm({ value, onChange }) {
  const handleChange = (event) => {
    const { name, value: nextValue } = event.target
    onChange((prev) => ({ ...prev, [name]: nextValue }))
  }

  return (
    <Stack spacing={1.4}>
      <Box
        sx={{
          border: '1px solid #DEE5F2',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: EYE_TABLE_COLUMNS,
              backgroundColor: '#EDF2FB',
              borderBottom: '1px solid #DEE5F2',
            }}
          >
            {['Eye', 'SPH', 'CYL', 'AXIS', 'ADD'].map((header, index) => (
              <Box
                key={header}
                sx={{
                  px: 1.4,
                  py: 1,
                  borderRight: index === 4 ? 'none' : '1px solid #DEE5F2',
                }}
              >
                <Typography variant="caption" sx={{ color: '#60708A', fontWeight: 700 }}>
                  {header}
                </Typography>
              </Box>
            ))}
          </Box>

          {EYE_ROWS.map((row, rowIndex) => (
            <Box
              key={row.label}
              sx={{
                display: 'grid',
                gridTemplateColumns: EYE_TABLE_COLUMNS,
                borderTop: rowIndex === 0 ? 'none' : '1px solid #DEE5F2',
              }}
            >
              <Box
                sx={{
                  px: 1.2,
                  py: 1,
                  borderRight: '1px solid #DEE5F2',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 34,
                    px: 1.2,
                    borderRadius: 1.5,
                    backgroundColor: row.tone.bg,
                    color: row.tone.color,
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {row.label}
                </Box>
              </Box>

              {row.fields.map((field, index) => (
                <Box
                  key={`${row.label}-${field.name}-${field.placeholder}`}
                  sx={{
                    p: 0.7,
                    borderRight: index === row.fields.length - 1 ? 'none' : '1px solid #DEE5F2',
                  }}
                >
                  <PrescriptionField
                    name={field.name}
                    value={value[field.name]}
                    placeholder={field.placeholder}
                    onChange={handleChange}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </Box>

        <Stack spacing={1} sx={{ p: 1.2, display: { xs: 'flex', md: 'none' } }}>
          {EYE_ROWS.map((row) => (
            <Grid container spacing={1} alignItems="center" key={row.label}>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 34,
                    px: 1.2,
                    borderRadius: 1.5,
                    backgroundColor: row.tone.bg,
                    color: row.tone.color,
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {row.label}
                </Box>
              </Grid>

              {row.fields.map((field) => (
                <Grid key={`${row.label}-${field.name}-${field.placeholder}`} size={{ xs: 6 }}>
                  <PrescriptionField
                    name={field.name}
                    value={value[field.name]}
                    placeholder={field.placeholder}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
            </Grid>
          ))}
        </Stack>
      </Box>

      <Grid container spacing={1.2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Typography variant="caption" sx={{ color: '#60708A', fontWeight: 700, display: 'block', mb: 0.5 }}>
            PD
          </Typography>
          <PrescriptionField name="pd" value={value.pd} placeholder="PD" onChange={handleChange} />
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
          <Typography variant="caption" sx={{ color: '#60708A', fontWeight: 700, display: 'block', mb: 0.5 }}>
            Remarks
          </Typography>
          <TextField
            fullWidth
            size="small"
            name="remarks"
            value={value.remarks}
            onChange={handleChange}
            placeholder="e.g. Use BlueCut lenses, patient experiences headache"
            sx={{
              '& .MuiOutlinedInput-root': {
                minHeight: 36,
                borderRadius: 1.5,
                backgroundColor: '#fff',
              },
            }}
          />
        </Grid>
      </Grid>
    </Stack>
  )
}

PrescriptionField.propTypes = {
  disabled: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}

PrescriptionForm.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    additionPower: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    leftEyeAxis: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    leftEyeCyl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    leftEyeSph: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    pd: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    prescriptionType: PropTypes.string.isRequired,
    remarks: PropTypes.string.isRequired,
    rightEyeAxis: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    rightEyeCyl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    rightEyeSph: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
}

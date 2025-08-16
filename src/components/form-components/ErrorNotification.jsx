import React from 'react'
import { Alert, Box } from '@mui/material'

const ErrorNotification = ({ 
  show = false, 
  message = "Please fill in all required fields correctly.",
  severity = "error",
  sx = {} 
}) => {
  if (!show) return null

  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Alert severity={severity}>
        {message}
      </Alert>
    </Box>
  )
}

export default ErrorNotification
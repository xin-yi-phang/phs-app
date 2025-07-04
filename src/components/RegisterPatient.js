import React from 'react'
import { useState, useContext, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllPatientNames, getPreRegDataById, getPreRegDataByName } from '../services/mongoDB'
import { FormContext } from '../api/utils.js'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  SvgIcon,
  CircularProgress,
} from '@mui/material'
import { Search as SearchIcon } from 'react-feather'
import Autocomplete from '@mui/material/Autocomplete'
import { updateAllStationCounts } from '../services/stationCounts'

const RegisterPatient = (props) => {
  const [isLoadingQueueNumber, setIsLoadingQueueNumber] = useState(false)
  const [isLoadingPatientName, setIsLoadingPatientName] = useState(false)
  const [values, setValues] = useState({
    isQueueNumber: true,
    selectedValue: null,
  })
  const [patientNames, setPatientNames] = useState([])
  const { updatePatientInfo } = useContext(FormContext)
  const navigate = useNavigate()
  const ref = useRef()

  useEffect(() => {
    const getPatientNames = async () => {
      const data = await getAllPatientNames('patients')
      setPatientNames(data)
    }
    getPatientNames()
  }, [])

  const handleQueueNumberInput = (event) => {
    const value = event.target.value
    if (value >= 0 || value === '') {
      setValues({
        isQueueNumber: true,
        selectedValue: parseInt(value),
      })
    } else {
      event.target.value = 0
    }
  }

  const handlePatientNameInput = (params) => {
    return (
      <TextField
        {...params}
        label='Patient name'
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SvgIcon fontSize='small' color='action'>
                <SearchIcon />
              </SvgIcon>
            </InputAdornment>
          ),
          ...params.InputProps,
          type: 'search',
        }}
      />
    )
  }

  const handlePatientNameSelect = (event, value) => {
    console.log(event.target.id)
    setValues({
      isQueueNumber: false,
      selectedValue: value,
    })
  }

  const handleSubmitQueueNumber = async () => {
    setIsLoadingQueueNumber(true)
    const value = values.selectedValue
    // if response is successful, update state for curr id and redirect to dashboard timeline for specific id
    const data = await getPreRegDataById(value, 'patients')
    console.log(data)
    if ('initials' in data) {
      updatePatientInfo(data)
      await updateAllStationCounts(data.queueNo)
      setIsLoadingQueueNumber(false)
      navigate('/app/dashboard', { replace: true })
    } else if ('age' in data) {
      updatePatientInfo(data)
      setIsLoadingQueueNumber(false)
      navigate('/app/dashboard', { replace: true })
    } else {
      // if response is unsuccessful/id does not exist, show error style/popup.
      alert('Unsuccessful. There is no patient with this queue number.')
      setIsLoadingQueueNumber(false)
    }
  }
  const handleSubmitPatientName = async () => {
    setIsLoadingPatientName(true)
    const value = values.selectedValue.initials
    const data = await getPreRegDataByName(value, 'patients')
    if ('initials' in data) {
      updatePatientInfo(data)
      await updateAllStationCounts(data.queueNo)
      setIsLoadingPatientName(false)
      navigate('/app/dashboard', { replace: true })
    } else {
      alert('Unsuccessful. There is no patient with this name.')
      setIsLoadingPatientName(false)
    }
  }

  return (
    <Card {...props}>
      <CardContent>
        <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
          <Button
            color='secondary'
            size='large'
            type='submit'
            variant='contained'
            href='/app/reg'
            sx={{ marginTop: '10px', marginBottom: '20px' }}
          >
            Register
          </Button>
          <Typography color='textSecondary' gutterBottom variant='h5'>OR</Typography>
          <Typography color='textPrimary' gutterBottom variant='h4'>
            Enter queue number below
          </Typography>
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SvgIcon fontSize='small' color='action'>
                    <SearchIcon />
                  </SvgIcon>
                </InputAdornment>
              ),
            }}
            placeholder='Queue number'
            size='small'
            variant='outlined'
            onChange={handleQueueNumberInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { //default it here
                handleSubmitQueueNumber();
              }
            }}
            sx={{ marginTop: '5px', marginBottom: '5px' }}
          />
          {isLoadingQueueNumber ? (
            <CircularProgress />
          ) : (
            <Button
              ref={ref}
              color='primary'
              size='large'
              type='submit'
              variant='contained'
              onClick={handleSubmitQueueNumber}
              sx={{ marginTop: '10px', marginBottom: '20px' }}
            >
              Go
            </Button>
          )}
          <Typography color='textSecondary' gutterBottom variant='h5'>
            OR
          </Typography>
          <Typography color='textPrimary' gutterBottom variant='h4'>
            Select name below
          </Typography>
          <Autocomplete
            sx={{ width: '300px', marginTop: '5px', marginBottom: '5px' }}
            freeSolo
            size='small'
            disableClearable
            options={patientNames}
            getOptionLabel={(option) => option.initials}
            renderInput={handlePatientNameInput}
            /* onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.defaultMuiPrevented = true
              }
            }} */
            onChange={handlePatientNameSelect}
          />
          {isLoadingPatientName ? (
            <CircularProgress />
          ) : (
            <Button
              ref={ref}
              color='primary'
              size='large'
              type='submit'
              variant='contained'
              onClick={handleSubmitPatientName}
              className='button'
              sx={{ marginTop: '10px', marginBottom: '20px' }}
            >
              Go
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default RegisterPatient

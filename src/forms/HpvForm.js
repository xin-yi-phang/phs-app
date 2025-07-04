import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SimpleSchema2Bridge from 'uniforms-bridge-simple-schema-2'
import SimpleSchema from 'simpl-schema'

import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'

import { AutoForm } from 'uniforms'
import { SubmitField, ErrorsField, SelectField } from 'uniforms-mui'
import { submitForm } from '../api/api.js'
import { FormContext } from '../api/utils.js'
import { getSavedData } from '../services/mongoDB'
import './fieldPadding.css'

const schema = new SimpleSchema({
  HPV1: {
    type: Array,
    optional: false,
  },
  'HPV1.$': {
    type: String,
    allowedValues: ['Has completed the registration forms and finished the on-site testing.'],
  },
})

const formName = 'hpvForm'

const HpvForm = () => {
  const { patientId } = useContext(FormContext)
  const [loading, isLoading] = useState(false)
  const [saveData, setSaveData] = useState({})
  
  const form_schema = new SimpleSchema2Bridge(schema)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const savedData = await getSavedData(patientId, formName)
      setSaveData(savedData)
    }
    fetchData()
  }, [])

  const formOptions = {
    HPV1: [
      {
        label: 'Has completed the registration forms and finished the on-site testing.',
        value: 'Has completed the registration forms and finished the on-site testing.',
      },
    ],
  }

  const newForm = () => (
    <AutoForm
      schema={form_schema}
      className='fieldPadding'
      onSubmit={async (model) => {
        isLoading(true)
        const response = await submitForm(model, patientId, formName)
        if (response.result) {
          setTimeout(() => {
            alert('Successfully submitted form')
            navigate('/app/dashboard', { replace: true })
          }, 80)
        } else {
          setTimeout(() => {
            alert(`Unsuccessful. ${response.error}`)
          }, 80)
        }
        isLoading(false)
      }}
      model={saveData}
    >
      <div className='form--div'>
        <h1>On-Site HPV Testing</h1>
        <h3>Registration & Testing</h3>
        <SelectField
          appearance='checkbox'
          checkboxes
          name='HPV1'
          label='HPV1'
          options={formOptions.HPV1}
        />
      </div>
      <ErrorsField />
      <div>{loading ? <CircularProgress /> : <SubmitField inputRef={() => { }} />}</div>
      <br />
      <Divider />
    </AutoForm>
  )

  return (
    <Paper elevation={2} p={0} m={0}>
      {newForm()}
    </Paper>
  )
}

export default HpvForm

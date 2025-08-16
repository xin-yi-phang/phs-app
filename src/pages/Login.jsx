import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import mongoDB, { hashPassword, profilesCollection } from '../services/mongoDB'
import * as Realm from 'realm-web'
import * as Yup from 'yup'
import { Formik } from 'formik'
import Link from '@mui/material/Link'
import CircularProgress from '@mui/material/CircularProgress'
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { useContext, useState } from 'react'
import { LoginContext } from '../App.jsx'
import { Visibility, VisibilityOff } from '@mui/icons-material'

const Login = () => {
  const navigate = useNavigate()
  const [accountOptions, /*setAccountOptions*/] = useState(['Guest', 'Admin'])
  const [accountOption, setAccountOption] = useState('Guest')
  const { isLogin } = useContext(LoginContext)
  const { setProfile } = useContext(LoginContext)
  const [loading, isLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const handleClickShowPassword = () => setShowPassword(!showPassword)
  const handleMouseDownPassword = () => setShowPassword(!showPassword)


  // we need to allow anonymous users to sign up(settle in mongoDB)
  const handleSignUp = async (values) => {
    isLoading(true)
    try {
      const email = values.email.trim().toLowerCase();
      // Log in as anonymous user if not already logged in
      if (!mongoDB.currentUser) {
        const credentials = Realm.Credentials.anonymous();
        await mongoDB.logIn(credentials);
      }
      const mongoConnection = mongoDB.currentUser.mongoClient('mongodb-atlas');
      const guestProfiles = mongoConnection.db('phs').collection('profiles');
      const searchUnique = await guestProfiles.findOne({ username: email });
      if (searchUnique === null) {
        if (values.password.length < 6) {
          alert('Password must contain at least one six characters!');
          isLoading(false);
        } else {
          const hashHex = await hashPassword(values.password);
          await guestProfiles.insertOne({
            username: email,
            email: email,
            password: hashHex,
            is_admin: false,
            lastLogin: null,
          });
          alert('Account Created: ' + email + '\nYou can now sign in.');
          setTimeout(() => setIsSignUp(false), 1500);
          isLoading(false);
        }
      } else {
        alert('Username ' + email + ' taken! Try another username!');
        isLoading(false);
      }
    } catch (e) {
      alert('Contact Developer: ' + e);
      isLoading(false);
    }
  }


  const handleLogin = async (values) => {
    try {
      const email = values.email.trim().toLowerCase();
      // fix uid?
      isLoading(true)
      if (accountOption === accountOptions[1]) {
        //admin
        const credentials = Realm.Credentials.emailPassword(email, values.password)
        //console.log("test")
        // Authenticate the user
        // eslint-disable-next-line
        const user = await mongoDB.logIn(credentials)
        const userProfile = profilesCollection()
        const profile = await userProfile.findOne({ username: email })
        setProfile(profile)
        isLogin(true)
      } else {
        const hashHex = await hashPassword(values.password)
        const credentials = Realm.Credentials.function({
          username: email,
          password: hashHex,
        })
        // Authenticate the user
        // eslint-disable-next-line
        console.log(credentials)
        const user = await mongoDB.logIn(credentials)
        const userProfile = profilesCollection()
        const profile = await userProfile.findOne({ username: email })
        isLogin(true)
        setProfile(profile)
      }
      const userProfile = profilesCollection()
      await userProfile.updateOne(
        {
          username: email,
        },
        { $set: { lastLogin: new Date() } },
      )
      isLoading(false)
      navigate('/app/registration', { replace: true })
    } catch (err) {
      isLoading(false)
      alert('Invalid Username or Password!')
    }
    isLoading(false)
  }

  const handleReset = async (values) => {
    const email = values.email
    try {
      await mongoDB.emailPasswordAuth.sendResetPasswordEmail(email)
      alert('Email sent to your account!')
    } catch (e) {
      alert('Invalid Email!')
    }
  }

  return (
     <>
      <Helmet>
        <title>{isSignUp ? 'Sign up' : 'Login'}</title>
      </Helmet>
      <Box
        sx={{
          backgroundColor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth='sm'>
          <Formik
            initialValues={{
              email: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={Yup.object().shape({
              email: Yup.string()
                .email('Must be a valid email')
                .max(255)
                .required('Username is required, you can use your email'),
              password: Yup.string()
                .min(6, 'Password must be at least 6 characters')
                .max(255)
                .required('Password is required'),
              ...(isSignUp && {
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('password'), null], 'Passwords must match')
                  .required('Confirm Password is required'),
              }),
            })}
            onSubmit={(values) => {
              if (isSignUp) {
                handleSignUp(values)
              } else {
                handleLogin(values)
              }
            }}
          >
            {({
              errors,
              handleBlur,
              handleChange,
              handleSubmit,
              touched,
              values,
            }) => (
              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 3 }}>
                  <Typography color='textPrimary' variant='h2'>
                    {isSignUp ? 'Sign up' : 'Sign in'}
                  </Typography>
                  <Typography color='textSecondary' gutterBottom variant='body2'>
                    PHS {new Date().getFullYear()}
                  </Typography>
                  {!isSignUp && (
                    <select
                      onChange={(e) => {
                        setAccountOption(e.target.value)
                      }}
                    >
                      {accountOptions.map((account) => (
                        <option name={'account'} value={account} key={account}>
                          {account}
                        </option>
                      ))}
                    </select>
                  )}
                </Box>
                <TextField
                  fullWidth
                  helperText={touched.email && errors.email}
                  label='Username'
                  margin='normal'
                  name='email'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.email}
                  variant='outlined'
                />
                <TextField
                  fullWidth
                  helperText={touched.password && errors.password}
                  label='Password'
                  margin='normal'
                  name='password'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  variant='outlined'
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          aria-label='toggle password visibility'
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          size='large'
                        >
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {isSignUp && (
                  <TextField
                    fullWidth
                    helperText={touched.confirmPassword && errors.confirmPassword}
                    label='Confirm Password'
                    margin='normal'
                    name='confirmPassword'
                    onBlur={handleBlur}
                    onChange={handleChange}
                    type='password'
                    value={values.confirmPassword}
                    variant='outlined'
                  />
                )}

                <Box sx={{ py: 2 }}>
                  <Button
                    color='primary'
                    fullWidth
                    size='large'
                    type='submit'
                    variant='contained'
                    disabled={loading}
                    sx={{
                      ...(loading && {
                        backgroundColor: '#bdbdbd',
                        color: '#fff',
                      }),
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                        {isSignUp ? 'Signing up...' : 'Logging in...'}
                      </>
                    ) : (
                      isSignUp ? 'Sign up' : 'Sign in now'
                    )}
                  </Button>
                </Box>

                {/* Reset Password only for Sign In and Admin */}
                {!isSignUp && accountOption === accountOptions[1] && (
                  <Button
                    color='primary'
                    fullWidth
                    size='large'
                    type='button'
                    variant='contained'
                    onClick={() => {
                      handleReset(values)
                    }}
                  >
                    Reset Password
                  </Button>
                )}
                
                {/* Toggle between Sign In and Sign Up */}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  {!isSignUp ? (
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => setIsSignUp(true)}
                    >
                      Don&apos;t have an account? Sign up here.
                    </Link>
                  ) : (
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => setIsSignUp(false)}
                    >
                      Already have an account? Sign in here.
                    </Link>
                  )}
                </Box>
                
              </form>
            )}
          </Formik>
        </Container>
      </Box>
    </>
  )
}

export default Login

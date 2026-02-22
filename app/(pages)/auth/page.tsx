'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Typography,
  Stack,
  Input,
  Button,
  IconButton,
  Alert,
} from '@mui/joy'
import { Eye, EyeOff, Lock, Mail, User, UserPlus, LogIn, Shield, Globe, Luggage } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AUTH_EMAIL_KEY } from '../../../config/auth/constants'

type Mode = 'login' | 'register'

async function parseApiResponse(res: Response): Promise<any> {
  const raw = await res.text()
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return { error: raw }
  }
}

const inputSx = (hasError: boolean) => ({
  '--Input-focusedThickness': '1px',
  '--Input-focusedHighlight': hasError
    ? 'var(--color-status-error)'
    : 'var(--color-auth-input-border-focus)',
  bgcolor: 'var(--color-auth-input-bg)',
  border: '1px solid',
  borderColor: hasError
    ? 'var(--color-status-error)'
    : 'var(--color-auth-input-border)',
  borderRadius: '10px',
  color: 'var(--color-text-primary)',
  py: 1.25,
  '& input::placeholder': { color: 'var(--color-text-muted)' },
  '& .MuiInput-startDecorator': { color: 'var(--color-text-muted)' },
} as const)

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = React.useState<Mode>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [existingEmail, setExistingEmail] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string; username?: string }>({})

  const nextPath = React.useMemo(() => {
    const next = searchParams.get('next')
    return next && next.startsWith('/') ? next : '/'
  }, [searchParams])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    setExistingEmail(localStorage.getItem(AUTH_EMAIL_KEY))
  }, [])

  const validateFields = (): boolean => {
    const errors: { email?: string; password?: string; username?: string } = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.trim()) {
      errors.email = 'Email is required.'
    } else if (!emailRegex.test(email)) {
      errors.email = 'Enter a valid email address.'
    }

    if (!password) {
      errors.password = 'Password is required.'
    } else if (password.length < 8) {
      errors.password = 'Must be at least 8 characters.'
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Must include an uppercase letter.'
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Must include a number.'
    }

    if (mode === 'register') {
      if (!username.trim()) {
        errors.username = 'Username is required.'
      } else if (username.trim().length < 2) {
        errors.username = 'Must be at least 2 characters.'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateFields()) return

    setLoading(true)
    try {
      const endpoint = mode === 'register' ? '/api/auth/signup' : '/api/auth/login'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await parseApiResponse(res)
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Authentication failed')
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_EMAIL_KEY, data?.session?.email || email)
      }

      setExistingEmail(data?.session?.email || email)
      setSuccess(mode === 'login' ? 'Signed in successfully.' : 'Account created successfully.')
      setPassword('')
      setUsername('')
      router.replace(nextPath)
    } catch (err: any) {
      setError(err?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const swap = (next: Mode) => {
    setMode(next)
    setError(null)
    setSuccess(null)
    setFieldErrors({})
  }

  const features = [
    { icon: <Shield size={18} />, label: 'Secure authentication' },
    { icon: <Luggage size={18} />, label: 'Trip management' },
    { icon: <Globe size={18} />, label: 'All-in-one platform' },
  ]

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gridTemplateRows: { xs: 'auto 1fr', md: '1fr' },
        overflow: 'hidden',
      }}
    >
      {/* ─── Left: Branding Panel ─── */}
      <Box
        sx={{
          position: 'relative',
          background: 'var(--color-auth-panel-bg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
          minHeight: { xs: 200, md: 'auto' },
          overflow: 'hidden',
        }}
      >
        {/* Decorative gradient orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'var(--color-auth-orb1)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-15%',
            left: '-5%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'var(--color-auth-orb2)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Image src="/app_logo/travpal.png" alt="Travpal" width={48} height={48} />
              <Stack spacing={0}>
                <Typography
                  level="title-lg"
                  sx={{ color: '#fff', letterSpacing: 0.5, fontWeight: 700 }}
                >
                  Travpal
                </Typography>
                <Typography level="body-xs" sx={{ color: 'var(--color-text-muted)' }}>
                  Trip Planner
                </Typography>
              </Stack>
            </Stack>

            <Box sx={{ mt: { xs: 1, md: 3 } }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <Typography
                    level="h1"
                    sx={{
                      color: '#fff',
                      fontSize: { xs: '1.75rem', md: '2.5rem' },
                      fontWeight: 800,
                      lineHeight: 1.15,
                    }}
                  >
                    {mode === 'login' ? 'Welcome\nback' : 'Create your\naccount'}
                  </Typography>
                </motion.div>
              </AnimatePresence>
              <Typography
                level="body-md"
                sx={{ color: 'var(--color-text-secondary)', mt: 1.5, maxWidth: 340 }}
              >
                Manage your trips, documents, and bookings in one place.
              </Typography>
            </Box>

            {/* Feature list — hidden on mobile */}
            <Stack
              spacing={1.5}
              sx={{ mt: 4, display: { xs: 'none', md: 'flex' } }}
            >
              {features.map((f) => (
                <Stack key={f.label} direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--color-surface-overlay)',
                      border: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography level="body-sm" sx={{ color: 'var(--color-text-secondary)' }}>
                    {f.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            {existingEmail && (
              <Alert
                variant="soft"
                color="neutral"
                sx={{
                  mt: 3,
                  background: 'var(--color-surface-overlay)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                Last signed in as <b style={{ color: '#fff', marginLeft: 4 }}>{existingEmail}</b>
              </Alert>
            )}
          </Stack>
        </motion.div>
      </Box>

      {/* ─── Right: Form Panel ─── */}
      <Box
        sx={{
          background: 'var(--color-auth-form-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 4 },
          overflowY: 'auto',
          borderLeft: { md: '1px solid var(--color-border-subtle)' },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          <Stack spacing={3}>
            {/* Segmented toggle */}
            <Box
              sx={{
                display: 'flex',
                background: 'var(--color-surface-overlay)',
                borderRadius: '12px',
                p: '4px',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              {(['login', 'register'] as Mode[]).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant="plain"
                  startDecorator={m === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
                  onClick={() => swap(m)}
                  sx={{
                    flex: 1,
                    borderRadius: '9px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    py: 1,
                    color: mode === m ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    transition: 'all 0.2s ease',
                    ...(mode === m
                      ? {
                          background: 'var(--color-surface-overlay)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }
                      : {
                          background: 'transparent',
                          '&:hover': {
                            background: 'var(--color-surface-overlay)',
                          },
                        }),
                  }}
                >
                  {m === 'login' ? 'Sign in' : 'Register'}
                </Button>
              ))}
            </Box>

            {/* Form */}
            <form onSubmit={submit}>
              <Stack spacing={2}>
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <Stack spacing={0.5}>
                        <Input
                          type="text"
                          value={username}
                          onChange={(e) => { setUsername(e.target.value); setFieldErrors((p) => ({ ...p, username: undefined })) }}
                          placeholder="Username"
                          startDecorator={<User size={16} />}
                          color={fieldErrors.username ? 'danger' : 'neutral'}
                          sx={inputSx(!!fieldErrors.username)}
                        />
                        {fieldErrors.username && (
                          <Typography level="body-xs" sx={{ color: 'var(--color-status-error)', pl: 0.5 }}>
                            {fieldErrors.username}
                          </Typography>
                        )}
                      </Stack>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Stack spacing={0.5}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
                    placeholder="Email address"
                    startDecorator={<Mail size={16} />}
                    color={fieldErrors.email ? 'danger' : 'neutral'}
                    sx={inputSx(!!fieldErrors.email)}
                  />
                  {fieldErrors.email && (
                    <Typography level="body-xs" sx={{ color: 'var(--color-status-error)', pl: 0.5 }}>
                      {fieldErrors.email}
                    </Typography>
                  )}
                </Stack>

                <Stack spacing={0.5}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
                    placeholder="Password"
                    startDecorator={<Lock size={16} />}
                    color={fieldErrors.password ? 'danger' : 'neutral'}
                    endDecorator={
                      <IconButton
                        variant="plain"
                        size="sm"
                        onClick={() => setShowPassword((s) => !s)}
                        sx={{ color: 'var(--color-text-muted)' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    }
                    sx={inputSx(!!fieldErrors.password)}
                  />
                  {fieldErrors.password && (
                    <Typography level="body-xs" sx={{ color: 'var(--color-status-error)', pl: 0.5 }}>
                      {fieldErrors.password}
                    </Typography>
                  )}
                </Stack>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      <Alert color="danger" variant="soft" sx={{ borderRadius: '10px' }}>
                        {error}
                      </Alert>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      <Alert color="success" variant="soft" sx={{ borderRadius: '10px' }}>
                        {success}
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  loading={loading}
                  sx={{
                    mt: 0.5,
                    py: 1.5,
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    background: 'var(--color-auth-button-gradient)',
                    boxShadow: 'var(--color-auth-button-shadow)',
                    '&:hover': {
                      background: 'var(--color-auth-button-gradient-hover)',
                      boxShadow: 'var(--color-auth-button-shadow)',
                    },
                  }}
                >
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </Button>

                <Button
                  variant="plain"
                  onClick={() => router.push('/')}
                  sx={{
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    '&:hover': {
                      color: 'var(--color-text-secondary)',
                      background: 'transparent',
                    },
                  }}
                >
                  Continue to home
                </Button>
              </Stack>
            </form>
          </Stack>
        </motion.div>
      </Box>
    </Box>
  )
}

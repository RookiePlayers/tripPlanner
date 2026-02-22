'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Stack,
  Button,
  Card,
  Alert,
  Divider,
} from '@mui/joy'
import { LogOut, Mail, User } from 'lucide-react'
import { motion } from 'motion/react'
import { AUTH_EMAIL_KEY } from '../../../config/auth/constants'

export default function ProfilePage() {
  const router = useRouter()
  const [email, setEmail] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    setEmail(localStorage.getItem(AUTH_EMAIL_KEY))
  }, [])

  const handleSignOut = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signout', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error || 'Failed to sign out')
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_EMAIL_KEY)
      }

      router.replace('/auth')
    } catch (err: any) {
      setError(err?.message || 'Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Stack spacing={3} sx={{ maxWidth: 480 }}>
        <Typography level="h2">Profile</Typography>

        <Card
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 'xl',
            borderColor: 'var(--color-border-default)',
            bgcolor: 'var(--color-surface-raised)',
          }}
        >
          <Stack spacing={2.5}>
            {/* Avatar placeholder */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-surface-overlay)',
                border: '2px solid var(--color-border-subtle)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <User size={28} />
            </Box>

            {/* Email */}
            <Stack spacing={0.5}>
              <Typography level="body-xs" sx={{ color: 'var(--color-text-muted)' }}>
                Email
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Mail size={16} style={{ color: 'var(--color-text-muted)' }} />
                <Typography level="body-md" sx={{ color: 'var(--color-text-primary)' }}>
                  {email || 'Not signed in'}
                </Typography>
              </Stack>
            </Stack>

            <Divider />

            {/* Sign out */}
            {error && (
              <Alert color="danger" variant="soft" sx={{ borderRadius: '10px' }}>
                {error}
              </Alert>
            )}

            <Button
              color="danger"
              variant="soft"
              startDecorator={<LogOut size={16} />}
              loading={loading}
              onClick={handleSignOut}
              sx={{ borderRadius: '10px' }}
            >
              Sign out
            </Button>
          </Stack>
        </Card>
      </Stack>
    </motion.div>
  )
}

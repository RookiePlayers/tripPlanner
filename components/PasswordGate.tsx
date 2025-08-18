'use client'
import * as React from 'react'
import {
  Sheet, Stack, Typography, Input, IconButton, Button
} from '@mui/joy'
import { Eye, EyeOff, Lock } from 'lucide-react'

type Mode = 'blur' | 'hide'
type SecretsMap = Record<string, string | undefined>

type Ctx = {
  unlocked: Set<string>
  unlock(area: string): void
  lock(area: string): void
  isUnlocked(area: string): boolean
  getSecret(area: string): string | undefined
}
const GateCtx = React.createContext<Ctx | null>(null)

function storageKey(area: string) { return `gate:${area}` }

export function GateProvider({
  children,
  secrets,
  remember = true,
}: {
  children: React.ReactNode
  /** map of area -> password (usually from NEXT_PUBLIC_*) */
  secrets: SecretsMap
  remember?: boolean
}) {
  const [unlocked, setUnlocked] = React.useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    const s = new Set<string>()
    Object.keys(secrets).forEach(area => {
      if (localStorage.getItem(storageKey(area)) === '1') s.add(area)
    })
    return s
  })

  const unlock = React.useCallback((area: string) => {
    setUnlocked(prev => {
      const next = new Set(prev); next.add(area); return next
    })
    if (remember) localStorage.setItem(storageKey(area), '1')
  }, [remember])

  const lock = React.useCallback((area: string) => {
    setUnlocked(prev => {
      const next = new Set(prev); next.delete(area); return next
    })
    localStorage.removeItem(storageKey(area))
  }, [])

  const isUnlocked = React.useCallback((area: string) => unlocked.has(area), [unlocked])

  const getSecret = React.useCallback((area: string) => secrets[area], [secrets])

  const value = React.useMemo<Ctx>(() => ({ unlocked, unlock, lock, isUnlocked, getSecret }), [unlocked, unlock, lock, isUnlocked, getSecret])

  return <GateCtx.Provider value={value}>{children}</GateCtx.Provider>
}

export function useGate() {
  const ctx = React.useContext(GateCtx)
  if (!ctx) throw new Error('useGate must be used within GateProvider')
  return ctx
}

/** Drop-in wrapper for any subtree that needs a password */
export function Gate({
  area,
  children,
  mode = 'blur',
  title = 'Locked',
  subtitle = 'Enter password to continue',
}: {
  area: string
  children: React.ReactNode
  mode?: Mode
  title?: string
  subtitle?: string
}) {
  const { isUnlocked, unlock, lock, getSecret } = useGate()
  const secret = getSecret(area) || ''
  const [value, setValue] = React.useState('')
  const [show, setShow] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!secret) { setErr('Password not configured'); return }
    if (value.trim() === secret) { unlock(area); setErr(null) }
    else { setErr('Incorrect password'); setTimeout(()=>inputRef.current?.focus(),0) }
  }

  if (isUnlocked(area)) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: -38, right: 0 }}>
          <Button size="sm" variant="soft" startDecorator={<Lock size={14}/>} onClick={()=>lock(area)}>
            Lock
          </Button>
        </div>
        {children}
      </div>
    )
  }

  if (mode === 'hide') {
    return (
      <Prompt
        title={title}
        subtitle={subtitle}
        value={value}
        setValue={setValue}
        show={show}
        setShow={setShow}
        err={err}
        submit={submit}
        inputRef={inputRef}
      />
    )
  }

  // blur mode
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ filter:'blur(8px) saturate(70%) grayscale(15%)', pointerEvents:'none', userSelect:'none' }}>
        {children}
      </div>
      <Sheet
        variant="soft"
        sx={{
          position:'absolute', inset:0, display:'grid', placeItems:'start',
          background:'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.4))',
          backdropFilter:'blur(4px)', p:2
        }}
      >
        <Prompt
          title={title}
          subtitle={subtitle}
          value={value}
          setValue={setValue}
          show={show}
          setShow={setShow}
          err={err}
          submit={submit}
          inputRef={inputRef}
        />
      </Sheet>
    </div>
  )
}

function Prompt({
  title, subtitle, value, setValue, show, setShow, err, submit, inputRef
}: any) {
  return (
    <Sheet variant="outlined" sx={{ p:2, borderRadius:'md', width:'min(480px,92vw)', bgcolor:'background.surface' }}>
      <form onSubmit={(e)=>submit(e)}>
        <Stack spacing={1.25}>
          <Stack spacing={0.25}>
            <Typography startDecorator={<Lock size={16}/>} level="title-lg">{title}</Typography>
            <Typography level="body-sm" sx={{ opacity:.8 }}>{subtitle}</Typography>
          </Stack>
          <Input
            type={show ? 'text' : 'password'}
            placeholder="Password"
            value={value}
            onChange={(e)=>setValue(e.target.value)}
            error={!!err}
            slotProps={{ input:{ ref: inputRef } }}
            endDecorator={
              <IconButton variant="plain" size="sm" onClick={()=>setShow((s:boolean)=>!s)}>
                {show ? <EyeOff size={16}/> : <Eye size={16}/>}
              </IconButton>
            }
          />
          {err && <Typography level="body-xs" color="danger">{err}</Typography>}
          <Button type="submit" variant="solid">Unlock</Button>
        </Stack>
      </form>
    </Sheet>
  )
}
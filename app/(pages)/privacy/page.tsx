'use client'
import * as React from 'react'
import { Stack, Card, Typography, Sheet, List, ListItem } from '@mui/joy'

export default function PrivacyPage() {
  return (
    <Stack spacing={2}>
      <Sheet
        variant="soft"
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 'xl',
          background:
            'radial-gradient(1200px 600px at 10% -20%, #7a5cff22, transparent 60%), ' +
            'radial-gradient(900px 600px at 120% 20%, #ff9e4422, transparent 40%), ' +
            'linear-gradient(180deg, #0b1022, #171c35)',
          color: '#fff',
        }}
      >
        <Typography level="h1">Privacy</Typography>
        <Typography level="body-sm" sx={{ mt: 0.5, opacity: 0.8 }}>
          Last updated: February 16, 2026
        </Typography>
      </Sheet>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Overview</Typography>
          <Typography level="body-sm">
            This app is a private trip planner used to organize travel details. We only collect
            information needed to make the planner work and improve reliability.
          </Typography>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Information We Collect</Typography>
          <List sx={{ pl: 2 }}>
            <ListItem>
              <Typography level="body-sm">
                Information you provide in the planner (itineraries, notes, documents, and preferences).
              </Typography>
            </ListItem>
            <ListItem>
              <Typography level="body-sm">
                Technical and usage data (device info, browser type, and basic analytics) to keep the app
                reliable and secure.
              </Typography>
            </ListItem>
          </List>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">How We Use Information</Typography>
          <List sx={{ pl: 2 }}>
            <ListItem>
              <Typography level="body-sm">Provide and operate the planner.</Typography>
            </ListItem>
            <ListItem>
              <Typography level="body-sm">Improve performance, reliability, and user experience.</Typography>
            </ListItem>
            <ListItem>
              <Typography level="body-sm">Maintain security and prevent misuse.</Typography>
            </ListItem>
          </List>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Sharing</Typography>
          <Typography level="body-sm">
            We may share data with trusted service providers that help run this app (for example, hosting
            or analytics). We do not sell personal information as part of operating the planner.
          </Typography>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Cookies</Typography>
          <Typography level="body-sm">
            We may use essential cookies and similar technologies for sessions, preferences, and basic
            analytics. You can control cookies through your browser settings.
          </Typography>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Your Choices</Typography>
          <Typography level="body-sm">
            You can request access, correction, or deletion of information stored in the planner.
            To make a request, contact the planner owner.
          </Typography>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Changes</Typography>
          <Typography level="body-sm">
            We may update this policy from time to time. We will update the date at the top when changes
            are made.
          </Typography>
        </Stack>
      </Card>
    </Stack>
  )
}

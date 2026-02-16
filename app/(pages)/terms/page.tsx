'use client'
import * as React from 'react'
import { Stack, Card, Typography, Sheet, List, ListItem } from '@mui/joy'

export default function TermsPage() {
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
        <Typography level="h1">Terms</Typography>
        <Typography level="body-sm" sx={{ mt: 0.5, opacity: 0.8 }}>
          Last updated: February 16, 2026
        </Typography>
      </Sheet>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Using the Planner</Typography>
          <Typography level="body-sm">
            This app is provided to organize travel information. You agree to use it for lawful purposes
            and to keep any shared links or access codes confidential.
          </Typography>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Acceptable Use</Typography>
          <List sx={{ pl: 2 }}>
            <ListItem>
              <Typography level="body-sm">Do not attempt to access areas you are not authorized to use.</Typography>
            </ListItem>
            <ListItem>
              <Typography level="body-sm">Do not upload malicious content or interfere with service availability.</Typography>
            </ListItem>
            <ListItem>
              <Typography level="body-sm">Do not misuse personal or travel information of others.</Typography>
            </ListItem>
          </List>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Information Accuracy</Typography>
          <Typography level="body-sm">
            Trip details, schedules, prices, and third-party information may change. Always verify critical
            details with airlines, hotels, venues, or official providers before acting on them.
          </Typography>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Third-Party Links</Typography>
          <Typography level="body-sm">
            The planner may include links to external services (maps, booking platforms, transport). We are
            not responsible for their content, policies, or availability.
          </Typography>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Disclaimer</Typography>
          <Typography level="body-sm">
            The planner is provided &quot;as is&quot; without warranties of any kind. To the extent permitted by law,
            we are not liable for losses resulting from the use of the planner or reliance on its content.
          </Typography>
        </Stack>
      </Card>

      <Card>
        <Stack spacing={1}>
          <Typography level="title-md">Changes</Typography>
          <Typography level="body-sm">
            We may update these terms. We will update the date at the top when changes are made.
          </Typography>
        </Stack>
      </Card>
    </Stack>
  )
}

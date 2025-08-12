'use client'
import { ActivityItem } from '../lib/types'
import { statusFromFlags, mapsLinkFromQuery, timeTill } from '../lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

export default function ActivityCard({ item, isPast=false, highlight=false }: { item: ActivityItem, isPast?: boolean, highlight?: boolean }) {
  const [open, setOpen] = useState(false)
  const status = statusFromFlags(!!item.booked, !!item.paid)
  return (
    <motion.div layout className={`rounded-xl border p-4 shadow bg-white ${isPast ? 'opacity-60' : ''} ${highlight ? 'ring-4 ring-amber-300' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{item.time}</div>
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm text-gray-600">{item.zone} • {item.category}</div>
        </div>
        <div className={`text-sm ${status.color}`}>{status.label}</div>
      </div>
      <div className="text-xs text-gray-500 mt-1">Starts in {timeTill(new Date().toDateString() + ' ' + item.time)}</div>
      <button onClick={()=>setOpen(o=>!o)} className="mt-2 text-brand">{open ? 'Hide details' : 'Show details'}</button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0, y:-6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-6}} className="mt-3 space-y-2 text-sm">
            {item.location && <a className="inline-block px-3 py-1 rounded bg-gray-100" href={mapsLinkFromQuery(item.location)} target="_blank">Open in Maps</a>}
            {item.price != null && <div>Price: <strong>£{item.price}</strong></div>}
            {item.ticket && <a className="inline-block px-3 py-1 rounded bg-brand text-white" href={item.ticket} target="_blank">Open Ticket</a>}
            {item.tiktok && <a className="block text-brand" href={item.tiktok} target="_blank">TikTok</a>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

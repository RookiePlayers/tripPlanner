'use client'
import { pdfjs } from 'react-pdf'


// ESM-safe worker URL
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
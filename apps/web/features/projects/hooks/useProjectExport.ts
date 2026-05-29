'use client'

import { useState } from 'react'
import { exportProject } from '../api/projects'

export function useProjectExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportingId, setExportingId] = useState<string | null>(null)

  async function exportAndDownload(projectId: string, name: string) {
    setIsExporting(true)
    setExportingId(projectId)
    try {
      const blob = await exportProject(projectId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.inkt`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
      setExportingId(null)
    }
  }

  return { exportAndDownload, isExporting, exportingId }
}

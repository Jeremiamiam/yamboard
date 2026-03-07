"use client"

import { useState } from "react"
import { FileUploader } from "@/components/file-uploader"
import { FileList } from "@/components/file-list"

interface FileItem {
  name: string
  path: string
  metadata?: { size?: number }
}

interface ProjectFilesSectionProps {
  projectId: string
  initialFiles: FileItem[]
}

export function ProjectFilesSection({ projectId, initialFiles }: ProjectFilesSectionProps) {
  const [files, setFiles] = useState<FileItem[]>(initialFiles)
  const [refreshing, setRefreshing] = useState(false)

  async function refreshFiles() {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/files`)
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files ?? [])
      }
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-4">
      <FileUploader projectId={projectId} onUploadComplete={refreshFiles} />
      {refreshing ? (
        <div className="flex justify-center py-4">
          <span className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        </div>
      ) : (
        <FileList
          projectId={projectId}
          files={files}
          onDeleteComplete={refreshFiles}
        />
      )}
    </div>
  )
}

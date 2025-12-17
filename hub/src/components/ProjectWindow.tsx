'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './ProjectWindow.module.css'
import { AudioPlayer } from './AudioPlayer'

interface ProjectWindowProps {
  projectPath?: string
  selectedFile?: string
  projectType?: string
  projectMetadata?: any
  onFileSelect?: (filePath: string) => void
}

interface FileContent {
  path: string
  content: string
  modified: string
  isDirty: boolean
}

const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'

export function ProjectWindow({ projectPath, selectedFile, projectType, projectMetadata, onFileSelect }: ProjectWindowProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [tabs, setTabs] = useState<string[]>([])
  const [fileContents, setFileContents] = useState<Map<string, FileContent>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (selectedFile && !tabs.includes(selectedFile)) {
      setTabs([...tabs, selectedFile])
      setActiveTab(selectedFile)
      loadFile(selectedFile)
    } else if (selectedFile) {
      setActiveTab(selectedFile)
      // Load file if not already loaded
      if (!fileContents.has(selectedFile)) {
        loadFile(selectedFile)
      }
    }
  }, [selectedFile])

  const loadFile = async (filePath: string) => {
    // Check if already loaded
    if (fileContents.has(filePath)) {
      return
    }

    setLoading(prev => new Set(prev).add(filePath))
    try {
      const token = localStorage.getItem('auth_token') || ''
      const response = await fetch(`${MIDDLEWARE_URL}/api/filesystem/read?path=${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to read file' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setFileContents(prev => {
        const next = new Map(prev)
        next.set(filePath, {
          path: filePath,
          content: data.content,
          modified: data.modified,
          isDirty: false,
        })
        return next
      })
    } catch (error: any) {
      console.error('Failed to load file:', error)
      alert(`Failed to load file: ${error.message}`)
    } finally {
      setLoading(prev => {
        const next = new Set(prev)
        next.delete(filePath)
        return next
      })
    }
  }

  const saveFile = useCallback(async (filePath: string) => {
    const fileContent = fileContents.get(filePath)
    if (!fileContent || !fileContent.isDirty) {
      return
    }

    setSaving(prev => new Set(prev).add(filePath))
    try {
      const token = localStorage.getItem('auth_token') || ''
      const response = await fetch(`${MIDDLEWARE_URL}/api/filesystem/write`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: filePath,
          content: fileContent.content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save file' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      // Update file content to mark as saved
      setFileContents(prev => {
        const next = new Map(prev)
        const current = next.get(filePath)
        if (current) {
          next.set(filePath, {
            ...current,
            modified: data.modified,
            isDirty: false,
          })
        }
        return next
      })
    } catch (error: any) {
      console.error('Failed to save file:', error)
      alert(`Failed to save file: ${error.message}`)
    } finally {
      setSaving(prev => {
        const next = new Set(prev)
        next.delete(filePath)
        return next
      })
    }
  }, [fileContents])

  const handleFileSelect = (filePath: string) => {
    if (!tabs.includes(filePath)) {
      setTabs([...tabs, filePath])
      loadFile(filePath)
    }
    setActiveTab(filePath)
    onFileSelect?.(filePath)
  }

  const closeTab = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Check if file has unsaved changes
    const fileContent = fileContents.get(filePath)
    if (fileContent?.isDirty) {
      if (!confirm('File has unsaved changes. Close anyway?')) {
        return
      }
    }

    setTabs(tabs.filter(t => t !== filePath))
    if (activeTab === filePath) {
      setActiveTab(tabs.length > 1 ? tabs[tabs.length - 2] : null)
    }
  }

  const handleContentChange = (filePath: string, content: string) => {
    setFileContents(prev => {
      const next = new Map(prev)
      const current = next.get(filePath)
      if (current) {
        next.set(filePath, {
          ...current,
          content,
          isDirty: true,
        })
      }
      return next
    })
  }

  const activeFileContent = activeTab ? fileContents.get(activeTab) : null
  const isActiveFileLoading = activeTab ? loading.has(activeTab) : false
  const isActiveFileSaving = activeTab ? saving.has(activeTab) : false
  const isActiveFileDirty = activeFileContent?.isDirty || false

  return (
    <div className={styles.projectWindow}>
      {tabs.length > 0 && (
        <div className={styles.tabs}>
          {tabs.map(tab => {
            const fileContent = fileContents.get(tab)
            const isDirty = fileContent?.isDirty || false
            const isSaving = saving.has(tab)
            
            return (
              <div
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ''} ${isDirty ? styles.dirty : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span>{tab.split('/').pop()}</span>
                {isDirty && <span className={styles.dirtyIndicator}>●</span>}
                {isSaving && <span className={styles.savingIndicator}>💾</span>}
                <button
                  className={styles.closeTab}
                  onClick={(e) => closeTab(tab, e)}
                  aria-label="Close tab"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
      <div className={styles.editor}>
        {activeTab ? (
          <div className={styles.editorContent}>
            <div className={styles.editorHeader}>
              <span className={styles.filePath} title={activeTab}>{activeTab}</span>
              <div className={styles.editorActions}>
                {isActiveFileDirty && (
                  <button
                    onClick={() => saveFile(activeTab)}
                    disabled={isActiveFileSaving}
                    className={styles.saveButton}
                  >
                    {isActiveFileSaving ? 'Saving...' : '💾 Save'}
                  </button>
                )}
              </div>
            </div>
            <div className={styles.editorBody}>
              {isActiveFileLoading ? (
                <div className={styles.loading}>Loading file...</div>
              ) : activeFileContent ? (
                // Check if this is an audio file and project type is audio
                (projectType === 'audio' && activeTab && /\.(mp3|wav|flac|aac|ogg|m4a|wma)$/i.test(activeTab)) ? (
                  <AudioPlayer
                    audioPath={activeTab}
                    metadata={projectMetadata}
                  />
                ) : (
                  <textarea
                    value={activeFileContent.content}
                    onChange={(e) => handleContentChange(activeTab, e.target.value)}
                    className={styles.textEditor}
                    spellCheck={false}
                  />
                )
              ) : (
                <div className={styles.error}>Failed to load file</div>
              )}
            </div>
          </div>
        ) : projectType === 'audio' && projectMetadata?.primaryFile && projectPath ? (
          // Auto-load primary audio file if project is audio type
          <div className={styles.editorContent}>
            <div className={styles.editorHeader}>
              <span className={styles.filePath}>{projectMetadata.primaryFile}</span>
            </div>
            <div className={styles.editorBody}>
              <AudioPlayer
                audioPath={`${projectPath}/${projectMetadata.primaryFile}`}
                metadata={projectMetadata}
              />
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            {projectPath ? (
              <>
                <p>Select a file from the file tree to open it</p>
                <p className={styles.projectName}>
                  Project: <strong>{projectPath.split('/').pop() || projectPath}</strong>
                </p>
                {projectType && (
                  <p className={styles.projectTypeHint}>
                    Detected: <strong>{projectType}</strong> project
                  </p>
                )}
              </>
            ) : (
              <p>Select a project directory to get started</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


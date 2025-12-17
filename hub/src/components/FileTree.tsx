'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './FileTree.module.css'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: string
  children?: FileNode[]
  loaded?: boolean
}

interface FileTreeProps {
  projectPath?: string
  onFileSelect: (filePath: string) => void
  selectedFile?: string
  onProjectTypeDetected?: (projectType: string, metadata: any) => void
}

const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'

export function FileTree({ projectPath, onFileSelect, selectedFile, onProjectTypeDetected }: FileTreeProps) {
  const [files, setFiles] = useState<FileNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileCache, setFileCache] = useState<Map<string, FileNode[]>>(new Map())

  useEffect(() => {
    if (projectPath) {
      loadFiles(projectPath)
      // Expand root by default
      setExpanded(new Set([projectPath]))
    } else {
      setFiles([])
      setFileCache(new Map())
    }
  }, [projectPath])

  const loadFiles = async (path: string) => {
    setLoading(true)
    setError(null)
    try {
      // Check cache first
      if (fileCache.has(path)) {
        setFiles(fileCache.get(path)!)
        setLoading(false)
        return
      }

      // Fetch from backend API
      const token = localStorage.getItem('auth_token') || ''
      const response = await fetch(`${MIDDLEWARE_URL}/api/filesystem/list?path=${encodeURIComponent(path)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load directory' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const fileNodes: FileNode[] = data.files.map((file: any) => ({
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size,
        modified: file.modified,
        children: file.type === 'directory' ? [] : undefined,
        loaded: false,
      }))

      setFiles(fileNodes)
      setFileCache(prev => new Map(prev).set(path, fileNodes))
      
      // Notify parent about project type detection
      if (data.projectType && onProjectTypeDetected) {
        onProjectTypeDetected(data.projectType, data.metadata || {})
      }
    } catch (error: any) {
      console.error('Failed to load files:', error)
      setError(error.message || 'Failed to load directory')
    } finally {
      setLoading(false)
    }
  }

  const loadDirectoryChildren = useCallback(async (dirPath: string) => {
    // Check cache first
    if (fileCache.has(dirPath)) {
      return fileCache.get(dirPath)!
    }

    try {
      const token = localStorage.getItem('auth_token') || ''
      const response = await fetch(`${MIDDLEWARE_URL}/api/filesystem/list?path=${encodeURIComponent(dirPath)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load directory')
      }

      const data = await response.json()
      const fileNodes: FileNode[] = data.files.map((file: any) => ({
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size,
        modified: file.modified,
        children: file.type === 'directory' ? [] : undefined,
        loaded: false,
      }))

      // Update cache
      setFileCache(prev => new Map(prev).set(dirPath, fileNodes))
      return fileNodes
    } catch (error) {
      console.error('Failed to load directory children:', error)
      return []
    }
  }, [fileCache])

  const toggleExpand = async (node: FileNode) => {
    const isExpanded = expanded.has(node.path)
    
    if (isExpanded) {
      // Collapse
      setExpanded(prev => {
        const next = new Set(prev)
        next.delete(node.path)
        return next
      })
    } else {
      // Expand - load children if not loaded
      setExpanded(prev => new Set(prev).add(node.path))
      
      if (node.type === 'directory' && !node.loaded) {
        const children = await loadDirectoryChildren(node.path)
        // Update the node with loaded children
        setFiles(prev => {
          const updateNode = (n: FileNode): FileNode => {
            if (n.path === node.path) {
              return { ...n, children, loaded: true }
            }
            if (n.children) {
              return { ...n, children: n.children.map(updateNode) }
            }
            return n
          }
          return prev.map(updateNode)
        })
      }
    }
  }

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expanded.has(node.path)
    const isDirectory = node.type === 'directory'
    const isSelected = selectedFile === node.path

    return (
      <div key={node.path}>
        <div
          className={`${styles.node} ${isDirectory ? styles.directory : styles.file} ${isSelected ? styles.selected : ''}`}
          style={{ paddingLeft: `${level * 1.5}rem` }}
          onClick={() => {
            if (isDirectory) {
              toggleExpand(node)
            } else {
              onFileSelect(node.path)
            }
          }}
        >
          <span className={styles.icon}>
            {isDirectory ? (isExpanded ? '📂' : '📁') : '📄'}
          </span>
          <span className={styles.name}>{node.name}</span>
        </div>
        {isDirectory && isExpanded && node.children && (
          <div className={styles.children}>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!projectPath) {
    return (
      <div className={styles.fileTree}>
        <div className={styles.empty}>No project directory selected</div>
        <div className={styles.hint}>Use the directory picker above to select a folder</div>
      </div>
    )
  }

  const projectName = projectPath.split('/').pop() || projectPath

  return (
    <div className={styles.fileTree}>
      <div className={styles.header}>
        <span className={styles.title}>Explorer</span>
        {projectPath && (
          <span className={styles.path} title={projectPath}>
            {projectPath.split('/').pop() || projectPath}
          </span>
        )}
      </div>
      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}
      {loading && files.length === 0 ? (
        <div className={styles.loading}>Loading files...</div>
      ) : files.length === 0 ? (
        <div className={styles.empty}>
          <div>No files found in <strong>{projectName}</strong></div>
          <div className={styles.hint}>Select a file from the file tree to open it</div>
        </div>
      ) : (
        <div className={styles.tree}>
          {files.map(node => renderNode(node))}
        </div>
      )}
    </div>
  )
}


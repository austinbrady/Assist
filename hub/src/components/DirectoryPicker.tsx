'use client'

import { useState, useEffect, useMemo } from 'react'
import styles from './DirectoryPicker.module.css'

interface DirectoryPickerProps {
  onPathSelect: (path: string) => void | Promise<void>
  currentPath?: string
}

export function DirectoryPicker({ onPathSelect, currentPath }: DirectoryPickerProps) {
  const [isSelecting, setIsSelecting] = useState(false)

  // Debug: Log when currentPath changes
  useEffect(() => {
    console.log('DirectoryPicker: currentPath prop changed to:', currentPath, 'type:', typeof currentPath, 'truthy:', !!currentPath, 'length:', currentPath?.length)
    console.log('DirectoryPicker: currentPath JSON:', JSON.stringify(currentPath))
  }, [currentPath])
  
  // Also check localStorage to see if there's a mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('projectPath')
      console.log('DirectoryPicker: localStorage has projectPath:', stored)
      console.log('DirectoryPicker: currentPath prop:', currentPath)
      if (stored && stored !== currentPath) {
        console.warn('DirectoryPicker: MISMATCH - localStorage has:', stored, 'but prop is:', currentPath)
      }
    }
  }, [currentPath])

  // Function to unescape shell-escaped paths
  const unescapePath = (path: string): string => {
    // Remove backslashes used for shell escaping
    // This handles paths like: /Volumes/Austin\'s\ Flash\ Drive\ \(Mac\)/AssisantAI
    // And converts them to: /Volumes/Austin's Flash Drive (Mac)/AssisantAI
    
    // First, handle all escaped characters by removing the backslash
    // This regex matches a backslash followed by any character and replaces it with just the character
    let unescaped = path.replace(/\\(.)/g, '$1')
    
    console.log('DirectoryPicker: unescapePath - input:', JSON.stringify(path), 'output:', JSON.stringify(unescaped))
    return unescaped
  }

  // Function to validate path exists
  const validatePath = async (path: string): Promise<boolean> => {
    try {
      // Use the correct token key that matches the rest of the app
      const token = localStorage.getItem('assisant_ai_token') || localStorage.getItem('auth_token') || ''
      const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'
      const encodedPath = encodeURIComponent(path)
      const url = `${MIDDLEWARE_URL}/api/filesystem/list?path=${encodedPath}`
      
      console.log('DirectoryPicker: validatePath - original:', JSON.stringify(path))
      console.log('DirectoryPicker: validatePath - encoded:', encodedPath)
      console.log('DirectoryPicker: validatePath - URL:', url)
      console.log('DirectoryPicker: validatePath - has token:', !!token)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('DirectoryPicker: Path validation failed:', errorData.error, 'for path:', path, 'status:', response.status)
        
        // If it's an auth error, provide helpful message
        if (response.status === 401 || response.status === 403) {
          console.error('DirectoryPicker: Authentication failed - token may be missing or invalid')
        }
      }
      
      return response.ok
    } catch (error) {
      console.error('Path validation error:', error)
      return false
    }
  }

  const handleSelectDirectory = async () => {
    setIsSelecting(true)
    
    try {
      // Try native File System Access API first (Chrome, Edge, etc.)
      if ('showDirectoryPicker' in window) {
        try {
          // @ts-ignore - File System Access API
          const directoryHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
          })
          
          // File System Access API doesn't give us the path directly
          // We need to work with the handle, but for our backend we need the path
          // So we'll prompt for the path (user can copy from Finder)
          const pathInput = prompt(
            'Please enter the full path to the selected directory:\n\n' +
            '(You can copy the path from Finder: Right-click folder → Option key → Copy as Pathname)\n\n' +
            'Note: If you see escaped characters (like backslashes), they will be automatically fixed.'
          )
          
          if (pathInput && pathInput.trim()) {
            // Unescape the path
            const unescapedPath = unescapePath(pathInput.trim())
            console.log('DirectoryPicker: Original path:', pathInput.trim())
            console.log('DirectoryPicker: Unescaped path:', unescapedPath)
            
            // Validate the path
            console.log('DirectoryPicker: About to validate unescaped path:', JSON.stringify(unescapedPath))
            const isValid = await validatePath(unescapedPath)
            if (isValid) {
              console.log('DirectoryPicker: Path validated, calling onPathSelect with:', unescapedPath)
              try {
                await onPathSelect(unescapedPath)
                console.log('DirectoryPicker: onPathSelect completed successfully')
              } catch (error: any) {
                console.error('DirectoryPicker: Error in onPathSelect:', error)
                const errorMsg = error?.message || String(error)
                alert(`Failed to save directory path: ${errorMsg}\n\nPath: ${unescapedPath}`)
              }
            } else {
              // Get more details about why validation failed
              try {
                const token = localStorage.getItem('assisant_ai_token') || localStorage.getItem('auth_token') || ''
                const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'
                const response = await fetch(`${MIDDLEWARE_URL}/api/filesystem/list?path=${encodeURIComponent(unescapedPath)}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                })
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                const errorMsg = errorData.error || 'Unknown error'
                
                // Provide helpful message based on error type
                if (response.status === 401 || response.status === 403) {
                  alert(`Authentication required.\n\nPlease log in to access the filesystem.\n\nPath: ${unescapedPath}`)
                } else {
                  alert(`The path "${unescapedPath}" could not be accessed.\n\nError: ${errorMsg}\n\nPlease check that:\n1. The path is correct\n2. You have permission to access this directory\n3. The directory exists`)
                }
              } catch (err) {
                alert(`The path "${unescapedPath}" could not be accessed. Please check that:\n\n1. The path is correct\n2. You have permission to access this directory\n3. The directory exists`)
              }
            }
          } else {
            console.log('DirectoryPicker: User cancelled or empty path')
          }
        } catch (pickerError: any) {
          if (pickerError.name === 'AbortError') {
            console.log('DirectoryPicker: User cancelled directory picker')
            return
          }
          throw pickerError
        }
      } else {
        // Fallback: Simple prompt for path
        const pathInput = prompt(
          'Enter the full path to your project directory:\n\n' +
          'Example: /Users/yourname/Documents/MyProject\n\n' +
          'Note: If you see escaped characters (like backslashes), they will be automatically fixed.'
        )
        if (pathInput && pathInput.trim()) {
          // Unescape the path
          const unescapedPath = unescapePath(pathInput.trim())
          console.log('DirectoryPicker: Original path:', pathInput.trim())
          console.log('DirectoryPicker: Unescaped path:', unescapedPath)
          
          // Validate the path
          console.log('DirectoryPicker: About to validate unescaped path (fallback):', JSON.stringify(unescapedPath))
          const isValid = await validatePath(unescapedPath)
          if (isValid) {
            console.log('DirectoryPicker: Path validated, calling onPathSelect with:', unescapedPath)
            try {
              await onPathSelect(unescapedPath)
              console.log('DirectoryPicker: onPathSelect completed successfully')
            } catch (error: any) {
              console.error('DirectoryPicker: Error in onPathSelect:', error)
              const errorMsg = error?.message || String(error)
              alert(`Failed to save directory path: ${errorMsg}\n\nPath: ${unescapedPath}`)
            }
          } else {
            // Get more details about why validation failed
            try {
              const token = localStorage.getItem('assisant_ai_token') || localStorage.getItem('auth_token') || ''
              const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'
              const response = await fetch(`${MIDDLEWARE_URL}/api/filesystem/list?path=${encodeURIComponent(unescapedPath)}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              })
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
              const errorMsg = errorData.error || 'Unknown error'
              
              // Provide helpful message based on error type
              if (response.status === 401 || response.status === 403) {
                alert(`Authentication required.\n\nPlease log in to access the filesystem.\n\nPath: ${unescapedPath}`)
              } else {
                alert(`The path "${unescapedPath}" could not be accessed.\n\nError: ${errorMsg}\n\nPlease check that:\n1. The path is correct\n2. You have permission to access this directory\n3. The directory exists`)
              }
            } catch (err) {
              alert(`The path "${unescapedPath}" could not be accessed. Please check that:\n\n1. The path is correct\n2. You have permission to access this directory\n3. The directory exists`)
            }
          }
        } else {
          console.log('DirectoryPicker: User cancelled or empty path')
        }
      }
    } catch (error: any) {
      console.error('Directory picker error:', error)
      // Fallback to prompt
      const pathInput = prompt('Enter the full path to your project directory:')
      if (pathInput && pathInput.trim()) {
        // Unescape the path
        const unescapedPath = unescapePath(pathInput.trim())
        console.log('DirectoryPicker: Original path (fallback):', pathInput.trim())
        console.log('DirectoryPicker: Unescaped path (fallback):', unescapedPath)
        
        // Validate the path
        console.log('DirectoryPicker: About to validate unescaped path (error fallback):', JSON.stringify(unescapedPath))
        const isValid = await validatePath(unescapedPath)
        if (isValid) {
          console.log('DirectoryPicker: Path validated (fallback), calling onPathSelect with:', unescapedPath)
          try {
            await onPathSelect(unescapedPath)
            console.log('DirectoryPicker: onPathSelect completed successfully (fallback)')
          } catch (error: any) {
            console.error('DirectoryPicker: Error in onPathSelect (fallback):', error)
            const errorMsg = error?.message || String(error)
            alert(`Failed to save directory path: ${errorMsg}\n\nPath: ${unescapedPath}`)
          }
        } else {
          // Get more details about why validation failed
          try {
            const token = localStorage.getItem('assisant_ai_token') || localStorage.getItem('auth_token') || ''
            const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'
            const response = await fetch(`${MIDDLEWARE_URL}/api/filesystem/list?path=${encodeURIComponent(unescapedPath)}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            const errorMsg = errorData.error || 'Unknown error'
            
            // Provide helpful message based on error type
            if (response.status === 401 || response.status === 403) {
              alert(`Authentication required.\n\nPlease log in to access the filesystem.\n\nPath: ${unescapedPath}`)
            } else {
              alert(`The path "${unescapedPath}" could not be accessed.\n\nError: ${errorMsg}\n\nPlease check that:\n1. The path is correct\n2. You have permission to access this directory\n3. The directory exists`)
            }
          } catch (err) {
            alert(`The path "${unescapedPath}" could not be accessed. Please check that:\n\n1. The path is correct\n2. You have permission to access this directory\n3. The directory exists`)
          }
        }
      }
    } finally {
      setIsSelecting(false)
    }
  }

  // Check if we have a valid path (not undefined, null, or empty string)
  const hasPath = useMemo(() => {
    const result = currentPath && typeof currentPath === 'string' && currentPath.trim().length > 0
    console.log('DirectoryPicker: hasPath check - currentPath:', currentPath, 'result:', result)
    return result
  }, [currentPath])

  return (
    <div className={styles.directoryPicker}>
      {hasPath && currentPath ? (
        <div className={styles.currentProject}>
          <span className={styles.projectIcon}>📁</span>
          <span className={styles.projectPath} title={currentPath}>
            {currentPath.split('/').pop() || currentPath}
          </span>
          <button
            type="button"
            onClick={handleSelectDirectory}
            disabled={isSelecting}
            className={styles.changeButton}
            title="Change directory"
          >
            {isSelecting ? '...' : 'Change'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSelectDirectory}
          disabled={isSelecting}
          className={styles.selectButton}
        >
          {isSelecting ? 'Selecting...' : '📁 Select Directory'}
        </button>
      )}
    </div>
  )
}

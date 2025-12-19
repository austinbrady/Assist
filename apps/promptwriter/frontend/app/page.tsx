'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { getUnifiedToken } from '@assisant-ai/auth'
import { AssistChat } from '../components/AssistChat'
import { VariableInput } from '../components/VariableInput'

export default function PromptWriter() {
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [improvements, setImprovements] = useState<string[]>([])
  const [optimizationLevel, setOptimizationLevel] = useState('balanced')
  const [writeMode, setWriteMode] = useState<'ai' | 'humans'>('ai')
  const [writeTool, setWriteTool] = useState<'general' | 'suno' | 'dev' | 'social_media' | 'friends' | 'staff'>('general')
  const [loading, setLoading] = useState(false)
  const [languageVariants, setLanguageVariants] = useState<Record<string, string> | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('eng')
  const [notes, setNotes] = useState('')
  const [generateMode, setGenerateMode] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null)
  const [conversationContext, setConversationContext] = useState<Array<{role: string, content: string}>>([])
  const [sunoModeType, setSunoModeType] = useState<'fast' | 'detailed'>('fast')
  const [sunoStyleBox, setSunoStyleBox] = useState('')
  const [sunoLyricsBox, setSunoLyricsBox] = useState('')
  const [sunoVariables, setSunoVariables] = useState({
    genre: '',
    subGenre: '',
    bpm: '',
    key: '',
    era: '',
    micType: '',
    productionFX: '',
    vocalStyle: '',
    instrumentation: '',
    energy: '',
    arrangement: '',
    dynamics: ''
  })
  
  // Initialize: Use unified token getter (handles URL params and localStorage)
  useEffect(() => {
    // getUnifiedToken() already handles URL params and localStorage
    // No need for separate initialization
  }, [])

  // Get userId from token if available
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      // Use unified token getter
      const token = getUnifiedToken()
      if (token) {
        try {
          // Decode JWT to get userId (simple base64 decode)
          const payload = JSON.parse(atob(token.split('.')[1]))
          return payload.sub || payload.username || payload.userId || null
        } catch (e) {
          return null
        }
      }
    }
    return null
  }

  // Extract variables from conversation context using backend
  const extractVariablesFromConversation = async () => {
    if (conversationContext.length === 0 && !originalPrompt.trim()) return
    
    try {
      const userId = getUserId()
      const token = typeof window !== 'undefined' 
        ? getUnifiedToken()
        : null
      
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await axios.post('http://localhost:4206/api/suno/extract-variables', {
        conversation_context: conversationContext,
        user_input: originalPrompt.trim() || undefined
      }, { headers })
      
      if (response.data && response.data.variables) {
        // Only update variables that are empty or were auto-detected
        const newVars = { ...sunoVariables }
        Object.entries(response.data.variables).forEach(([key, value]) => {
          if (value && value.toString().trim()) {
            // Only update if current value is empty or if new value is different (user might have manually set it)
            if (!newVars[key as keyof typeof newVars] || newVars[key as keyof typeof newVars] === '') {
              newVars[key as keyof typeof newVars] = value.toString()
            }
          }
        })
        setSunoVariables(newVars)
      }
    } catch (error) {
      console.error('Error extracting variables:', error)
      // Fallback to local extraction if backend fails
    }
  }

  // Update variables when conversation changes
  useEffect(() => {
    if (writeTool === 'suno' && sunoModeType === 'detailed') {
      extractVariablesFromConversation()
    }
  }, [conversationContext, originalPrompt, writeTool, sunoModeType])

  // Handle variable updates from Assist chat
  const handleVariableUpdate = (updates: Record<string, string>) => {
    setSunoVariables(prev => ({
      ...prev,
      ...updates
    }))
  }

  // Music key suggestions
  const keySuggestions = [
    'C Major', 'C# Major', 'D Major', 'D# Major', 'E Major', 'F Major',
    'F# Major', 'G Major', 'G# Major', 'A Major', 'A# Major', 'B Major',
    'C Minor', 'C# Minor', 'D Minor', 'D# Minor', 'E Minor', 'F Minor',
    'F# Minor', 'G Minor', 'G# Minor', 'A Minor', 'A# Minor', 'B Minor',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ]

  // Genre suggestions
  const genreSuggestions = [
    'Pop', 'Rock', 'Hip Hop', 'Rap', 'Country', 'Jazz', 'Blues', 'Electronic',
    'EDM', 'Metal', 'Punk', 'Indie', 'Folk', 'R&B', 'Reggae', 'Classical',
    'K-pop', 'J-pop', 'Synth-pop', 'Metalcore', 'Post-hardcore', 'Alternative',
    'Progressive', 'Ambient', 'Dance', 'House', 'Techno', 'Dubstep', 'Trap'
  ]

  // BPM suggestions (common ranges)
  const bpmSuggestions = [
    '60', '70', '80', '90', '100', '110', '120', '128', '130', '140',
    '150', '160', '170', '180', '190', '200'
  ]

  // Era suggestions
  const eraSuggestions = [
    '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s',
    'Vintage', 'Modern', 'Retro', 'Classic', 'Contemporary'
  ]

  const handleGeneratePrompt = async () => {
    if (!originalPrompt.trim() && conversationContext.length === 0) return

    setGenerating(true)
    try {
      const userId = getUserId()
      const token = typeof window !== 'undefined' 
        ? getUnifiedToken()
        : null
      
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      if (writeTool === 'suno') {
        // Build notes from variables if in detailed mode
        let sunoNotes = notes.trim() || ''
        if (sunoModeType === 'detailed') {
          const varNotes = Object.entries(sunoVariables)
            .filter(([key, value]) => value && value.trim())
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
          if (varNotes) {
            sunoNotes = sunoNotes ? `${sunoNotes}\n\nVariables: ${varNotes}` : `Variables: ${varNotes}`
          }
        }
        
        // Handle Suno generation
        const response = await axios.post('http://localhost:4206/api/suno', {
          user_input: originalPrompt.trim(),
          conversation_context: conversationContext,
          mode: sunoModeType,
          notes: sunoNotes || undefined,
          userId: userId
        }, { headers })

        if (response.data.needs_clarification) {
          setClarificationQuestion(response.data.question)
          setConversationContext([...conversationContext, 
            { role: 'user', content: originalPrompt },
            { role: 'assistant', content: response.data.question }
          ])
          setOriginalPrompt('')
        } else {
          setSunoStyleBox(response.data.style_box)
          setSunoLyricsBox(response.data.lyrics_box)
          // Update variables from response if in detailed mode
          if (sunoModeType === 'detailed' && response.data.extracted_variables) {
            setSunoVariables(prev => ({
              ...prev,
              ...response.data.extracted_variables
            }))
          }
          setClarificationQuestion(null)
          setConversationContext([])
        }
      } else if (writeTool === 'dev') {
        // Handle Dev generation - use generate endpoint with dev context
        const response = await axios.post('http://localhost:4206/api/generate', {
          user_input: originalPrompt.trim(),
          conversation_context: conversationContext,
          notes: notes.trim() ? `${notes.trim()}\n\nTOOL: Cursor/App Development - Generate technical, code-focused prompts optimized for development tools.` : 'TOOL: Cursor/App Development - Generate technical, code-focused prompts optimized for development tools.',
          optimization_level: optimizationLevel,
          userId: userId
        }, { headers })

        if (response.data.needs_clarification) {
          setClarificationQuestion(response.data.question)
          setConversationContext([...conversationContext, 
            { role: 'user', content: originalPrompt },
            { role: 'assistant', content: response.data.question }
          ])
          setOriginalPrompt('')
        } else {
          setOptimizedPrompt(response.data.generated_prompt)
          setImprovements(response.data.improvements || ['Dev prompt generated successfully'])
          setClarificationQuestion(null)
          setConversationContext([])
          setGenerateMode(false)
        }
      } else {
        // Handle regular generation
        const response = await axios.post('http://localhost:4206/api/generate', {
          user_input: originalPrompt.trim(),
          conversation_context: conversationContext,
          notes: notes.trim() || undefined,
          optimization_level: optimizationLevel,
          userId: userId
        }, { headers })

        if (response.data.needs_clarification) {
          setClarificationQuestion(response.data.question)
          setConversationContext([...conversationContext, 
            { role: 'user', content: originalPrompt },
            { role: 'assistant', content: response.data.question }
          ])
          setOriginalPrompt('')
        } else {
          setOptimizedPrompt(response.data.generated_prompt)
          setImprovements(response.data.improvements || ['Prompt generated successfully'])
          setClarificationQuestion(null)
          setConversationContext([])
          setGenerateMode(false)
        }
      }
    } catch (error) {
      console.error('Error generating prompt:', error)
      alert('Failed to generate prompt. Make sure the backend is running.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswerQuestion = async () => {
    if (!originalPrompt.trim()) return

    // Add user's answer to conversation context
    const updatedContext = [...conversationContext, { role: 'user', content: originalPrompt }]
    setConversationContext(updatedContext)
    const answerText = originalPrompt
    setOriginalPrompt('') // Clear input
    setClarificationQuestion(null)

    // Continue generation with the answer
    setGenerating(true)
    try {
      const userId = getUserId()
      const token = typeof window !== 'undefined' 
        ? getUnifiedToken()
        : null
      
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      if (writeTool === 'suno') {
        // Build notes from variables if in detailed mode
        let sunoNotes = notes.trim() || ''
        if (sunoModeType === 'detailed') {
          const varNotes = Object.entries(sunoVariables)
            .filter(([key, value]) => value && value.trim())
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
          if (varNotes) {
            sunoNotes = sunoNotes ? `${sunoNotes}\n\nVariables: ${varNotes}` : `Variables: ${varNotes}`
          }
        }
        
        // Handle Suno generation
        const response = await axios.post('http://localhost:4206/api/suno', {
          user_input: answerText,
          conversation_context: conversationContext,
          mode: sunoModeType,
          notes: sunoNotes || undefined,
          userId: userId
        }, { headers })

        if (response.data.needs_clarification) {
          setClarificationQuestion(response.data.question)
          setConversationContext([...updatedContext, { role: 'assistant', content: response.data.question }])
          setOriginalPrompt('')
        } else {
          setSunoStyleBox(response.data.style_box)
          setSunoLyricsBox(response.data.lyrics_box)
          // Update variables from response if in detailed mode
          if (sunoModeType === 'detailed' && response.data.extracted_variables) {
            setSunoVariables(prev => ({
              ...prev,
              ...response.data.extracted_variables
            }))
          }
          setClarificationQuestion(null)
          setConversationContext([])
        }
      } else if (writeTool === 'dev') {
        // Handle Dev generation
        const response = await axios.post('http://localhost:4206/api/generate', {
          user_input: answerText,
          conversation_context: conversationContext,
          notes: notes.trim() ? `${notes.trim()}\n\nTOOL: Cursor/App Development - Generate technical, code-focused prompts optimized for development tools.` : 'TOOL: Cursor/App Development - Generate technical, code-focused prompts optimized for development tools.',
          optimization_level: optimizationLevel,
          userId: userId
        }, { headers })

        if (response.data.needs_clarification) {
          setClarificationQuestion(response.data.question)
          setConversationContext([...updatedContext, { role: 'assistant', content: response.data.question }])
          setOriginalPrompt('')
        } else {
          setOptimizedPrompt(response.data.generated_prompt)
          setImprovements(response.data.improvements || ['Dev prompt generated successfully'])
          setClarificationQuestion(null)
          setConversationContext([])
          setGenerateMode(false)
        }
      } else {
        // Handle regular generation
        const response = await axios.post('http://localhost:4206/api/generate', {
          user_input: answerText,
          conversation_context: conversationContext,
          notes: notes.trim() || undefined,
          optimization_level: optimizationLevel,
          userId: userId
        }, { headers })

        if (response.data.needs_clarification) {
          setClarificationQuestion(response.data.question)
          setConversationContext([...updatedContext, { role: 'assistant', content: response.data.question }])
          setOriginalPrompt('')
        } else {
          setOptimizedPrompt(response.data.generated_prompt)
          setImprovements(response.data.improvements || ['Prompt generated successfully'])
          setClarificationQuestion(null)
          setConversationContext([])
          setGenerateMode(false)
        }
      }
    } catch (error) {
      console.error('Error continuing generation:', error)
      alert('Failed to continue generation.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRewrite = async () => {
    if (!originalPrompt.trim()) return

    setLoading(true)
    try {
      const userId = getUserId()
      // Get auth token if available
      const token = typeof window !== 'undefined' 
        ? getUnifiedToken()
        : null
      
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      // Map writeTool to write_mode for backend
      let backendWriteMode = writeMode
      if (writeMode === 'humans') {
        if (writeTool === 'social_media') {
          backendWriteMode = 'social_media'
        } else if (writeTool === 'friends') {
          backendWriteMode = 'friends'
        } else if (writeTool === 'staff') {
          backendWriteMode = 'staff'
        }
      }
      
      const response = await axios.post('http://localhost:4206/api/rewrite', {
        prompt: originalPrompt,
        optimization_level: optimizationLevel,
        write_mode: backendWriteMode,
        userId: userId,
        notes: notes.trim() || undefined
      }, { headers })

      setOptimizedPrompt(response.data.optimized_prompt)
      setImprovements(response.data.improvements)
      
      // Handle language variants
      if (response.data.language_variants) {
        setLanguageVariants(response.data.language_variants)
        // Set default to English if available
        if (response.data.language_variants.eng) {
          setSelectedLanguage('eng')
        } else {
          // Use first available language
          const firstLang = Object.keys(response.data.language_variants)[0]
          setSelectedLanguage(firstLang)
        }
      } else {
        setLanguageVariants(null)
        setSelectedLanguage('eng')
      }
    } catch (error) {
      console.error('Error rewriting prompt:', error)
      alert('Failed to rewrite prompt. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Prompt Writer</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        {writeMode === 'humans' 
          ? 'Optimize your words to be better understood, reducing redundancy, emphasizing key points, intensity when needed, and ultimately, improving understanding.'
          : 'Optimize your prompts to be more AI-friendly, reducing processing intensity and improving understanding.'}
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Write Mode:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setWriteMode('ai')
              setWriteTool('general')
              setSunoStyleBox('')
              setSunoLyricsBox('')
              setConversationContext([])
              setClarificationQuestion(null)
            }}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              border: '2px solid',
              borderColor: writeMode === 'ai' ? '#0070f3' : '#ccc',
              backgroundColor: writeMode === 'ai' ? '#0070f3' : 'white',
              color: writeMode === 'ai' ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            Write for AI
          </button>
          <button
            onClick={() => {
              setWriteMode('humans')
              setWriteTool('social_media')
              setSunoStyleBox('')
              setSunoLyricsBox('')
              setConversationContext([])
              setClarificationQuestion(null)
            }}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              border: '2px solid',
              borderColor: writeMode === 'humans' ? '#0070f3' : '#ccc',
              backgroundColor: writeMode === 'humans' ? '#0070f3' : 'white',
              color: writeMode === 'humans' ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            Write for Humans
          </button>
        </div>
        
        {/* Sub-tools for Write for AI */}
        {writeMode === 'ai' && (
          <div style={{ marginTop: '0.5rem', marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #0070f3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#666' }}>
              AI Tools:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setWriteTool('general')
                  setGenerateMode(true)
                  setSunoStyleBox('')
                  setSunoLyricsBox('')
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid',
                  borderColor: writeTool === 'general' ? '#0070f3' : '#ddd',
                  backgroundColor: writeTool === 'general' ? '#e3f2fd' : 'white',
                  color: writeTool === 'general' ? '#0070f3' : '#666',
                  cursor: 'pointer',
                  fontWeight: writeTool === 'general' ? '600' : '400',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                General AI
              </button>
              <button
                onClick={() => {
                  setWriteTool('dev')
                  setGenerateMode(true)
                  setSunoStyleBox('')
                  setSunoLyricsBox('')
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid',
                  borderColor: writeTool === 'dev' ? '#0070f3' : '#ddd',
                  backgroundColor: writeTool === 'dev' ? '#e3f2fd' : 'white',
                  color: writeTool === 'dev' ? '#0070f3' : '#666',
                  cursor: 'pointer',
                  fontWeight: writeTool === 'dev' ? '600' : '400',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                Write for Dev
              </button>
              <button
                onClick={() => {
                  setWriteTool('suno')
                  setGenerateMode(true)
                  setSunoStyleBox('')
                  setSunoLyricsBox('')
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid',
                  borderColor: writeTool === 'suno' ? '#0070f3' : '#ddd',
                  backgroundColor: writeTool === 'suno' ? '#e3f2fd' : 'white',
                  color: writeTool === 'suno' ? '#0070f3' : '#666',
                  cursor: 'pointer',
                  fontWeight: writeTool === 'suno' ? '600' : '400',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                Write for Suno
              </button>
            </div>
            {writeTool === 'suno' && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold', marginRight: '0.5rem' }}>Mode:</span>
                <button
                  onClick={() => setSunoModeType('fast')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '2px solid',
                  borderColor: sunoModeType === 'fast' ? '#0070f3' : '#ddd',
                  backgroundColor: sunoModeType === 'fast' ? '#0070f3' : 'white',
                  color: sunoModeType === 'fast' ? 'white' : '#666',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                >
                  Fast
                </button>
                <button
                  onClick={() => setSunoModeType('detailed')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '2px solid',
                  borderColor: sunoModeType === 'detailed' ? '#0070f3' : '#ddd',
                  backgroundColor: sunoModeType === 'detailed' ? '#0070f3' : 'white',
                  color: sunoModeType === 'detailed' ? 'white' : '#666',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                >
                  Detailed
                </button>
                <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.5rem' }}>
                  {sunoModeType === 'fast' 
                    ? 'Quick generation with minimal questions'
                    : 'Interactive mode with more variables and better results'}
                </span>
              </div>
            )}
            {writeTool === 'suno' && sunoModeType === 'detailed' && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0070f3' }}>
                  Music Variables (Auto-filled from conversation)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <VariableInput
                    label="Genre"
                    value={sunoVariables.genre}
                    onChange={(value) => setSunoVariables({...sunoVariables, genre: value})}
                    placeholder="e.g., Pop, Rock, K-pop"
                    suggestions={genreSuggestions}
                  />
                  <VariableInput
                    label="Sub-Genre"
                    value={sunoVariables.subGenre}
                    onChange={(value) => setSunoVariables({...sunoVariables, subGenre: value})}
                    placeholder="e.g., Synth-pop, Metalcore"
                  />
                  <VariableInput
                    label="BPM"
                    value={sunoVariables.bpm}
                    onChange={(value) => setSunoVariables({...sunoVariables, bpm: value})}
                    placeholder="e.g., 120"
                    suggestions={bpmSuggestions}
                  />
                  <VariableInput
                    label="Key"
                    value={sunoVariables.key}
                    onChange={(value) => setSunoVariables({...sunoVariables, key: value})}
                    placeholder="e.g., C Major, Am"
                    suggestions={keySuggestions}
                  />
                  <VariableInput
                    label="Era"
                    value={sunoVariables.era}
                    onChange={(value) => setSunoVariables({...sunoVariables, era: value})}
                    placeholder="e.g., 2020s, 1980s, Vintage"
                    suggestions={eraSuggestions}
                  />
                  <VariableInput
                    label="Mic Type"
                    value={sunoVariables.micType}
                    onChange={(value) => setSunoVariables({...sunoVariables, micType: value})}
                    placeholder="e.g., Neumann U87, SM58"
                  />
                  <VariableInput
                    label="Production FX"
                    value={sunoVariables.productionFX}
                    onChange={(value) => setSunoVariables({...sunoVariables, productionFX: value})}
                    type="select"
                    options={[
                      { value: '', label: 'Select...' },
                      { value: 'Lo-fi grit', label: 'Lo-fi grit' },
                      { value: 'Modern radio polish', label: 'Modern radio polish' },
                      { value: 'Vintage 2-inch tape saturation', label: 'Vintage 2-inch tape saturation' },
                      { value: 'Sidechain compression', label: 'Sidechain compression' },
                      { value: 'Gated reverb', label: 'Gated reverb' },
                      { value: 'Tube saturation', label: 'Tube saturation' }
                    ]}
                  />
                  <VariableInput
                    label="Vocal Style"
                    value={sunoVariables.vocalStyle}
                    onChange={(value) => setSunoVariables({...sunoVariables, vocalStyle: value})}
                    type="select"
                    options={[
                      { value: '', label: 'Select...' },
                      { value: 'Vocal fry', label: 'Vocal fry' },
                      { value: 'Belting', label: 'Belting' },
                      { value: 'Whisper-track', label: 'Whisper-track' },
                      { value: 'Glottal stops', label: 'Glottal stops' },
                      { value: 'Falsetto', label: 'Falsetto' },
                      { value: 'Harmony', label: 'Harmony' }
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sub-tools for Write for Humans */}
        {writeMode === 'humans' && (
          <div style={{ marginTop: '0.5rem', marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #0070f3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#666' }}>
              Human Tools:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setWriteTool('social_media')
                  setGenerateMode(false)
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid',
                  borderColor: writeTool === 'social_media' ? '#0070f3' : '#ddd',
                  backgroundColor: writeTool === 'social_media' ? '#e3f2fd' : 'white',
                  color: writeTool === 'social_media' ? '#0070f3' : '#666',
                  cursor: 'pointer',
                  fontWeight: writeTool === 'social_media' ? '600' : '400',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                Socials
              </button>
              <button
                onClick={() => {
                  setWriteTool('friends')
                  setGenerateMode(false)
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid',
                  borderColor: writeTool === 'friends' ? '#ff9800' : '#ddd',
                  backgroundColor: writeTool === 'friends' ? '#fff3e0' : 'white',
                  color: writeTool === 'friends' ? '#ff9800' : '#666',
                  cursor: 'pointer',
                  fontWeight: writeTool === 'friends' ? '600' : '400',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                Friends
              </button>
              <button
                onClick={() => {
                  setWriteTool('staff')
                  setGenerateMode(false)
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid',
                  borderColor: writeTool === 'staff' ? '#2196f3' : '#ddd',
                  backgroundColor: writeTool === 'staff' ? '#e3f2fd' : 'white',
                  color: writeTool === 'staff' ? '#2196f3' : '#666',
                  cursor: 'pointer',
                  fontWeight: writeTool === 'staff' ? '600' : '400',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                Staff
              </button>
            </div>
          </div>
        )}

        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
          {writeTool === 'suno'
            ? 'Generate Suno music prompts - converts ideas into precision engineering schemas for music generation'
            : writeTool === 'dev'
            ? 'Generate prompts optimized for app development tools like Cursor - technical, precise, code-focused'
            : writeTool === 'social_media'
            ? 'Optimize social media posts for clarity and engagement'
            : writeTool === 'friends'
            ? 'Optimize messages for friendly, casual communication'
            : writeTool === 'staff'
            ? 'Optimize professional communications for staff and team members'
            : writeMode === 'humans' 
            ? 'Optimize prompts to be more human-readable and natural'
            : 'Optimize prompts to be more AI-friendly and efficient (context-aware for your profession)'}
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Optimization Level:
        </label>
        <select
          value={optimizationLevel}
          onChange={(e) => setOptimizationLevel(e.target.value)}
          style={{ 
            padding: '0.5rem', 
            borderRadius: '4px', 
            border: '1px solid #ccc', 
            width: '100%',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0070f3'
            e.target.style.outline = 'none'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#ccc'
          }}
        >
          <option value="minimal">Minimal - Light touch, preserves original</option>
          <option value="balanced">Balanced - Moderate optimization (recommended)</option>
          <option value="aggressive">Aggressive - Maximum optimization</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <button
            onClick={() => {
              setGenerateMode(!generateMode)
              if (generateMode) {
                // Reset when exiting generate mode
                setClarificationQuestion(null)
                setConversationContext([])
                setOriginalPrompt('')
              }
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '2px solid',
              borderColor: generateMode ? '#4caf50' : '#0070f3',
              backgroundColor: generateMode ? '#4caf50' : '#0070f3',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            {generateMode ? '✓ Generate Mode' : 'Original Prompt'}
          </button>
          {generateMode && (
            <span style={{ fontSize: '0.875rem', color: '#4caf50', fontStyle: 'italic' }}>
              AI will generate the prompt for you
            </span>
          )}
        </div>
        {clarificationQuestion && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '6px',
            border: '1px solid #0070f3'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#0070f3' }}>
              🤔 Question:
            </p>
            <p style={{ marginBottom: '1rem' }}>{clarificationQuestion}</p>
            <button
              onClick={handleAnswerQuestion}
              disabled={!originalPrompt.trim() || generating}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: originalPrompt.trim() && !generating ? 'pointer' : 'not-allowed',
                opacity: originalPrompt.trim() && !generating ? 1 : 0.6
              }}
            >
              Submit Answer
            </button>
          </div>
        )}
        <textarea
          value={originalPrompt}
          onChange={(e) => setOriginalPrompt(e.target.value)}
          placeholder={writeTool === 'suno'
            ? (clarificationQuestion
              ? "Answer the question above..."
              : "Describe your music idea, lyrics, or topic (e.g., 'A K-pop song about summer love' or paste lyrics)...")
            : writeTool === 'dev'
            ? (clarificationQuestion
              ? "Answer the question above..."
              : "Describe your app development need (e.g., 'Create a todo app with React and TypeScript')...")
            : generateMode 
            ? (clarificationQuestion 
              ? "Answer the question above..."
              : "Describe what you want the prompt to do (e.g., 'I want to create a chess game')...")
            : writeTool === 'social_media' 
            ? "Paste your social media post here..."
            : writeTool === 'friends'
            ? "Enter your message for friends..."
            : writeTool === 'staff'
            ? "Enter your professional message for staff..."
            : "Enter your prompt here..."}
          style={{
            width: '100%',
            minHeight: '150px',
            padding: '1rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'monospace'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0070f3'
            e.target.style.outline = 'none'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#ccc'
          }}
          onKeyDown={(e) => {
            // Allow all standard keyboard shortcuts to work
            // Don't prevent default for standard shortcuts like Cmd+A, Cmd+C, Cmd+V, etc.
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey
            
            // Allow standard shortcuts: Cmd/Ctrl+A, C, V, X, Z, etc.
            if (cmdOrCtrl && ['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase())) {
              // Let the browser handle these natively
              return
            }
            // Allow other standard shortcuts like arrow keys, delete, backspace, etc.
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
              return
            }
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Notes (Optional):
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional context, variables, or instructions that the prompt should take into account..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '1rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'inherit'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0070f3'
            e.target.style.outline = 'none'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#ccc'
          }}
          onKeyDown={(e) => {
            // Allow all standard keyboard shortcuts to work
            // Don't prevent default for standard shortcuts like Cmd+A, Cmd+C, Cmd+V, etc.
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey
            
            // Allow standard shortcuts: Cmd/Ctrl+A, C, V, X, Z, etc.
            if (cmdOrCtrl && ['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase())) {
              // Let the browser handle these natively
              return
            }
            // Allow other standard shortcuts like arrow keys, delete, backspace, etc.
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
              return
            }
          }}
        />
      </div>

      {generateMode ? (
        <button
          onClick={handleGeneratePrompt}
          disabled={generating || (!originalPrompt.trim() && conversationContext.length === 0)}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (originalPrompt.trim() || conversationContext.length > 0) && !generating ? 'pointer' : 'not-allowed',
            opacity: (originalPrompt.trim() || conversationContext.length > 0) && !generating ? 1 : 0.6,
            marginBottom: '2rem'
          }}
        >
          {generating ? 'Generating...' : conversationContext.length > 0 ? 'Continue Generation' : 'Generate Prompt'}
        </button>
      ) : (
        <button
          onClick={handleRewrite}
          disabled={loading || !originalPrompt.trim()}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginBottom: '2rem'
          }}
        >
          {loading ? 'Optimizing...' : 'Optimize Prompt'}
        </button>
      )}

      {writeTool === 'suno' && (sunoStyleBox || sunoLyricsBox) && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
              STYLE BOX (Copy/Paste):
            </label>
            <textarea
              value={sunoStyleBox}
              readOnly
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #0070f3',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
              LYRICS BOX (Copy/Paste):
            </label>
            <textarea
              value={sunoLyricsBox}
              readOnly
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #0070f3',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap'
              }}
            />
          </div>
        </div>
      )}

      {optimizedPrompt && writeTool !== 'suno' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 'bold' }}>
              Optimized Prompt:
            </label>
            {languageVariants && Object.keys(languageVariants).length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#666', marginRight: '0.5rem' }}>Language:</span>
                {Object.entries(languageVariants).map(([langCode, promptText]) => {
                  // Map language codes to display names
                  const langDisplayNames: Record<string, string> = {
                    'eng': 'Eng',
                    'kor': 'Kor',
                    'vie': 'Vietnamese',
                    'jpn': 'Japanese',
                    'zho': 'Chinese',
                    'spa': 'Spanish',
                    'fra': 'French',
                    'ita': 'Italian',
                    'tha': 'Thai'
                  }
                  
                  const displayName = langDisplayNames[langCode] || langCode.toUpperCase()
                  
                  return (
                    <button
                      key={langCode}
                      onClick={() => {
                        setSelectedLanguage(langCode)
                        setOptimizedPrompt(promptText)
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: '2px solid',
                        borderColor: selectedLanguage === langCode ? '#0070f3' : '#ccc',
                        backgroundColor: selectedLanguage === langCode ? '#0070f3' : 'white',
                        color: selectedLanguage === langCode ? 'white' : '#333',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {displayName}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <textarea
            value={selectedLanguage && languageVariants?.[selectedLanguage] || optimizedPrompt}
            readOnly
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #4caf50',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: 'monospace'
            }}
          />

          {improvements.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Improvements Made:</h3>
              <ul>
                {improvements.map((improvement, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem' }}>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Assist Chat Window - Always visible for Prompt Writer (non-chat based backend tool) */}
      <AssistChat
        onVariableUpdate={handleVariableUpdate}
        currentVariables={writeTool === 'suno' && sunoModeType === 'detailed' ? sunoVariables : {}}
        conversationContext={conversationContext}
        availableFields={writeTool === 'suno' && sunoModeType === 'detailed' ? [
          { key: 'genre', label: 'Genre', suggestions: ['Pop', 'Rock', 'Metalcore', 'Hip Hop', 'Electronic'] },
          { key: 'subGenre', label: 'Sub-Genre' },
          { key: 'bpm', label: 'BPM', suggestions: ['120', '140', '160', '180'] },
          { key: 'key', label: 'Key', suggestions: ['C Major', 'A Minor', 'D Major', 'E Minor'] },
          { key: 'era', label: 'Era', suggestions: ['2020s', '1980s', '1990s', '2000s'] },
          { key: 'micType', label: 'Mic Type' },
          { key: 'productionFX', label: 'Production FX', suggestions: ['Modern radio polish', 'Lo-fi grit', 'Vintage 2-inch tape saturation'] },
          { key: 'vocalStyle', label: 'Vocal Style', suggestions: ['Belting', 'Screaming', 'Whisper-track', 'Falsetto'] },
          { key: 'instrumentation', label: 'Instrumentation' },
          { key: 'energy', label: 'Energy' },
          { key: 'arrangement', label: 'Arrangement' },
          { key: 'dynamics', label: 'Dynamics' }
        ] : []}
        pageContext={writeTool === 'suno' && sunoModeType === 'detailed' 
          ? 'Prompt Writer - Suno Music Variables Form' 
          : 'Prompt Writer'}
      />
    </div>
  )
}


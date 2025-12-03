import { useState, useEffect } from 'react'

export function useNetworkIP(port: number = 4200) {
  const [ipAddress, setIpAddress] = useState<string>('localhost')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIP = async () => {
      try {
        // Try to get IP from backend
        const response = await fetch('http://localhost:4202/api/network-ip')
        if (response.ok) {
          const data = await response.json()
          setIpAddress(data.ip || 'localhost')
        } else {
          // Fallback: try to detect from WebRTC
          detectIPFromWebRTC()
        }
      } catch (error) {
        // Fallback: try to detect from WebRTC
        detectIPFromWebRTC()
      } finally {
        setLoading(false)
      }
    }

    const detectIPFromWebRTC = () => {
      // Use WebRTC to detect local IP
      const RTCPeerConnection = (window as any).RTCPeerConnection || 
                                (window as any).webkitRTCPeerConnection || 
                                (window as any).mozRTCPeerConnection

      if (!RTCPeerConnection) {
        setIpAddress('localhost')
        setLoading(false)
        return
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      pc.createDataChannel('')
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          setIpAddress('localhost')
          setLoading(false)
        })

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate
          const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/)
          if (match && match[1] && !match[1].startsWith('127.')) {
            setIpAddress(match[1])
            setLoading(false)
            pc.close()
          }
        } else {
          // No more candidates, use localhost as fallback
          if (ipAddress === 'localhost') {
            setLoading(false)
          }
          pc.close()
        }
      }

      // Timeout after 3 seconds
      setTimeout(() => {
        setLoading(false)
        pc.close()
      }, 3000)
    }

    fetchIP()
  }, [port])

  return {
    ipAddress,
    url: `http://${ipAddress}:${port}`,
    loading,
  }
}


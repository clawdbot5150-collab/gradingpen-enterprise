import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff, Pause, Play, Square, Volume2 } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useSocket } from '@/services/socketService'
import { Message } from '@/types/chat'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import FeedbackPanel from '../feedback/FeedbackPanel'
import PersonalityIndicator from '../profiles/PersonalityIndicator'
import SessionTimer from './SessionTimer'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface ChatInterfaceProps {
  sessionId: string
  personalityId: string
  scenarioId?: string
  className?: string
}

export default function ChatInterface({ 
  sessionId, 
  personalityId, 
  scenarioId, 
  className 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const {
    messages,
    isTyping,
    session,
    sendMessage,
    pauseSession,
    resumeSession,
    completeSession,
    fetchMessages,
    loading
  } = useChatStore()
  
  const socket = useSocket()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Load messages on mount
  useEffect(() => {
    if (sessionId) {
      fetchMessages(sessionId)
    }
  }, [sessionId, fetchMessages])

  // Handle socket events
  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage)
      socket.on('typing_start', () => useChatStore.getState().setTyping(true))
      socket.on('typing_stop', () => useChatStore.getState().setTyping(false))
      socket.on('session_paused', () => setIsPaused(true))
      socket.on('session_resumed', () => setIsPaused(false))
      socket.on('real_time_feedback', handleRealTimeFeedback)

      return () => {
        socket.off('new_message')
        socket.off('typing_start')
        socket.off('typing_stop')
        socket.off('session_paused')
        socket.off('session_resumed')
        socket.off('real_time_feedback')
      }
    }
  }, [socket])

  const handleNewMessage = (newMessage: Message) => {
    const { addMessage } = useChatStore.getState()
    addMessage(newMessage)
  }

  const handleRealTimeFeedback = (feedback: any) => {
    if (feedback.suggestions && feedback.suggestions.length > 0) {
      toast(feedback.suggestions[0], {
        icon: '💡',
        duration: 6000,
      })
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || loading || isPaused) return

    const messageContent = message.trim()
    setMessage('')

    // Emit typing start
    socket?.emit('typing_start', { sessionId })

    try {
      await sendMessage(sessionId, messageContent)
      socket?.emit('typing_stop', { sessionId })
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
      socket?.emit('typing_stop', { sessionId })
      setMessage(messageContent) // Restore message on error
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await resumeSession(sessionId)
        toast.success('Session resumed')
      } else {
        await pauseSession(sessionId)
        toast.success('Session paused')
      }
    } catch (error) {
      toast.error('Failed to update session status')
    }
  }

  const handleCompleteSession = async () => {
    try {
      await completeSession(sessionId)
      toast.success('Session completed successfully!')
      // Navigate to feedback page or show feedback modal
    } catch (error) {
      toast.error('Failed to complete session')
    }
  }

  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsRecording(true)
      // Implement voice recognition
      toast('Voice recording started', { icon: '🎤' })
    } else {
      toast.error('Speech recognition not supported in this browser')
    }
  }

  const stopVoiceRecording = () => {
    setIsRecording(false)
    // Stop voice recognition and process result
    toast('Voice recording stopped', { icon: '🎤' })
  }

  return (
    <div className={clsx(
      'flex flex-col h-full bg-white dark:bg-gray-900',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <PersonalityIndicator personalityId={personalityId} />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {session?.personality?.displayName || 'AI Conversation Partner'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {session?.scenario?.title || 'Free Conversation'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <SessionTimer 
            sessionId={sessionId} 
            startTime={session?.startedAt} 
            isPaused={isPaused}
          />
          
          <button
            onClick={handlePauseResume}
            className={clsx(
              'p-2 rounded-full transition-colors',
              isPaused 
                ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
            )}
            disabled={loading}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 transition-colors"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleCompleteSession}
            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 transition-colors"
            disabled={loading}
          >
            <Square className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isUser={msg.sender === 'USER'}
              showAvatar={index === 0 || messages[index - 1]?.sender !== msg.sender}
            />
          ))}
        </AnimatePresence>
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {isPaused && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
              Session is paused. Click the play button to resume.
            </p>
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isPaused 
                    ? "Session is paused..." 
                    : "Type your message here... (Press Enter to send, Shift+Enter for new line)"
                }
                disabled={loading || isPaused}
                className={clsx(
                  'w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                  'placeholder-gray-500 dark:placeholder-gray-400',
                  'resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
                  'min-h-[48px] max-h-32'
                )}
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '48px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                }}
              />
            </div>
            
            {/* Voice Recording Button */}
            <button
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onMouseLeave={stopVoiceRecording}
              className={clsx(
                'p-3 rounded-full transition-all duration-200',
                isRecording
                  ? 'bg-red-500 text-white scale-110 animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
              disabled={loading || isPaused}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || loading || isPaused}
              className={clsx(
                'p-3 rounded-full transition-all duration-200',
                message.trim() && !loading && !isPaused
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Character Count */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {message.length > 1800 && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  {2000 - message.length} characters remaining
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      
      {/* Feedback Panel */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackPanel 
            sessionId={sessionId}
            onClose={() => setShowFeedback(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
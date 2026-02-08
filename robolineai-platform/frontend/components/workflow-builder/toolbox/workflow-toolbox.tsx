'use client'

import React, { useState } from 'react'
import { 
  PlayIcon,
  StopIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  CloudIcon,
  CpuChipIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  DatabaseIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon,
  RectangleGroupIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface ToolboxItem {
  id: string
  type: string
  label: string
  description: string
  icon: React.ComponentType<any>
  color: string
  category: string
  config?: Record<string, any>
}

const toolboxItems: ToolboxItem[] = [
  // Flow Control
  {
    id: 'start',
    type: 'start',
    label: 'Start',
    description: 'Begin workflow execution',
    icon: PlayIcon,
    color: 'green',
    category: 'Flow Control',
  },
  {
    id: 'end',
    type: 'end',
    label: 'End',
    description: 'End workflow execution',
    icon: StopIcon,
    color: 'red',
    category: 'Flow Control',
  },
  {
    id: 'condition',
    type: 'condition',
    label: 'Condition',
    description: 'Decision point with true/false paths',
    icon: QuestionMarkCircleIcon,
    color: 'purple',
    category: 'Flow Control',
  },
  {
    id: 'loop',
    type: 'loop',
    label: 'Loop',
    description: 'Repeat actions multiple times',
    icon: ArrowPathIcon,
    color: 'orange',
    category: 'Flow Control',
  },
  {
    id: 'subprocess',
    type: 'subprocess',
    label: 'Subprocess',
    description: 'Call another workflow',
    icon: RectangleGroupIcon,
    color: 'indigo',
    category: 'Flow Control',
  },

  // UI Automation
  {
    id: 'click',
    type: 'action',
    label: 'Click',
    description: 'Click on UI elements',
    icon: CursorArrowRaysIcon,
    color: 'blue',
    category: 'UI Automation',
    config: { actionType: 'click' },
  },
  {
    id: 'type',
    type: 'action',
    label: 'Type Text',
    description: 'Enter text into input fields',
    icon: DocumentTextIcon,
    color: 'blue',
    category: 'UI Automation',
    config: { actionType: 'type' },
  },
  {
    id: 'extract',
    type: 'action',
    label: 'Extract Data',
    description: 'Extract text from UI elements',
    icon: CpuChipIcon,
    color: 'blue',
    category: 'UI Automation',
    config: { actionType: 'data_extraction' },
  },

  // AI & Computer Vision
  {
    id: 'ocr',
    type: 'action',
    label: 'OCR Text',
    description: 'Extract text from images',
    icon: EyeIcon,
    color: 'green',
    category: 'AI & Computer Vision',
    config: { actionType: 'image_recognition' },
  },
  {
    id: 'image_recognition',
    type: 'action',
    label: 'Image Recognition',
    description: 'Recognize objects in images',
    icon: EyeIcon,
    color: 'green',
    category: 'AI & Computer Vision',
    config: { actionType: 'image_recognition' },
  },

  // Communication
  {
    id: 'email',
    type: 'action',
    label: 'Send Email',
    description: 'Send email notifications',
    icon: EnvelopeIcon,
    color: 'yellow',
    category: 'Communication',
    config: { actionType: 'email' },
  },

  // Integration
  {
    id: 'api_call',
    type: 'action',
    label: 'API Call',
    description: 'Make HTTP requests to APIs',
    icon: CloudIcon,
    color: 'purple',
    category: 'Integration',
    config: { actionType: 'api_call' },
  },
  {
    id: 'database',
    type: 'action',
    label: 'Database',
    description: 'Read/write database records',
    icon: DatabaseIcon,
    color: 'purple',
    category: 'Integration',
    config: { actionType: 'database' },
  },

  // File Operations
  {
    id: 'file_operation',
    type: 'action',
    label: 'File Operation',
    description: 'Read, write, or move files',
    icon: DocumentDuplicateIcon,
    color: 'orange',
    category: 'File Operations',
    config: { actionType: 'file_operation' },
  },
]

interface WorkflowToolboxProps {
  className?: string
}

export function WorkflowToolbox({ className = '' }: WorkflowToolboxProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const categories = Array.from(new Set(toolboxItems.map(item => item.category)))
  
  const filteredItems = toolboxItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = filteredItems.filter(item => item.category === category)
    return acc
  }, {} as Record<string, ToolboxItem[]>)

  const onDragStart = (event: React.DragEvent, item: ToolboxItem) => {
    event.dataTransfer.setData('application/reactflow', item.type)
    event.dataTransfer.setData('application/nodeData', JSON.stringify({
      label: item.label,
      description: item.description,
      config: item.config || {},
    }))
    event.dataTransfer.effectAllowed = 'move'
  }

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category)
    } else {
      newCollapsed.add(category)
    }
    setCollapsedCategories(newCollapsed)
  }

  return (
    <div className={cn('toolbox-panel h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Toolbox
        </h2>
        
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedItems).map(([category, items]) => {
          if (items.length === 0) return null
          
          const isCollapsed = collapsedCategories.has(category)
          
          return (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full text-left p-2 rounded-md
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                <div className="flex items-center space-x-2">
                  <FolderIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {category}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                    {items.length}
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Category Items */}
              {!isCollapsed && (
                <div className="space-y-1 pl-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border 
                               border-gray-200 dark:border-gray-600 cursor-grab hover:cursor-grabbing
                               hover:border-primary-300 hover:shadow-sm transition-all duration-150
                               active:cursor-grabbing"
                    >
                      <div className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
                        `bg-${item.color}-100 dark:bg-${item.color}-900`
                      )}>
                        <item.icon className={cn(
                          'w-5 h-5',
                          `text-${item.color}-600 dark:text-${item.color}-400`
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              No components found for "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
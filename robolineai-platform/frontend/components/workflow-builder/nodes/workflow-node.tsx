'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  PlayIcon, 
  StopIcon, 
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { WorkflowNodeData, NodeStatus } from '@/types/workflow'

interface WorkflowNodeProps extends NodeProps<WorkflowNodeData> {
  selected?: boolean
}

export function WorkflowNode({ 
  id, 
  data, 
  selected = false,
  type = 'default'
}: WorkflowNodeProps) {
  const {
    label,
    description,
    status = 'idle',
    config = {},
    icon,
    color = 'blue',
    errors = [],
    warnings = [],
  } = data

  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="w-4 h-4 text-green-500" />
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
      case 'stopped':
        return <StopIcon className="w-4 h-4 text-gray-500" />
      default:
        return <Cog6ToothIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'running':
        return 'border-green-400 bg-green-50'
      case 'completed':
        return 'border-green-500 bg-green-50'
      case 'error':
        return 'border-red-400 bg-red-50'
      case 'warning':
        return 'border-yellow-400 bg-yellow-50'
      case 'stopped':
        return 'border-gray-400 bg-gray-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-l-blue-500',
      green: 'border-l-green-500',
      purple: 'border-l-purple-500',
      orange: 'border-l-orange-500',
      red: 'border-l-red-500',
      yellow: 'border-l-yellow-500',
      indigo: 'border-l-indigo-500',
      pink: 'border-l-pink-500',
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  return (
    <div
      className={cn(
        'workflow-node min-w-[200px] max-w-[280px]',
        'border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200',
        getStatusColor(status),
        getColorClasses(color),
        selected && 'ring-2 ring-primary-400 ring-offset-2',
        status === 'running' && 'animate-pulse'
      )}
    >
      {/* Input Handle */}
      {type !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-gray-600"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {icon && (
            <div className="flex-shrink-0">
              {React.createElement(icon, { className: 'w-5 h-5' })}
            </div>
          )}
          <h3 className="font-medium text-gray-900 truncate text-sm">
            {label}
          </h3>
        </div>
        <div className="flex-shrink-0 ml-2">
          {getStatusIcon(status)}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {description}
        </p>
      )}

      {/* Configuration Preview */}
      {Object.keys(config).length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Configuration:</div>
          <div className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1 max-h-16 overflow-y-auto">
            {Object.entries(config).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="ml-1 truncate">{String(value)}</span>
              </div>
            ))}
            {Object.keys(config).length > 3 && (
              <div className="text-gray-400 text-center">
                +{Object.keys(config).length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Errors and Warnings */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="mb-2 space-y-1">
          {errors.map((error, index) => (
            <div
              key={`error-${index}`}
              className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 flex items-center space-x-1"
            >
              <ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          ))}
          {warnings.map((warning, index) => (
            <div
              key={`warning-${index}`}
              className="text-xs text-yellow-600 bg-yellow-50 rounded px-2 py-1 flex items-center space-x-1"
            >
              <ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status Text */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="capitalize">{status}</span>
        <span className="text-gray-400">#{id.slice(-6)}</span>
      </div>

      {/* Output Handle */}
      {type !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-gray-600"
        />
      )}
    </div>
  )
}
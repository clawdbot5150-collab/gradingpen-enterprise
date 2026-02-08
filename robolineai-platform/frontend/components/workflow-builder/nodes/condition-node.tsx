'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { WorkflowNodeData } from '@/types/workflow'

export function ConditionNode({ id, data, selected = false }: NodeProps<WorkflowNodeData>) {
  const { label = 'Condition', description, config = {}, status = 'idle' } = data

  return (
    <div
      className={cn(
        'bg-white border-2 border-purple-400 rounded-lg shadow-lg',
        'transform rotate-45 w-24 h-24 flex items-center justify-center',
        'hover:shadow-xl transition-all duration-200',
        selected && 'ring-4 ring-purple-200 ring-offset-2',
        status === 'running' && 'animate-pulse'
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-white bg-purple-400 hover:bg-purple-600 -rotate-45"
        style={{ transform: 'rotate(-45deg) translate(-50%, -50%)', top: '-6px' }}
      />

      <div className="text-center -rotate-45">
        <QuestionMarkCircleIcon className="w-6 h-6 text-purple-600 mx-auto mb-1" />
        <div className="text-xs font-semibold text-purple-800 truncate max-w-16">
          {label}
        </div>
      </div>

      {/* Output Handles - True and False */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 border-2 border-white bg-green-500 hover:bg-green-600 -rotate-45"
        style={{ transform: 'rotate(-45deg) translate(50%, 50%)', bottom: '-6px', left: 'calc(50% + 16px)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 border-2 border-white bg-red-500 hover:bg-red-600 -rotate-45"
        style={{ transform: 'rotate(-45deg) translate(-50%, 50%)', bottom: '-6px', right: 'calc(50% + 16px)' }}
      />
    </div>
  )
}
'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { StopIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import { WorkflowNodeData } from '@/types/workflow'

export function EndNode({ id, data, selected = false }: NodeProps<WorkflowNodeData>) {
  const { label = 'End', description, config = {} } = data

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-red-400 to-red-600 text-white',
        'rounded-full w-20 h-20 flex items-center justify-center',
        'shadow-lg hover:shadow-xl transition-all duration-200',
        'border-4 border-red-300',
        selected && 'ring-4 ring-red-200 ring-offset-2'
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 border-2 border-white bg-red-500 hover:bg-red-600"
      />

      <div className="text-center">
        <StopIcon className="w-8 h-8 mx-auto mb-1" />
        <div className="text-xs font-semibold">{label}</div>
      </div>
    </div>
  )
}
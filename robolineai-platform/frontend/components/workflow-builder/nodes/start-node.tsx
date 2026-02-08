'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PlayIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import { WorkflowNodeData } from '@/types/workflow'

export function StartNode({ id, data, selected = false }: NodeProps<WorkflowNodeData>) {
  const { label = 'Start', description, config = {} } = data

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-green-400 to-green-600 text-white',
        'rounded-full w-20 h-20 flex items-center justify-center',
        'shadow-lg hover:shadow-xl transition-all duration-200',
        'border-4 border-green-300',
        selected && 'ring-4 ring-green-200 ring-offset-2'
      )}
    >
      <div className="text-center">
        <PlayIcon className="w-8 h-8 mx-auto mb-1" />
        <div className="text-xs font-semibold">{label}</div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 border-2 border-white bg-green-500 hover:bg-green-600"
      />
    </div>
  )
}
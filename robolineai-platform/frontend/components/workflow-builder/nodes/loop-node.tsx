'use client'

import React from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { WorkflowNode } from './workflow-node'
import { NodeProps } from 'reactflow'
import { WorkflowNodeData } from '@/types/workflow'

export function LoopNode(props: NodeProps<WorkflowNodeData>) {
  const enhancedData = {
    ...props.data,
    icon: ArrowPathIcon,
    color: 'orange',
  }

  return <WorkflowNode {...props} data={enhancedData} />
}
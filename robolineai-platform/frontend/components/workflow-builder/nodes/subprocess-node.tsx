'use client'

import React from 'react'
import { RectangleGroupIcon } from '@heroicons/react/24/outline'
import { WorkflowNode } from './workflow-node'
import { NodeProps } from 'reactflow'
import { WorkflowNodeData } from '@/types/workflow'

export function SubprocessNode(props: NodeProps<WorkflowNodeData>) {
  const enhancedData = {
    ...props.data,
    icon: RectangleGroupIcon,
    color: 'indigo',
  }

  return <WorkflowNode {...props} data={enhancedData} />
}
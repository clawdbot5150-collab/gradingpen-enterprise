'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  CursorArrowRaysIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  CloudIcon,
  CpuChipIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  DatabaseIcon,
} from '@heroicons/react/24/outline'
import { WorkflowNode } from './workflow-node'
import { WorkflowNodeData } from '@/types/workflow'

const actionIcons = {
  click: CursorArrowRaysIcon,
  type: DocumentTextIcon,
  email: EnvelopeIcon,
  api_call: CloudIcon,
  data_extraction: CpuChipIcon,
  image_recognition: EyeIcon,
  file_operation: DocumentDuplicateIcon,
  database: DatabaseIcon,
}

export function ActionNode(props: NodeProps<WorkflowNodeData>) {
  const { data } = props
  const actionType = data.config?.actionType as keyof typeof actionIcons
  const icon = actionType && actionIcons[actionType] ? actionIcons[actionType] : CpuChipIcon

  const enhancedData = {
    ...data,
    icon,
    color: 'blue',
  }

  return <WorkflowNode {...props} data={enhancedData} />
}
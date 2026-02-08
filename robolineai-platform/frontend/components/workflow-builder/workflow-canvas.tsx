'use client'

import React, { useCallback, useRef, useState, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { WorkflowNode } from './nodes/workflow-node'
import { StartNode } from './nodes/start-node'
import { EndNode } from './nodes/end-node'
import { ConditionNode } from './nodes/condition-node'
import { ActionNode } from './nodes/action-node'
import { LoopNode } from './nodes/loop-node'
import { SubprocessNode } from './nodes/subprocess-node'
import { CustomEdge } from './edges/custom-edge'

import { useWorkflowStore } from '@/stores/workflow-store'
import { WorkflowNodeType, WorkflowNodeData } from '@/types/workflow'

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  condition: ConditionNode,
  loop: LoopNode,
  subprocess: SubprocessNode,
  default: WorkflowNode,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

const defaultEdgeOptions = {
  type: 'custom',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#1f2937',
  },
  style: {
    stroke: '#1f2937',
    strokeWidth: 2,
  },
}

interface WorkflowCanvasProps {
  workflowId?: string
  readonly?: boolean
  className?: string
}

export function WorkflowCanvas({ 
  workflowId, 
  readonly = false,
  className = ''
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  
  const {
    nodes,
    edges,
    selectedNode,
    setNodes,
    setEdges,
    selectNode,
    addNode,
    updateNode,
    deleteNode,
    validateWorkflow,
  } = useWorkflowStore()

  const [nodesState, setNodesState, onNodesChange] = useNodesState(nodes)
  const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges)

  // Sync with store
  React.useEffect(() => {
    setNodes(nodesState)
  }, [nodesState, setNodes])

  React.useEffect(() => {
    setEdges(edgesState)
  }, [edgesState, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readonly) return
      
      const newEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        type: 'custom',
        animated: false,
        ...defaultEdgeOptions,
      }
      
      setEdgesState((edges) => addEdge(newEdge, edges))
    },
    [setEdgesState, readonly]
  )

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (readonly) return
      selectNode(node.id)
    },
    [selectNode, readonly]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (readonly) return
      
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds || !reactFlowInstance) return

      const type = event.dataTransfer.getData('application/reactflow')
      const nodeData = JSON.parse(event.dataTransfer.getData('application/nodeData') || '{}')

      if (!type) return

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNodeId = `node-${Date.now()}`
      const newNode: Node<WorkflowNodeData> = {
        id: newNodeId,
        type: type as WorkflowNodeType,
        position,
        data: {
          label: nodeData.label || `New ${type}`,
          description: nodeData.description || '',
          config: nodeData.config || {},
          ...nodeData,
        },
      }

      addNode(newNode)
      setNodesState((nodes) => [...nodes, newNode])
    },
    [reactFlowInstance, addNode, setNodesState, readonly]
  )

  const onNodeDelete = useCallback(
    (nodeId: string) => {
      if (readonly) return
      
      deleteNode(nodeId)
      setNodesState((nodes) => nodes.filter((node) => node.id !== nodeId))
      setEdgesState((edges) => 
        edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      )
    },
    [deleteNode, setNodesState, setEdgesState, readonly]
  )

  const onNodeUpdate = useCallback(
    (nodeId: string, data: Partial<WorkflowNodeData>) => {
      if (readonly) return
      
      updateNode(nodeId, data)
      setNodesState((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      )
    },
    [updateNode, setNodesState, readonly]
  )

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      if (readonly) return
      
      if (nodes.length === 1) {
        selectNode(nodes[0].id)
      } else {
        selectNode(null)
      }
    },
    [selectNode, readonly]
  )

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (readonly) return
      
      // Delete selected node
      if (event.key === 'Delete' && selectedNode) {
        onNodeDelete(selectedNode)
      }
      
      // Copy node (Ctrl+C)
      if (event.ctrlKey && event.key === 'c' && selectedNode) {
        // Implement copy functionality
      }
      
      // Paste node (Ctrl+V)
      if (event.ctrlKey && event.key === 'v') {
        // Implement paste functionality
      }
      
      // Undo (Ctrl+Z)
      if (event.ctrlKey && event.key === 'z') {
        // Implement undo functionality
      }
      
      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (event.ctrlKey && (event.key === 'y' || (event.shiftKey && event.key === 'z'))) {
        // Implement redo functionality
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, onNodeDelete, readonly])

  const proOptions = { hideAttribution: true }

  return (
    <div className={`workflow-canvas ${className}`} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={setReactFlowInstance}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode="loose"
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
        proOptions={proOptions}
        deleteKeyCode={null} // We handle delete manually
      >
        <Controls 
          position="top-right"
          showZoom={!readonly}
          showFitView={true}
          showInteractive={!readonly}
        />
        <MiniMap
          position="bottom-right"
          nodeStrokeColor="#374151"
          nodeColor="#f3f4f6"
          nodeBorderRadius={8}
          maskColor="rgb(240, 240, 240, 0.6)"
          pannable
          zoomable
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#d1d5db"
        />
      </ReactFlow>
      
      {/* Overlay for readonly mode */}
      {readonly && (
        <div className="absolute inset-0 bg-transparent pointer-events-auto">
          <div className="absolute top-4 left-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium">
            Read-only mode
          </div>
        </div>
      )}
    </div>
  )
}

export function WorkflowCanvasProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactFlowProvider>
      {children}
    </ReactFlowProvider>
  )
}
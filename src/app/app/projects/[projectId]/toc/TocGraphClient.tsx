"use client";

import React, { useCallback } from "react";
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    applyNodeChanges,
    NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { updateNodePosition } from "./actions";

interface TocNode {
    id: string;
    title: string;
    node_type: string;
    pos_x: number;
    pos_y: number;
}

interface TocEdge {
    id: string;
    source_node_id: string;
    target_node_id: string;
}

interface TocGraphClientProps {
    projectId: string;
    versionId: string;
    initialNodes: TocNode[];
    initialEdges: TocEdge[];
    isEditable: boolean;
}

const nodeStyles: Record<string, React.CSSProperties> = {
    GOAL: { background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", width: 180 },
    OUTCOME: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", width: 180 },
    OUTPUT: { background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", width: 180 },
    ACTIVITY: { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", width: 180 },
};

export default function TocGraphClient({
    projectId,
    versionId,
    initialNodes,
    initialEdges,
    isEditable
}: TocGraphClientProps) {
    const [nodes, setNodes] = React.useState<Node[]>(
        initialNodes.map((n) => ({
            id: n.id,
            type: "default",
            data: { label: n.title },
            position: { x: n.pos_x || 0, y: n.pos_y || 0 },
            style: nodeStyles[n.node_type] || {},
            draggable: isEditable,
        }))
    );

    const edges = React.useMemo<Edge[]>(
        () => initialEdges.map((e) => ({
            id: e.id,
            source: e.source_node_id,
            target: e.target_node_id,
            animated: true,
            style: { stroke: "#4b5563" },
        })),
        [initialEdges]
    );

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onNodeDragStop = useCallback(
        async (_event: React.MouseEvent, node: Node) => {
            if (!isEditable) return;
            try {
                await updateNodePosition(projectId, versionId, node.id, node.position.x, node.position.y);
            } catch (error) {
                console.error("Failed to update position:", error);
            }
        },
        [projectId, versionId, isEditable]
    );

    return (
        <div className="w-full h-[600px] bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative mb-8">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onNodeDragStop={onNodeDragStop}
                nodesDraggable={isEditable}
                nodesConnectable={false}
                fitView
            >
                <Background color="#222" gap={20} />
                <Controls />
            </ReactFlow>
            {!isEditable && (
                <div className="absolute top-4 right-4 z-10 bg-amber-500/20 text-amber-500 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    Read Only (Published/Member)
                </div>
            )}
        </div>
    );
}

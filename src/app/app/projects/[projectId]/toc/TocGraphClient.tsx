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
import { updateNodePosition, addEdge, deleteEdge, deleteNode } from "./actions";
import { Connection, addEdge as addRfEdge } from "reactflow";

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
    toc_edge_assumptions?: { id: string }[];
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

    const [edges, setEdges] = React.useState<Edge[]>(
        initialEdges.map((e) => ({
            id: e.id,
            source: e.source_node_id,
            target: e.target_node_id,
            animated: true,
            label: e.toc_edge_assumptions && e.toc_edge_assumptions.length > 0
                ? `A:${e.toc_edge_assumptions.length}`
                : undefined,
            labelStyle: { fill: "#f59e0b", fontWeight: 700, fontSize: "10px" },
            labelBgPadding: [4, 2],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: "#1f2937", fillOpacity: 0.8 },
            style: { stroke: "#4b5563" },
            data: { "testid": "edge-label" }
        }))
    );

    // Sync state if initial props change (e.g. after refresh/navigation)
    React.useEffect(() => {
        setNodes(initialNodes.map((n) => ({
            id: n.id,
            type: "default",
            data: { label: n.title },
            position: { x: n.pos_x || 0, y: n.pos_y || 0 },
            style: nodeStyles[n.node_type] || {},
            draggable: isEditable,
        })));
    }, [initialNodes, isEditable]);

    React.useEffect(() => {
        setEdges(initialEdges.map((e) => ({
            id: e.id,
            source: e.source_node_id,
            target: e.target_node_id,
            animated: true,
            label: e.toc_edge_assumptions && e.toc_edge_assumptions.length > 0
                ? `A:${e.toc_edge_assumptions.length}`
                : undefined,
            labelStyle: { fill: "#f59e0b", fontWeight: 700, fontSize: "10px" },
            labelBgPadding: [4, 2],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: "#1f2937", fillOpacity: 0.8 },
            style: { stroke: "#4b5563" },
        })));
    }, [initialEdges]);

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

    const onConnect = useCallback(
        async (params: Connection) => {
            if (!isEditable || !params.source || !params.target) return;

            // Optimistic update
            const tempId = `temp-${Date.now()}`;
            const newEdge: Edge = {
                id: tempId,
                source: params.source,
                target: params.target,
                animated: true,
                style: { stroke: "#10b981" }, // Indicate it's new/saving
            };

            setEdges((eds) => addRfEdge(newEdge, eds));

            try {
                const result = await addEdge(projectId, versionId, params.source, params.target);
                // Replace temp id with real id
                setEdges((eds) =>
                    eds.map((e) =>
                        e.id === tempId
                            ? { ...e, id: result.id, style: { stroke: "#4b5563" } }
                            : e
                    )
                );
            } catch (error) {
                console.error("Failed to add edge:", error);
                setEdges((eds) => eds.filter((e) => e.id !== tempId));
            }
        },
        [projectId, versionId, isEditable]
    );

    const onEdgesDelete = useCallback(
        async (deletedEdges: Edge[]) => {
            if (!isEditable) return;
            try {
                for (const edge of deletedEdges) {
                    if (edge.id.startsWith("temp-")) continue;
                    await deleteEdge(projectId, versionId, edge.id);
                }
                setEdges((eds) => eds.filter((e) => !deletedEdges.find((de) => de.id === e.id)));
            } catch (error) {
                console.error("Failed to delete edge:", error);
            }
        },
        [projectId, versionId, isEditable]
    );

    const onNodesDelete = useCallback(
        async (deletedNodes: Node[]) => {
            if (!isEditable) return;
            try {
                for (const node of deletedNodes) {
                    await deleteNode(projectId, versionId, node.id);
                }
                setNodes((nds) => nds.filter((n) => !deletedNodes.find((dn) => dn.id === n.id)));
                // Server action handles edge cleanup in DB, RF handles it in UI via onEdgesDelete if triggered, 
                // but we filter locally for speed:
                setEdges((eds) => eds.filter((e) => !deletedNodes.find((dn) => dn.id === e.source || dn.id === e.target)));
            } catch (error) {
                console.error("Failed to delete node:", error);
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
                onConnect={onConnect}
                onEdgesDelete={onEdgesDelete}
                onNodesDelete={onNodesDelete}
                nodesDraggable={isEditable}
                nodesConnectable={isEditable}
                elementsSelectable={isEditable}
                deleteKeyCode={isEditable ? "Delete" : null}
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

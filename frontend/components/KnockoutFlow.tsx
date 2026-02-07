'use client';

import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Panel,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  Handle,
  Position,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const ZoomControls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="top-left" className="flex flex-col gap-2">
      <div className="flex bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <button 
          onClick={() => zoomIn()}
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors border-r border-white/5 font-bold text-lg"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={() => zoomOut()}
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors border-r border-white/5 font-bold text-lg"
          title="Zoom Out"
        >
          −
        </button>
        <button 
          onClick={() => fitView()}
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors font-bold text-[10px] uppercase tracking-tighter"
          title="Reset View"
        >
          Fit
        </button>
      </div>
    </Panel>
  );
};

const MatchNode = ({ data }: { data: any }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      className="px-4 py-3 shadow-2xl rounded-xl bg-slate-800 border-2 border-slate-700 min-w-[220px] transition-all duration-300 hover:border-blue-500/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
          <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">
            Match {data.match_id}
          </span>
          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">
            {data.venue}
          </span>
        </div>
        
        <div className="space-y-1.5 py-1">
          {/* Team 1 */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-semibold ${data.team1 === 'TBD' ? 'text-slate-500 italic' : (data.winner === data.team1 ? 'text-green-400' : 'text-slate-100')}`}>
                {data.team1}
              </span>
              {data.winner === data.team1 && <span className="text-green-400 text-xs">✓</span>}
            </div>
          </div>

          <div className="flex justify-center items-center text-slate-600 font-bold text-[9px] opacity-30">
            VS
          </div>

          {/* Team 2 */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-semibold ${data.team2 === 'TBD' ? 'text-slate-500 italic' : (data.winner === data.team2 ? 'text-green-400' : 'text-slate-100')}`}>
                {data.team2}
              </span>
              {data.winner === data.team2 && <span className="text-green-400 text-xs">✓</span>}
            </div>
          </div>

          {/* Winner Dropdown */}
          {data.team1 !== 'TBD' && data.team2 !== 'TBD' && isHovered && (
            <div className="pt-2 mt-1 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-1">
              <select 
                className="w-full bg-slate-900 text-green-400 text-[10px] font-bold py-1 px-2 rounded border border-green-500/30 focus:outline-none focus:border-green-500"
                onChange={(e) => data.onSetWinner?.(data.match_id, data.round, e.target.value)}
                value={data.winner || ''}
              >
                <option value="">Choose Winner</option>
                <option value={data.team1}>{data.team1}</option>
                <option value={data.team2}>{data.team2}</option>
              </select>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <div className="text-[9px] text-slate-400 flex items-center gap-1.5 font-medium">
            <span className="opacity-50">📅</span> {data.time_slot}
          </div>
        </div>
      </div>
      
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900" style={{ left: -6 }} />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900" style={{ right: -6 }} />
    </div>
  );
};

const nodeTypes = {
  match: MatchNode,
};

type Props = {
  bracket: any[];
};

export default function KnockoutFlow({ bracket: initialBracket }: Props) {
  const [bracketState, setBracketState] = React.useState(initialBracket);

  // Update winners and propagate
  const handleSetWinner = (matchId: number, roundNum: number, winnerName: string) => {
    const updatedBracket = JSON.parse(JSON.stringify(bracketState));
    const roundIndex = updatedBracket.findIndex((r: any) => r.round === roundNum);
    
    if (roundIndex === -1) return;

    const matchIndex = updatedBracket[roundIndex].matches.findIndex((m: any) => m.match_id === matchId);
    if (matchIndex === -1) return;

    // Set winner for current match
    updatedBracket[roundIndex].matches[matchIndex].winner = winnerName;

    // Propagate to next round if exists
    if (roundIndex < updatedBracket.length - 1) {
      const nextRound = updatedBracket[roundIndex + 1];
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const isTeam1 = matchIndex % 2 === 0;

      if (nextRound.matches[nextMatchIndex]) {
        if (isTeam1) {
          nextRound.matches[nextMatchIndex].team1 = winnerName;
        } else {
          nextRound.matches[nextMatchIndex].team2 = winnerName;
        }
      }
    }

    setBracketState(updatedBracket);
  };

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!bracketState || bracketState.length === 0) return { nodes, edges };

    const HORIZONTAL_SPACING = 350;
    const VERTICAL_SPACING_UNIT = 240;

    bracketState.forEach((round, roundIdx) => {
      const matchesInRound = round.matches.length;
      const totalRounds = bracketState.length;
      
      const totalHeight = (2 ** (totalRounds - 1)) * VERTICAL_SPACING_UNIT;
      const currentRoundSpacing = totalHeight / (matchesInRound + 1);

      round.matches.forEach((match: any, matchIdx: number) => {
        const nodeId = `r${round.round}-m${match.match_id}`;
        
        nodes.push({
          id: nodeId,
          type: 'match',
          position: { 
            x: roundIdx * HORIZONTAL_SPACING, 
            y: (matchIdx + 1) * currentRoundSpacing - 50 
          },
          data: { 
            ...match, 
            round: round.round,
            onSetWinner: handleSetWinner 
          },
        });

        if (roundIdx < totalRounds - 1) {
          const nextMatchIdx = Math.floor(matchIdx / 2);
          const targetId = `r${round.round + 1}-m${nextMatchIdx + 1}`;
          
          edges.push({
            id: `edge-${nodeId}-${targetId}`,
            source: nodeId,
            target: targetId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2, opacity: 0.6 },
          });
        }
      });
    });

    return { nodes, edges };
  }, [bracketState]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Sync with prop changes
  useEffect(() => {
    setBracketState(initialBracket);
  }, [initialBracket]);

  return (
    <div className="h-150 w-full bg-slate-900 shadow-inner relative overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-transparent"
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          zoomOnScroll={false}
          panOnScroll={false}
          zoomOnDoubleClick={false}
          preventScrolling={true}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <ZoomControls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

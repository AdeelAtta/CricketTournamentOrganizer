'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const MatchNode = ({ data }: { data: any }) => {
  const [isHovered, setIsHovered] = useState(false);

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
          <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
            {data.venue}
          </span>
        </div>
        
        <div className="space-y-2 py-1">
          {/* Team 1 Selection */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center group">
              <span className={`text-sm font-semibold transition-colors ${data.team1 === 'TBD' ? 'text-slate-500 italic' : (data.winner === data.team1 ? 'text-green-400' : 'text-slate-100')}`}>
                {data.team1}
              </span>
              {data.winner === data.team1 && <span className="text-green-400 text-xs">✓</span>}
            </div>
            
            {(data.team1 === 'TBD' || isHovered) && (
              <select 
                className="bg-slate-900 border border-slate-700 rounded-md text-[10px] px-1 py-0.5 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                onChange={(e) => data.onSelectTeam1(data.match_id, data.round, e.target.value)}
                value={data.team1 === 'TBD' ? '' : data.team1}
              >
                <option value="">Set Name</option>
                {data.availableTeams?.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-center items-center text-slate-600 font-black text-[9px] tracking-tighter opacity-30">
            VS
          </div>

          {/* Team 2 Selection */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center group">
              <span className={`text-sm font-semibold transition-colors ${data.team2 === 'TBD' ? 'text-slate-500 italic' : (data.winner === data.team2 ? 'text-green-400' : 'text-slate-100')}`}>
                {data.team2}
              </span>
              {data.winner === data.team2 && <span className="text-green-400 text-xs">✓</span>}
            </div>

            {(data.team2 === 'TBD' || isHovered) && (
              <select 
                className="bg-slate-900 border border-slate-700 rounded-md text-[10px] px-1 py-0.5 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                onChange={(e) => data.onSelectTeam2(data.match_id, data.round, e.target.value)}
                value={data.team2 === 'TBD' ? '' : data.team2}
              >
                <option value="">Set Name</option>
                {data.availableTeams?.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>

          {/* Winner Selection (If both names are set) */}
          {data.team1 !== 'TBD' && data.team2 !== 'TBD' && (
            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Winner:</span>
              <select 
                className="flex-1 bg-green-500/10 border border-green-500/30 rounded-md text-[10px] px-1 py-0.5 text-green-400 focus:outline-none cursor-pointer"
                onChange={(e) => data.onSetWinner(data.match_id, data.round, e.target.value)}
                value={data.winner || ''}
              >
                <option value="">Select Winner</option>
                <option value={data.team1}>{data.team1}</option>
                <option value={data.team2}>{data.team2}</option>
              </select>
            </div>
          )}
        </div>

        <div className="pt-2">
          <div className="text-[9px] text-slate-400 flex items-center gap-1.5 font-medium italic opacity-60 overflow-hidden text-ellipsis whitespace-nowrap">
            📅 {data.time_slot}
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
  availableTeams?: string[];
};

export default function KnockoutFlow({ bracket: initialBracket, availableTeams }: Props) {
  const [localBracket, setLocalBracket] = useState(initialBracket);

  useEffect(() => {
    setLocalBracket(initialBracket);
  }, [initialBracket]);

  const handleUpdateTeam1 = useCallback((matchId: number, roundNum: number, name: string) => {
    setLocalBracket(prev => prev.map(round => {
      if (round.round !== roundNum) return round;
      return {
        ...round,
        matches: round.matches.map((m: any) => 
          m.match_id === matchId ? { ...m, team1: name || 'TBD' } : m
        )
      };
    }));
  }, []);

  const handleUpdateTeam2 = useCallback((matchId: number, roundNum: number, name: string) => {
    setLocalBracket(prev => prev.map(round => {
      if (round.round !== roundNum) return round;
      return {
        ...round,
        matches: round.matches.map((m: any) => 
          m.match_id === matchId ? { ...m, team2: name || 'TBD' } : m
        )
      };
    }));
  }, []);

  const handleSetWinner = useCallback((matchId: number, roundNum: number, winnerName: string) => {
    setLocalBracket(prev => {
      const newBracket = prev.map(round => {
        if (round.round !== roundNum) return round;
        return {
          ...round,
          matches: round.matches.map((m: any) => 
            m.match_id === matchId ? { ...m, winner: winnerName } : m
          )
        };
      });

      // Propagate to next round if winner is set
      const nextRoundNum = roundNum + 1;
      const nextMatchIdx = Math.floor((matchId - 1) / 2);
      const isFirstParent = (matchId - 1) % 2 === 0;

      return newBracket.map(round => {
        if (round.round !== nextRoundNum) return round;
        return {
          ...round,
          matches: round.matches.map((m: any, idx: number) => {
            if (idx !== nextMatchIdx) return m;
            return isFirstParent 
              ? { ...m, team1: winnerName || 'TBD', match: `${winnerName || 'TBD'} vs ${m.team2}` } 
              : { ...m, team2: winnerName || 'TBD', match: `${m.team1} vs ${winnerName || 'TBD'}` };
          })
        };
      });
    });
  }, []);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!localBracket || localBracket.length === 0) return { nodes, edges };

    const HORIZONTAL_SPACING = 350;
    const VERTICAL_SPACING_UNIT = 240;

    localBracket.forEach((round, roundIdx) => {
      const matchesInRound = round.matches.length;
      const totalRounds = localBracket.length;
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
            availableTeams,
            onSelectTeam1: handleUpdateTeam1,
            onSelectTeam2: handleUpdateTeam2,
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
            style: { stroke: (match.winner ? '#4ade80' : '#3b82f6'), strokeWidth: 2, opacity: 0.6 },
          });
        }
      });
    });

    return { nodes, edges };
  }, [localBracket, availableTeams, handleUpdateTeam1, handleUpdateTeam2, handleSetWinner]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="h-[90vh] w-full bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner relative overflow-hidden">
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
      />
      <Panel position="top-left" className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-2 rounded-lg text-[10px] text-slate-400 uppercase tracking-tighter">
        Interactive Bracket • Assign Winners to Auto-Propagate
      </Panel>
    </div>
  );
}

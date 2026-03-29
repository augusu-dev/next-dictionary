'use client';

import { useCallback } from 'react';
import { NodeEditor } from './node-editor';
import type { Node } from '@/types';

interface DictionaryViewProps {
  nodes: Node[];
  onNodeUpdate: (id: string, updates: Partial<Node>) => Promise<void>;
}

export function DictionaryView({ nodes, onNodeUpdate }: DictionaryViewProps) {
  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Node>) => {
      const res = await fetch(`/api/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '更新に失敗しました');
      }
    },
    []
  );

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <NodeEditor key={node.id} node={node} onUpdate={handleUpdate} />
      ))}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Check, X, Pencil } from 'lucide-react';
import type { Node } from '@/types';
import { toast } from 'sonner';

interface NodeEditorProps {
  node: Node;
  onUpdate: (id: string, updates: Partial<Node>) => Promise<void>;
}

export function NodeEditor({ node, onUpdate }: NodeEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<'title' | 'summary' | 'content' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = useCallback((field: 'title' | 'summary' | 'content') => {
    setEditValue(node[field] || '');
    setEditing(field);
  }, [node]);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setEditValue('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await onUpdate(node.id, { [editing]: editValue });
      setEditing(null);
      setEditValue('');
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }, [editing, editValue, node.id, onUpdate]);

  return (
    <div className="border rounded-lg">
      <button
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <span className="font-medium flex-1">{node.title}</span>
        {node.summary && !expanded && (
          <span className="text-sm text-muted-foreground line-clamp-1 mr-2">
            {node.summary}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Summary */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">概要</span>
              {editing !== 'summary' && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit('summary')}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            {editing === 'summary' ? (
              <div className="space-y-2">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={saveEdit} disabled={saving}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{node.summary || '（未設定）'}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">詳細</span>
              {editing !== 'content' && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit('content')}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            {editing === 'content' ? (
              <div className="space-y-2">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={6}
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={saveEdit} disabled={saving}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{node.content || '（未設定）'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

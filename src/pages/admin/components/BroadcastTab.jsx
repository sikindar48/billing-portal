import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Users, Megaphone, Loader2, Info, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BroadcastTab = ({ allUsers }) => {
  const [target, setTarget]           = useState('all');
  const [subject, setSubject]         = useState('');
  const [message, setMessage]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const proCount  = allUsers.filter(u => u.out_subscription_status === 'active').length;
  const freeCount = allUsers.length - proCount;

  const TARGETS = [
    { value: 'all',  label: `All users`,        count: allUsers.length },
    { value: 'pro',  label: `Active Pro users`,  count: proCount },
    { value: 'free', label: `Free tier users`,   count: freeCount },
  ];

  const filteredCount = TARGETS.find(t => t.value === target)?.count ?? 0;

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required.');
      return;
    }
    if (!confirm(`Send to ${filteredCount} users?`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: { type: 'broadcast', target, subject, message }
      });
      if (error) throw error;
      toast.success(`Broadcast sent to ${filteredCount} users!`);
      setSubject('');
      setMessage('');
      setShowPreview(false);
    } catch (err) {
      toast.error('Broadcast failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* ── Composer ── */}
      <div className="lg:col-span-2">
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="border-b py-4 px-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Megaphone className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-gray-900">Campaign Composer</CardTitle>
                <p className="text-[11px] text-gray-400 mt-0.5">Send a mass email to your users via Resend</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 px-5 pb-5 space-y-4">

            {/* Target */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Recipient Group</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <select
                  className="w-full appearance-none pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 cursor-pointer"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                >
                  {TARGETS.map(t => (
                    <option key={t.value} value={t.value}>{t.label} ({t.count})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Subject</label>
              <Input
                placeholder="e.g. 🚀 New Feature: Multi-Currency Invoices now live!"
                className="h-10 bg-gray-50 border-gray-200 text-sm"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Message</label>
              <Textarea
                placeholder="Hello {{name}}, we're excited to announce…"
                className="min-h-[180px] bg-gray-50 border-gray-200 resize-none text-sm"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <p className="text-[11px] text-gray-400">Use <code className="bg-gray-100 px-1 rounded text-[10px]">{"{{name}}"}</code> to personalize with the user's name.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSend}
                disabled={loading || filteredCount === 0}
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 font-semibold text-sm"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                  : <><Send className="h-4 w-4 mr-2" /> Send to {filteredCount} users</>}
              </Button>
              <Button
                variant="outline"
                className="h-10 px-4 border-gray-200 text-sm"
                onClick={() => setShowPreview(v => !v)}
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                {showPreview ? 'Hide' : 'Preview'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Sidebar ── */}
      <div className="space-y-4">
        {/* Rules */}
        <Card className="border border-indigo-100 bg-indigo-50/50 shadow-none">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Broadcasting Rules</span>
            </div>
            <ul className="space-y-1.5 text-[12px] text-indigo-700">
              <li>· Sent via your Resend configuration</li>
              <li>· <code className="bg-indigo-100 px-1 rounded text-[11px]">{"{{name}}"}</code> replaced with user's full name</li>
              <li>· Each user receives an individual email</li>
              <li>· Large batches may take a few minutes</li>
            </ul>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-600 px-4 py-2.5">
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Email Preview</span>
            </div>
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Subject</div>
              <p className="text-sm font-semibold text-gray-800">{subject || <span className="text-gray-300 font-normal italic">No subject</span>}</p>
              <div className="border-t border-gray-100 pt-3">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">Body</div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {message.replace(/\{\{name\}\}/g, 'John Doe') || <span className="text-gray-300 italic">Type a message to preview…</span>}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BroadcastTab;

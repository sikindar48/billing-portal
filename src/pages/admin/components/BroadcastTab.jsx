import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Users, Megaphone, Loader2, Info, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BroadcastTab = ({ allUsers }) => {
  const [target, setTarget] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const filteredCount = allUsers.filter(u => {
    if (target === 'all') return true;
    if (target === 'pro') return u.out_subscription_status === 'active';
    if (target === 'free') return u.out_subscription_status !== 'active';
    return true;
  }).length;

  const handleSendBroadcast = async () => {
    if (!subject || !message) {
      toast.error('Please provide both a subject and a message.');
      return;
    }

    if (!confirm(`Are you sure you want to send this email to ${filteredCount} users?`)) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'broadcast',
          target,
          subject,
          message,
        }
      });

      if (error) throw error;
      
      toast.success(`Broadcast sent successfully to ${filteredCount} users!`);
      setSubject('');
      setMessage('');
      setShowPreview(false);
    } catch (err) {
      console.error('Broadcast error:', err);
      toast.error('Failed to send broadcast: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Column */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-600" />
              Campaign Composer
            </CardTitle>
            <CardDescription>Send a mass email to your users via Resend</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Recipient Group</label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Select target" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users ({allUsers.length})</SelectItem>
                  <SelectItem value="pro">Active Pro Users ({allUsers.filter(u => u.out_subscription_status === 'active').length})</SelectItem>
                  <SelectItem value="free">Free Tier Users ({allUsers.filter(u => u.out_subscription_status !== 'active').length})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Email Subject</label>
              <Input 
                placeholder="e.g. 🚀 New Feature: Multi-Currency Invoices now live!" 
                className="h-11 bg-gray-50 border-gray-200"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Message Content (Markdown supported)</label>
              <Textarea 
                placeholder="Hello {{name}}, we are excited to announce..." 
                className="min-h-[200px] bg-gray-50 border-gray-200 resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-[10px] text-gray-400 font-medium italic">
                Use {"{{name}}"} to personalize the message with the user's name.
              </p>
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                onClick={handleSendBroadcast} 
                disabled={loading || filteredCount === 0}
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {filteredCount} Users
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="h-11 border-gray-200"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info & Preview Column */}
      <div className="space-y-6">
        <Card className="bg-indigo-50 border-none shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Broadcasting Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-indigo-700 space-y-2 font-medium">
              <li>• Emails are sent via your Resend configuration.</li>
              <li>• Personalization: {"{{name}}"} is replaced by user's full name.</li>
              <li>• Delivery: Each user receives an individual email.</li>
              <li>• Rate Limit: Large batches might take a few minutes to complete.</li>
            </ul>
          </CardContent>
        </Card>

        {showPreview && (
          <Card className="border-2 border-indigo-100 shadow-xl animate-in slide-in-from-right duration-300">
            <CardHeader className="bg-indigo-600 text-white py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest">Live Email Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 prose prose-sm max-w-none">
              <div className="text-sm font-bold border-b pb-2 mb-4">
                Subject: <span className="text-indigo-600">{subject || '(No Subject)'}</span>
              </div>
              <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">
                {message.replace(/\{\{name\}\}/g, 'John Doe') || '(Type a message to see preview)'}
              </div>
              <div className="mt-8 pt-4 border-t text-[10px] text-gray-400 text-center uppercase tracking-tighter font-bold">
                Sent from InvoicePort Command Center
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BroadcastTab;

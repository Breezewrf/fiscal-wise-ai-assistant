
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Mic, Send, User, Bot, Volume2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchTransactions } from '@/lib/db/transactions';
import { useQuery } from '@tanstack/react-query';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI financial assistant. I can analyze your transactions and provide personalized financial insights. How can I help you today?",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdatingKnowledge, setIsUpdatingKnowledge] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch transactions data using react-query
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transactions-for-assistant'],
    queryFn: fetchTransactions,
  });
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Call the Supabase edge function with the user message and transaction data
      const { data, error } = await supabase.functions.invoke('finance-assistant', {
        body: {
          message: input,
          transactions: transactions || []
        }
      });

      if (error) {
        console.error('Error calling finance assistant:', error);
        toast.error('Failed to get a response. Please try again.');
        throw error;
      }

      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.response || "I'm sorry, I couldn't process your request at the moment.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Something went wrong. Please try again.');
      
      // Add error message from assistant
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateKnowledgeBase = async () => {
    setIsUpdatingKnowledge(true);
    try {
      await refetch();
      toast.success("Knowledge base updated with latest transaction data!");
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      toast.error('Failed to update knowledge base. Please try again.');
    } finally {
      setIsUpdatingKnowledge(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      toast("Voice recording stopped");
      
      // Simulate voice transcription
      setTimeout(() => {
        setInput("How much did I spend on dining last month?");
      }, 1000);
    } else {
      // Start recording
      setIsRecording(true);
      toast("Voice recording started. Speak now...");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSpeakMessage = (message: string) => {
    toast("Text-to-speech activated");
    // In a real app, this would use the Web Speech API or a TTS service
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Financial Assistant</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleUpdateKnowledgeBase}
          disabled={isUpdatingKnowledge || isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isUpdatingKnowledge && "animate-spin")} />
          Update Knowledge Base
        </Button>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={cn(
                    "flex gap-3 max-w-[80%]",
                    message.sender === 'user' ? "ml-auto" : ""
                  )}
                >
                  {message.sender === 'assistant' && (
                    <Avatar className="h-8 w-8 bg-primary">
                      <Bot className="h-4 w-4 text-white" />
                    </Avatar>
                  )}
                  
                  <div className="space-y-1">
                    <div 
                      className={cn(
                        "rounded-lg p-3",
                        message.sender === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}
                    >
                      <p>{message.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                      
                      {message.sender === 'assistant' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => handleSpeakMessage(message.content)}
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8 bg-accent">
                      <User className="h-4 w-4 text-accent-foreground" />
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-primary">
                    <Bot className="h-4 w-4 text-white" />
                  </Avatar>
                  <div className="rounded-lg p-3 bg-muted w-16">
                    <div className="flex space-x-1 items-center justify-center">
                      <div className="w-2 h-2 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button 
                variant={isRecording ? "destructive" : "outline"} 
                size="icon"
                onClick={handleToggleRecording}
              >
                <Mic className="h-5 w-5" />
              </Button>
              
              <Input
                placeholder="Ask me anything about your finances..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              
              <Button 
                onClick={handleSendMessage} 
                disabled={!input.trim() || isProcessing}
              >
                <Send className="h-5 w-5 mr-2" />
                Send
              </Button>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Suggested: "What categories am I spending the most on?" • "How does my spending compare to last month?" • "Do I have any unusual transactions recently?"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

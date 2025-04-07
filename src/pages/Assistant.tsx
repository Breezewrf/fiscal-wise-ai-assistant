
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Mic, Send, User, Bot, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
      content: "Hello! I'm your AI financial assistant. How can I help you today? You can ask me about your spending, budget, or financial insights.",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
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
    
    // Simulate AI response after delay
    setTimeout(() => {
      const mockResponses = [
        "Based on your recent transactions, you've spent $324 on dining this month, which is 20% more than last month. Would you like to set a budget for this category?",
        "I see you've been spending consistently on subscription services. You might save $45 per month by canceling unused subscriptions. Would you like me to list them for you?",
        "Your savings rate this month is 18%, which is excellent! You're on track to meet your annual savings goal by November.",
        "Looking at your spending patterns, Tuesday seems to be your highest spending day, mostly on food delivery. Consider meal prepping to reduce these costs.",
        "I notice you haven't categorized some recent transactions. Would you like me to help categorize them using AI?"
      ];
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 1500);
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
      <h1 className="text-3xl font-bold tracking-tight mb-6">AI Assistant</h1>
      
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
              
              <Button onClick={handleSendMessage} disabled={!input.trim()}>
                <Send className="h-5 w-5 mr-2" />
                Send
              </Button>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Suggested: "How much did I spend on food this month?" • "Am I on track with my savings goal?" • "Show me my spending trends"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

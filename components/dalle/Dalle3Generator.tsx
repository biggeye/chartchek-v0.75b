// components/dalle/Dalle3Generator.tsx
"use client";

import { useState } from "react";
import { Dalle3Params, Dalle3Response } from "@/types/dalle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TextArea from "@/components/ui/text-area"; // Note: default export
import * as Headless from '@headlessui/react';
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export default function Dalle3Generator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Dalle3Response | null>(null);
  const [params, setParams] = useState<Dalle3Params>({
    prompt: "",
    model: "dall-e-3",
    n: 1,
    quality: "standard",
    response_format: "url",
    size: "1024x1024",
    style: "vivid",
  });

  const handleChange = (name: keyof Dalle3Params, value: any) => {
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/openai/dalle3/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to generate image"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">DALL-E 3 Image Generator</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Generate images using DALL-E 3 AI model</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <TextArea 
              value={params.prompt} 
              onChange={(e) => handleChange("prompt", e.target.value)}
              placeholder="Describe the image you want to generate"
              required
              rows={4}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Size</label>
              <Headless.Listbox value={params.size} onChange={(value) => handleChange("size", value)}>
                <div className="relative mt-1">
                  <Headless.Listbox.Button className="relative w-full cursor-default rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <span className="block truncate">{params.size}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Headless.Listbox.Button>
                  <Headless.Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Headless.Listbox.Option value="1024x1024" className={({ active }) => `${active ? 'bg-primary/10 text-primary' : 'text-foreground'} cursor-default select-none relative py-2 pl-10 pr-4`}>
                      {({ selected }) => (
                        <>
                          <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                            1024x1024 (Square)
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Headless.Listbox.Option>
                    <Headless.Listbox.Option value="1792x1024" className={({ active }) => `${active ? 'bg-primary/10 text-primary' : 'text-foreground'} cursor-default select-none relative py-2 pl-10 pr-4`}>
                      {({ selected }) => (
                        <>
                          <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                            1792x1024 (Landscape)
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Headless.Listbox.Option>
                    <Headless.Listbox.Option value="1024x1792" className={({ active }) => `${active ? 'bg-primary/10 text-primary' : 'text-foreground'} cursor-default select-none relative py-2 pl-10 pr-4`}>
                      {({ selected }) => (
                        <>
                          <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                            1024x1792 (Portrait)
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Headless.Listbox.Option>
                  </Headless.Listbox.Options>
                </div>
              </Headless.Listbox>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quality</label>
              <Headless.Listbox value={params.quality} onChange={(value) => handleChange("quality", value)}>
                <div className="relative mt-1">
                  <Headless.Listbox.Button className="relative w-full cursor-default rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <span className="block truncate">{params.quality}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Headless.Listbox.Button>
                  <Headless.Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Headless.Listbox.Option value="standard" className={({ active }) => `${active ? 'bg-primary/10 text-primary' : 'text-foreground'} cursor-default select-none relative py-2 pl-10 pr-4`}>
                      {({ selected }) => (
                        <>
                          <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                            Standard
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Headless.Listbox.Option>
                    <Headless.Listbox.Option value="hd" className={({ active }) => `${active ? 'bg-primary/10 text-primary' : 'text-foreground'} cursor-default select-none relative py-2 pl-10 pr-4`}>
                      {({ selected }) => (
                        <>
                          <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                            HD
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Headless.Listbox.Option>
                  </Headless.Listbox.Options>
                </div>
              </Headless.Listbox>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <Headless.Listbox value={params.style} onChange={(value) => handleChange("style", value)}>
                <div className="relative mt-1">
                  <Headless.Listbox.Button className="relative w-full cursor-default rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <span className="block truncate">{params.style}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Headless.Listbox.Button>
                  <Headless.Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Headless.Listbox.Option value="vivid" className={({ active }) => `${active ? 'bg-primary/10 text-primary' : 'text-foreground'} cursor-default select-none relative py-2 pl-10 pr-4`}>
                      {({ selected }) => (
                        <>
                          <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                            Vivid
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Headless.Listbox.Option>
                    <Headless.Listbox.Option value="natural" className={({ active }) => `${active ? 'bg-primary/10 text-primary' : 'text-foreground'} cursor-default select-none relative py-2 pl-10 pr-4`}>
                      {({ selected }) => (
                        <>
                          <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                            Natural
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Headless.Listbox.Option>
                  </Headless.Listbox.Options>
                </div>
              </Headless.Listbox>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">User Identifier (optional)</label>
              <Input 
                value={params.user || ""} 
                onChange={(e) => handleChange("user", e.target.value)}
                placeholder="User ID"
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={isLoading || !params.prompt}
            >
              {isLoading ? "Generating..." : "Generate Image"}
            </Button>
          </div>
        </form>
      </CardContent>
      
      {result && (
        <CardContent className="border-t">
          {result.success ? (
            <div className="text-center">
              <img 
                src={result.data?.imageUrl} 
                alt="Generated image" 
                className="max-w-full rounded-lg mx-auto mb-2" 
              />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Image ID: {result.data?.openaiFileId}</p>
            </div>
          ) : (
            <div className="text-red-500">
              <p>Error: {result.error}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
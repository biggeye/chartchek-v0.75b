# chartChek: AI-Powered Compliance Assistant for Behavioral Health Facilities
### **v0.75b**

Welcome to **chartChek**, an advanced compliance assistant designed to streamline regulatory compliance for mental health and substance-abuse recovery centers. Built with NextJS 15 and OpenAI's Assistants API, chartChek provides instant, accurate, and actionable insights tailored to each facility's unique requirements.

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Authentication**: Supabase Auth
- **Database**: Supabase Postgresql 
- **State Management**: Zustand
- **AI**: OpenAI Assistants API / DeepSeek API
- **Deployment**: Vercel

## Purpose

The primary goal of this project is to serve as a **Joint Commission/DHCS compliance assistant**, equipping behavioral health facilities with an intelligent chatbot to assist in navigating regulatory standards, tracking compliance, and managing documentation. Each instance of chartChek can be customized with facility-specific information.

## Key Features

### **AI-Powered Assistance**
- Leverages OpenAI's Assistants API for intelligent, context-aware responses
- Maintains conversation history through Assistant threads
- Supports file attachments and citations in responses

### **Document Management**
- Processes and stores facility documents securely
- Enables document search and citation in conversations
- Supports multiple file formats including PDFs

### **Regulatory Knowledge Base**
- Pre-loaded with Joint Commission and DHCS standards
- Context-aware responses using vector similarity search
- File citations to track information sources

### **Multi-User Support**
- Secure authentication and authorization
- Facility-specific customization
- Isolated data storage per facility

### **Real-time Updates**
- Message streaming & tool status
- Progress tracking for document processing
- Instant response notifications

## Architecture Overview

### OpenAI Assistants Integration
- Utilizes Assistants API for maintaining conversation context
- Implements thread management for persistent conversations
- Supports file attachments and tool calls



(FUTURE) TODO:
### State Management (Zustand)

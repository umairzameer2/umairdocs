'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  FileText,
  Plus,
  MoreHorizontal,
  Star,
  Trash2,
  Edit3,
  Clock,
  LogOut,
  Settings,
  User,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List,
  Mail,
  Check,
  X,
  UserPlus,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { AppSidebar } from '@/components/home/app-sidebar'
import { AIChatbot } from '@/components/chat/ai-chatbot'

import { InvitationDialog } from '@/components/invitation/invitation-dialog'

// Structured document thumbnails — each reflects actual document content with sections, lists, tables
const allTemplates = [
  {
    id: 'blank',
    name: 'Blank Document',
    icon: '📄',
    color: 'bg-card border-2 border-border hover:border-purple-300',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 opacity-30">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-[8px] text-muted-foreground font-medium tracking-wide">BLANK</span>
          </div>
        </div>
        <div className="h-px bg-muted mx-4" />
        <div className="px-4 py-1.5 flex justify-between">
          <div className="w-6 h-0.5 bg-muted rounded" />
          <div className="w-4 h-0.5 bg-muted rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'software-proposal',
    name: 'Software Proposal',
    icon: '💻',
    color: 'bg-card border-2 border-teal-200 hover:border-teal-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Document header - title & subtitle */}
        <div className="px-2.5 pt-2 pb-1 flex flex-col items-center gap-0.5">
          <div className="w-[72%] h-1.5 bg-teal-700 rounded" />
          <div className="w-12 h-0.5 bg-teal-300 rounded" />
        </div>
        <div className="h-px bg-teal-100 mx-2.5" />
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5 overflow-hidden">
          {/* 1. Summary */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-teal-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">1</div>
            <div className="w-8 h-1 bg-teal-600 rounded" />
          </div>
          <div className="w-[90%] h-0.5 bg-teal-200 rounded ml-3" />
          {/* 2. Scope */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-teal-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">2</div>
            <div className="w-7 h-1 bg-teal-600 rounded" />
          </div>
          <div className="ml-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-teal-400" /><div className="w-14 h-0.5 bg-teal-200 rounded" /></div>
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-teal-400" /><div className="w-12 h-0.5 bg-teal-200 rounded" /></div>
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-teal-400" /><div className="w-11 h-0.5 bg-teal-200 rounded" /></div>
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-teal-400" /><div className="w-13 h-0.5 bg-teal-200 rounded" /></div>
          </div>
          {/* 3. Timeline - Table */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-teal-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">3</div>
            <div className="w-9 h-1 bg-teal-600 rounded" />
          </div>
          <div className="bg-teal-50 rounded p-1 ml-3">
            <div className="flex gap-0.5 mb-0.5">
              <div className="flex-1 h-1 bg-teal-300 rounded" />
              <div className="flex-1 h-1 bg-teal-300 rounded" />
              <div className="flex-[1.5] h-1 bg-teal-300 rounded" />
            </div>
            <div className="flex gap-0.5 mb-0.5">
              <div className="flex-1 h-0.5 bg-teal-100 rounded" />
              <div className="flex-1 h-0.5 bg-teal-100 rounded" />
              <div className="flex-[1.5] h-0.5 bg-teal-100 rounded" />
            </div>
            <div className="flex gap-0.5">
              <div className="flex-1 h-0.5 bg-teal-100 rounded" />
              <div className="flex-1 h-0.5 bg-teal-100 rounded" />
              <div className="flex-[1.5] h-0.5 bg-teal-100 rounded" />
            </div>
          </div>
          {/* 4. Budget */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-teal-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">4</div>
            <div className="w-7 h-1 bg-teal-600 rounded" />
          </div>
          <div className="w-[75%] h-0.5 bg-teal-200 rounded ml-3" />
          {/* 5. Approval */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-teal-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">5</div>
            <div className="w-9 h-1 bg-teal-600 rounded" />
          </div>
          <div className="flex gap-2 ml-3">
            <div className="w-14 h-0.5 border-b border-dashed border-teal-400" />
            <div className="w-8 h-0.5 border-b border-dashed border-teal-400" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    icon: '📋',
    color: 'bg-card border-2 border-amber-200 hover:border-amber-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Header with title & meta */}
        <div className="px-2.5 pt-2 pb-1 flex flex-col items-center gap-0.5">
          <div className="w-[70%] h-1.5 bg-amber-700 rounded" />
          <div className="flex gap-1 mt-0.5">
            <div className="w-8 h-0.5 bg-amber-300 rounded" />
            <div className="w-6 h-0.5 bg-amber-200 rounded" />
          </div>
        </div>
        <div className="h-px bg-amber-100 mx-2.5" />
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5 overflow-hidden">
          {/* 1. Introduction */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">1</div>
            <div className="w-12 h-1 bg-amber-600 rounded" />
          </div>
          <div className="w-[85%] h-0.5 bg-amber-200 rounded ml-3" />
          {/* 2. Objectives */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">2</div>
            <div className="w-10 h-1 bg-amber-600 rounded" />
          </div>
          <div className="ml-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-amber-400" /><div className="w-[80%] h-0.5 bg-amber-200 rounded" /></div>
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-amber-400" /><div className="w-[70%] h-0.5 bg-amber-200 rounded" /></div>
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-amber-400" /><div className="w-[75%] h-0.5 bg-amber-200 rounded" /></div>
          </div>
          {/* 3. Proposed Solution */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">3</div>
            <div className="w-[60%] h-1 bg-amber-600 rounded" />
          </div>
          <div className="w-[90%] h-0.5 bg-amber-200 rounded ml-3" />
          {/* 4. Timeline & Deliverables - Table */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">4</div>
            <div className="w-[65%] h-1 bg-amber-600 rounded" />
          </div>
          <div className="bg-amber-50 rounded p-1 ml-3">
            <div className="flex gap-0.5 mb-0.5">
              <div className="flex-1 h-1 bg-amber-300 rounded" />
              <div className="flex-1 h-1 bg-amber-300 rounded" />
              <div className="flex-[1.5] h-1 bg-amber-300 rounded" />
            </div>
            <div className="flex gap-0.5 mb-0.5">
              <div className="flex-1 h-0.5 bg-amber-100 rounded" />
              <div className="flex-1 h-0.5 bg-amber-100 rounded" />
              <div className="flex-[1.5] h-0.5 bg-amber-100 rounded" />
            </div>
            <div className="flex gap-0.5 mb-0.5">
              <div className="flex-1 h-0.5 bg-amber-100 rounded" />
              <div className="flex-1 h-0.5 bg-amber-100 rounded" />
              <div className="flex-[1.5] h-0.5 bg-amber-100 rounded" />
            </div>
            <div className="flex gap-0.5">
              <div className="flex-1 h-0.5 bg-amber-100 rounded" />
              <div className="flex-1 h-0.5 bg-amber-100 rounded" />
              <div className="flex-[1.5] h-0.5 bg-amber-100 rounded" />
            </div>
          </div>
          {/* 5. Budget */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">5</div>
            <div className="w-8 h-1 bg-amber-600 rounded" />
          </div>
          <div className="w-[70%] h-0.5 bg-amber-200 rounded ml-3" />
          {/* 6. Conclusion */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-600 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">6</div>
            <div className="w-10 h-1 bg-amber-600 rounded" />
          </div>
          <div className="ml-3 flex flex-col gap-0.5">
            <div className="w-[80%] h-0.5 bg-amber-200 rounded" />
            <div className="w-10 h-0.5 bg-amber-300 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'business-letter',
    name: 'Business Letter',
    icon: '✉️',
    color: 'bg-card border-2 border-border hover:border-purple-300',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Company letterhead */}
        <div className="px-2.5 pt-2 pb-1 flex items-center gap-1.5">
          <div className="w-4 h-4 bg-slate-700 rounded-sm" />
          <div className="w-12 h-1.5 bg-slate-700 rounded" />
        </div>
        <div className="h-0.5 bg-muted mx-2.5" />
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5">
          {/* Date */}
          <div className="w-10 h-0.5 bg-muted rounded self-end" />
          {/* Recipient address block */}
          <div className="w-14 h-0.5 bg-muted rounded mt-1" />
          <div className="w-12 h-0.5 bg-muted rounded" />
          <div className="w-10 h-0.5 bg-muted rounded" />
          {/* Salutation */}
          <div className="w-10 h-0.5 bg-slate-400 rounded mt-1" />
          {/* Body paragraphs */}
          <div className="w-full h-0.5 bg-muted rounded mt-1" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-3/4 h-0.5 bg-muted rounded" />
          <div className="w-full h-0.5 bg-muted rounded mt-0.5" />
          <div className="w-2/3 h-0.5 bg-muted rounded" />
          {/* Closing */}
          <div className="w-8 h-0.5 bg-slate-300 rounded mt-1" />
          <div className="w-6 h-0.5 bg-muted rounded" />
        </div>
        {/* Signature */}
        <div className="px-2.5 pb-1.5">
          <div className="w-14 border-b border-slate-300" />
          <div className="w-10 h-0.5 bg-muted rounded mt-0.5" />
          <div className="w-8 h-0.5 bg-muted rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'resume',
    name: 'Resume',
    icon: '👤',
    color: 'bg-card border-2 border-purple-200 hover:border-purple-400',
    preview: (
      <div className="w-full h-full bg-white flex">
        {/* Sidebar - Contact & Skills */}
        <div className="w-[35%] bg-gradient-to-b from-purple-600 to-purple-700 p-1.5 flex flex-col gap-1">
          {/* Avatar */}
          <div className="w-5 h-5 rounded-full bg-white/30 mx-auto" />
          <div className="w-8 h-0.5 bg-white/40 rounded mx-auto" />
          {/* Contact */}
          <div className="h-px bg-white/20 my-0.5" />
          <div className="w-6 h-0.5 bg-white/50 rounded" />
          <div className="w-full h-0.5 bg-white/20 rounded" />
          <div className="w-3/4 h-0.5 bg-white/20 rounded" />
          <div className="w-full h-0.5 bg-white/20 rounded" />
          {/* Skills */}
          <div className="h-px bg-white/20 my-0.5" />
          <div className="w-5 h-0.5 bg-white/50 rounded" />
          <div className="flex gap-0.5 flex-wrap">
            <div className="w-3 h-1 bg-white/25 rounded" />
            <div className="w-4 h-1 bg-white/25 rounded" />
            <div className="w-3 h-1 bg-white/25 rounded" />
          </div>
          <div className="flex gap-0.5 flex-wrap">
            <div className="w-4 h-1 bg-white/25 rounded" />
            <div className="w-2 h-1 bg-white/25 rounded" />
          </div>
        </div>
        {/* Main content */}
        <div className="flex-1 p-1.5 flex flex-col gap-0.5">
          {/* Name */}
          <div className="w-12 h-1.5 bg-purple-700 rounded" />
          <div className="w-8 h-0.5 bg-purple-300 rounded" />
          {/* Professional Summary */}
          <div className="h-px bg-purple-100 my-0.5" />
          <div className="w-10 h-0.5 bg-purple-500 rounded" />
          <div className="w-full h-0.5 bg-purple-100 rounded" />
          <div className="w-3/4 h-0.5 bg-purple-100 rounded" />
          {/* Experience */}
          <div className="h-px bg-purple-100 my-0.5" />
          <div className="w-10 h-0.5 bg-purple-500 rounded" />
          <div className="w-8 h-0.5 bg-purple-300 rounded" />
          <div className="flex items-center gap-0.5 ml-1">
            <div className="w-1 h-1 rounded-full bg-purple-300" />
            <div className="w-10 h-0.5 bg-purple-100 rounded" />
          </div>
          <div className="flex items-center gap-0.5 ml-1">
            <div className="w-1 h-1 rounded-full bg-purple-300" />
            <div className="w-8 h-0.5 bg-purple-100 rounded" />
          </div>
          {/* Education */}
          <div className="h-px bg-purple-100 my-0.5" />
          <div className="w-8 h-0.5 bg-purple-500 rounded" />
          <div className="w-10 h-0.5 bg-purple-200 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    icon: '📝',
    color: 'bg-card border-2 border-rose-200 hover:border-rose-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Header accent bar */}
        <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-400" />
        {/* Sender info */}
        <div className="px-2.5 pt-1.5 pb-1">
          <div className="w-12 h-1 bg-rose-700 rounded" />
          <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="w-10 h-0.5 bg-rose-200 rounded" />
            <div className="w-8 h-0.5 bg-rose-100 rounded" />
            <div className="w-6 h-0.5 bg-rose-100 rounded" />
          </div>
        </div>
        <div className="flex-1 px-2.5 py-1 flex flex-col gap-0.5">
          {/* Date */}
          <div className="w-8 h-0.5 bg-muted rounded self-end" />
          {/* Employer info */}
          <div className="w-12 h-0.5 bg-muted rounded mt-0.5" />
          <div className="w-10 h-0.5 bg-muted rounded" />
          {/* Salutation */}
          <div className="w-12 h-0.5 bg-rose-300 rounded mt-0.5" />
          {/* Body paragraphs */}
          <div className="w-full h-0.5 bg-muted rounded mt-0.5" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-3/4 h-0.5 bg-muted rounded" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-2/3 h-0.5 bg-muted rounded" />
          {/* Closing */}
          <div className="w-10 h-0.5 bg-rose-300 rounded mt-0.5" />
        </div>
        {/* Signature */}
        <div className="px-2.5 pb-1.5">
          <div className="w-14 border-b border-rose-300" />
          <div className="w-10 h-0.5 bg-rose-200 rounded mt-0.5" />
          <div className="w-8 h-0.5 bg-muted rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'letter',
    name: 'Letter',
    icon: '✉️',
    color: 'bg-card border-2 border-rose-200 hover:border-rose-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Decorative top border */}
        <div className="h-0.5 bg-gradient-to-r from-rose-300 via-pink-200 to-rose-300" />
        {/* Sender info */}
        <div className="px-2.5 pt-2">
          <div className="w-12 h-0.5 bg-rose-400 rounded" />
          <div className="w-10 h-0.5 bg-rose-200 rounded mt-0.5" />
          <div className="w-8 h-0.5 bg-rose-100 rounded" />
        </div>
        <div className="flex-1 px-2.5 py-1 flex flex-col gap-0.5">
          {/* Date */}
          <div className="w-8 h-0.5 bg-rose-200 rounded self-end" />
          {/* Recipient */}
          <div className="w-12 h-0.5 bg-muted rounded mt-0.5" />
          <div className="w-10 h-0.5 bg-muted rounded" />
          {/* Salutation */}
          <div className="w-8 h-0.5 bg-rose-300 rounded mt-0.5" />
          {/* Body */}
          <div className="w-full h-0.5 bg-muted rounded mt-0.5" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-3/4 h-0.5 bg-muted rounded" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-1/2 h-0.5 bg-muted rounded" />
          {/* Closing */}
          <div className="w-6 h-0.5 bg-rose-200 rounded mt-0.5" />
        </div>
        {/* Signature */}
        <div className="px-2.5 pb-1.5">
          <div className="w-12 border-b border-rose-300" />
          <div className="w-10 h-0.5 bg-rose-200 rounded mt-0.5" />
        </div>
        <div className="h-0.5 bg-gradient-to-r from-rose-300 via-pink-200 to-rose-300" />
      </div>
    ),
  },
  {
    id: 'brochure',
    name: 'Brochure',
    icon: '📰',
    color: 'bg-card border-2 border-violet-200 hover:border-violet-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Hero banner with title */}
        <div className="h-6 bg-gradient-to-br from-violet-500 to-purple-600 flex flex-col items-center justify-center gap-0.5">
          <div className="w-14 h-1 bg-white/80 rounded" />
          <div className="w-8 h-0.5 bg-white/40 rounded" />
        </div>
        <div className="flex-1 px-2 py-1.5 flex flex-col gap-1">
          {/* About Us */}
          <div className="w-8 h-0.5 bg-violet-500 rounded" />
          <div className="w-full h-0.5 bg-violet-100 rounded" />
          <div className="w-3/4 h-0.5 bg-violet-100 rounded" />
          {/* Services - 3 columns */}
          <div className="w-10 h-0.5 bg-violet-500 rounded mt-0.5" />
          <div className="flex gap-1">
            <div className="flex-1 bg-violet-50 rounded p-1 flex flex-col gap-0.5">
              <div className="w-full h-2 bg-violet-200 rounded" />
              <div className="w-full h-0.5 bg-violet-100 rounded" />
            </div>
            <div className="flex-1 bg-purple-50 rounded p-1 flex flex-col gap-0.5">
              <div className="w-full h-2 bg-purple-200 rounded" />
              <div className="w-full h-0.5 bg-purple-100 rounded" />
            </div>
            <div className="flex-1 bg-violet-50 rounded p-1 flex flex-col gap-0.5">
              <div className="w-full h-2 bg-violet-200 rounded" />
              <div className="w-full h-0.5 bg-violet-100 rounded" />
            </div>
          </div>
          {/* Why Choose Us */}
          <div className="w-14 h-0.5 bg-violet-500 rounded" />
          <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-sm bg-violet-400" /><div className="w-10 h-0.5 bg-violet-100 rounded" /></div>
          <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-sm bg-violet-400" /><div className="w-12 h-0.5 bg-violet-100 rounded" /></div>
          {/* Contact */}
          <div className="bg-violet-50 rounded p-1 flex items-center justify-center">
            <div className="w-10 h-0.5 bg-violet-400 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'recipe',
    name: 'Recipe',
    icon: '🍳',
    color: 'bg-card border-2 border-green-200 hover:border-green-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Recipe title & meta */}
        <div className="px-2.5 pt-2 pb-1">
          <div className="w-14 h-1.5 bg-green-700 rounded" />
          {/* Rating stars */}
          <div className="flex gap-0.5 mt-0.5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 4 ? 'bg-amber-400' : 'bg-amber-200'}`} />
            ))}
          </div>
          {/* Time & Servings */}
          <div className="flex gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
              <div className="w-5 h-0.5 bg-green-200 rounded" />
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
              <div className="w-5 h-0.5 bg-green-200 rounded" />
            </div>
          </div>
        </div>
        <div className="h-px bg-green-100 mx-2.5" />
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5">
          {/* Ingredients - checkbox list */}
          <div className="w-10 h-0.5 bg-green-500 rounded" />
          <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-sm border border-green-400" /><div className="w-10 h-0.5 bg-green-100 rounded" /></div>
          <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-sm bg-green-400" /><div className="w-8 h-0.5 bg-green-100 rounded" /></div>
          <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-sm border border-green-400" /><div className="w-12 h-0.5 bg-green-100 rounded" /></div>
          <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-sm border border-green-400" /><div className="w-6 h-0.5 bg-green-100 rounded" /></div>
          {/* Instructions - numbered steps */}
          <div className="w-12 h-0.5 bg-green-500 rounded mt-0.5" />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">1</div>
            <div className="w-[80%] h-0.5 bg-green-100 rounded" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">2</div>
            <div className="w-[70%] h-0.5 bg-green-100 rounded" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">3</div>
            <div className="w-[75%] h-0.5 bg-green-100 rounded" />
          </div>
          {/* Chef's Notes */}
          <div className="w-10 h-0.5 bg-green-500 rounded mt-0.5" />
          <div className="w-[85%] h-0.5 bg-green-50 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    icon: '📋',
    color: 'bg-card border-2 border-sky-200 hover:border-sky-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Header - Title, Date, Location */}
        <div className="px-2.5 pt-2 pb-1 bg-sky-50/50">
          <div className="w-14 h-1.5 bg-sky-600 rounded" />
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1 h-1 bg-sky-400 rounded-full" />
            <div className="w-6 h-0.5 bg-sky-200 rounded" />
            <div className="w-1 h-1 bg-sky-400 rounded-full" />
            <div className="w-8 h-0.5 bg-sky-200 rounded" />
          </div>
        </div>
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5">
          {/* Attendees */}
          <div className="w-8 h-0.5 bg-sky-500 rounded" />
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 rounded-full bg-sky-200" />
            <div className="w-2 h-2 rounded-full bg-sky-300 -ml-0.5" />
            <div className="w-2 h-2 rounded-full bg-sky-100 -ml-0.5" />
            <div className="w-6 h-0.5 bg-sky-100 rounded ml-0.5" />
          </div>
          {/* Agenda - numbered */}
          <div className="w-7 h-0.5 bg-sky-500 rounded mt-0.5" />
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-sky-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">1</div>
            <div className="w-10 h-0.5 bg-sky-100 rounded" />
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-sky-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">2</div>
            <div className="w-8 h-0.5 bg-sky-100 rounded" />
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-sky-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">3</div>
            <div className="w-12 h-0.5 bg-sky-100 rounded" />
          </div>
          {/* Discussion */}
          <div className="w-12 h-0.5 bg-sky-500 rounded mt-0.5" />
          <div className="w-[90%] h-0.5 bg-sky-100 rounded" />
          <div className="w-[75%] h-0.5 bg-sky-100 rounded" />
          {/* Action Items - table */}
          <div className="w-12 h-0.5 bg-amber-500 rounded mt-0.5" />
          <div className="bg-amber-50 rounded p-0.5">
            <div className="flex gap-0.5 mb-0.5">
              <div className="flex-[1.5] h-0.5 bg-amber-300 rounded" />
              <div className="flex-1 h-0.5 bg-amber-300 rounded" />
              <div className="flex-1 h-0.5 bg-amber-300 rounded" />
            </div>
            <div className="flex gap-0.5">
              <div className="flex-[1.5] h-0.5 bg-amber-100 rounded" />
              <div className="flex-1 h-0.5 bg-amber-100 rounded" />
              <div className="flex-1 h-0.5 bg-amber-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'training-proposal',
    name: 'Training Proposal',
    icon: '🎓',
    color: 'bg-card border-2 border-indigo-200 hover:border-indigo-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Header */}
        <div className="px-2.5 pt-2 pb-1 flex flex-col items-center gap-0.5">
          <div className="w-[60%] h-1.5 bg-indigo-700 rounded" />
          <div className="w-10 h-0.5 bg-indigo-300 rounded" />
        </div>
        <div className="h-px bg-indigo-100 mx-2.5" />
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5 overflow-hidden">
          {/* Overview */}
          <div className="w-10 h-0.5 bg-indigo-500 rounded" />
          <div className="w-[85%] h-0.5 bg-indigo-100 rounded" />
          {/* Objectives - numbered */}
          <div className="w-12 h-0.5 bg-indigo-500 rounded mt-0.5" />
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-indigo-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">1</div>
            <div className="w-[75%] h-0.5 bg-indigo-100 rounded" />
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-indigo-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">2</div>
            <div className="w-[65%] h-0.5 bg-indigo-100 rounded" />
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-indigo-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">3</div>
            <div className="w-[70%] h-0.5 bg-indigo-100 rounded" />
          </div>
          {/* Modules */}
          <div className="w-10 h-0.5 bg-indigo-500 rounded mt-0.5" />
          <div className="bg-indigo-50 rounded p-1">
            <div className="w-8 h-0.5 bg-indigo-400 rounded" />
            <div className="flex gap-0.5"><div className="flex-1 h-1.5 bg-indigo-200 rounded" /><div className="flex-1 h-1.5 bg-indigo-100 rounded" /></div>
          </div>
          <div className="bg-blue-50 rounded p-1">
            <div className="w-10 h-0.5 bg-blue-400 rounded" />
            <div className="flex gap-0.5"><div className="flex-1 h-1.5 bg-blue-200 rounded" /><div className="flex-1 h-1.5 bg-blue-100 rounded" /></div>
          </div>
          {/* Budget table */}
          <div className="w-8 h-0.5 bg-indigo-500 rounded mt-0.5" />
          <div className="bg-indigo-50 rounded p-0.5">
            <div className="flex gap-0.5 mb-0.5">
              <div className="flex-[1.5] h-0.5 bg-indigo-300 rounded" />
              <div className="flex-1 h-0.5 bg-indigo-300 rounded" />
            </div>
            <div className="flex gap-0.5">
              <div className="flex-[1.5] h-0.5 bg-indigo-100 rounded" />
              <div className="flex-1 h-0.5 bg-indigo-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'job-offer-letter',
    name: 'Job Offer Letter',
    icon: '💼',
    color: 'bg-card border-2 border-emerald-200 hover:border-emerald-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Company header */}
        <div className="px-2.5 pt-2 pb-1 flex items-center gap-1.5">
          <div className="w-4 h-4 bg-emerald-600 rounded" />
          <div className="w-14 h-1 bg-emerald-700 rounded" />
        </div>
        <div className="h-0.5 bg-emerald-200 mx-2.5" />
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5">
          {/* Dear Candidate */}
          <div className="w-12 h-0.5 bg-emerald-400 rounded" />
          <div className="w-[90%] h-0.5 bg-muted rounded" />
          {/* Position Details - key-value pairs */}
          <div className="w-14 h-0.5 bg-emerald-500 rounded mt-0.5" />
          <div className="bg-emerald-50 rounded p-1">
            <div className="flex gap-1 mb-0.5">
              <div className="w-6 h-0.5 bg-emerald-300 rounded" />
              <div className="flex-1 h-0.5 bg-emerald-200 rounded" />
            </div>
            <div className="flex gap-1 mb-0.5">
              <div className="w-8 h-0.5 bg-emerald-300 rounded" />
              <div className="flex-1 h-0.5 bg-emerald-200 rounded" />
            </div>
            <div className="flex gap-1 mb-0.5">
              <div className="w-5 h-0.5 bg-emerald-300 rounded" />
              <div className="flex-1 h-0.5 bg-emerald-200 rounded" />
            </div>
            <div className="flex gap-1">
              <div className="w-7 h-0.5 bg-emerald-300 rounded" />
              <div className="flex-1 h-0.5 bg-emerald-200 rounded" />
            </div>
          </div>
          {/* Compensation */}
          <div className="w-14 h-0.5 bg-emerald-500 rounded mt-0.5" />
          <div className="flex items-center gap-0.5"><div className="w-6 h-0.5 bg-emerald-300 rounded" /><div className="w-10 h-0.5 bg-muted rounded" /></div>
          <div className="flex items-center gap-0.5"><div className="w-4 h-0.5 bg-emerald-300 rounded" /><div className="w-8 h-0.5 bg-muted rounded" /></div>
          {/* Benefits */}
          <div className="w-8 h-0.5 bg-emerald-500 rounded mt-0.5" />
          <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-emerald-400" /><div className="w-10 h-0.5 bg-muted rounded" /></div>
          <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-emerald-400" /><div className="w-8 h-0.5 bg-muted rounded" /></div>
          <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-emerald-400" /><div className="w-12 h-0.5 bg-muted rounded" /></div>
        </div>
        {/* Acceptance signature */}
        <div className="h-px bg-emerald-100 mx-2.5" />
        <div className="px-2.5 py-1.5">
          <div className="w-8 h-0.5 bg-emerald-400 rounded mb-0.5" />
          <div className="flex gap-3">
            <div className="w-14 border-b border-emerald-300" />
            <div className="w-8 border-b border-emerald-300" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'essay',
    name: 'Essay',
    icon: '✍️',
    color: 'bg-card border-2 border-orange-200 hover:border-orange-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Centered title & author */}
        <div className="px-2.5 pt-2 pb-1 flex flex-col items-center gap-0.5">
          <div className="w-16 h-1.5 bg-orange-700 rounded" />
          <div className="w-12 h-0.5 bg-orange-300 rounded" />
          <div className="w-10 h-0.5 bg-orange-200 rounded" />
        </div>
        <div className="h-px bg-orange-100 mx-2.5" />
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5">
          {/* Introduction */}
          <div className="w-14 h-0.5 bg-orange-500 rounded" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-3/4 h-0.5 bg-muted rounded" />
          {/* Body Paragraph 1 */}
          <div className="w-16 h-0.5 bg-orange-500 rounded mt-0.5" />
          <div className="w-8 h-0.5 bg-orange-300 rounded" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-2/3 h-0.5 bg-muted rounded" />
          {/* Body Paragraph 2 */}
          <div className="w-16 h-0.5 bg-orange-500 rounded mt-0.5" />
          <div className="w-8 h-0.5 bg-orange-300 rounded" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-3/4 h-0.5 bg-muted rounded" />
          {/* Quote block */}
          <div className="border-l-2 border-orange-300 pl-1.5 my-0.5">
            <div className="w-10 h-0.5 bg-orange-100 rounded" />
            <div className="w-8 h-0.5 bg-orange-100 rounded" />
          </div>
          {/* Conclusion */}
          <div className="w-10 h-0.5 bg-orange-500 rounded mt-0.5" />
          <div className="w-full h-0.5 bg-muted rounded" />
          <div className="w-1/2 h-0.5 bg-muted rounded" />
        </div>
        {/* References */}
        <div className="h-px bg-orange-100 mx-2.5" />
        <div className="px-2.5 py-1">
          <div className="w-10 h-0.5 bg-orange-200 rounded" />
          <div className="w-[85%] h-0.5 bg-orange-50 rounded mt-0.5" />
        </div>
      </div>
    ),
  },
  {
    id: 'book',
    name: 'Book',
    icon: '📖',
    color: 'bg-card border-2 border-stone-200 hover:border-stone-400',
    preview: (
      <div className="w-full h-full bg-white flex">
        {/* Spine */}
        <div className="w-1.5 bg-gradient-to-b from-stone-600 to-stone-700 rounded-l-sm" />
        <div className="flex-1 flex flex-col">
          {/* Title page */}
          <div className="flex-1 px-2.5 py-2 flex flex-col items-center justify-center gap-0.5">
            <div className="w-14 h-1 bg-stone-700 rounded" />
            <div className="w-10 h-0.5 bg-stone-300 rounded" />
            <div className="h-px bg-stone-200 w-12 my-0.5" />
            <div className="w-3 h-3 border border-stone-300 rotate-45 my-0.5" />
          </div>
          <div className="h-px bg-stone-200 mx-2.5" />
          {/* Table of Contents */}
          <div className="px-2.5 py-1">
            <div className="w-12 h-0.5 bg-stone-500 rounded" />
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-2 h-2 bg-stone-400 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">1</div>
              <div className="w-10 h-0.5 bg-stone-100 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-stone-400 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">2</div>
              <div className="w-8 h-0.5 bg-stone-100 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-stone-400 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">3</div>
              <div className="w-12 h-0.5 bg-stone-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'class-notes',
    name: 'Class Notes',
    icon: '📓',
    color: 'bg-card border-2 border-cyan-200 hover:border-cyan-400',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Header - Subject, Date, Instructor */}
        <div className="px-2.5 pt-2 pb-1 bg-cyan-50/50">
          <div className="w-12 h-1 bg-cyan-600 rounded" />
          <div className="flex gap-1 mt-0.5">
            <div className="w-8 h-0.5 bg-cyan-200 rounded" />
            <div className="w-6 h-0.5 bg-cyan-200 rounded" />
          </div>
        </div>
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5 overflow-hidden">
          {/* Key Concepts */}
          <div className="w-12 h-0.5 bg-cyan-500 rounded" />
          <div className="flex items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <div className="w-10 h-0.5 bg-cyan-600 rounded" />
          </div>
          <div className="ml-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-cyan-300" /><div className="w-12 h-0.5 bg-cyan-100 rounded" /></div>
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-cyan-300" /><div className="w-10 h-0.5 bg-cyan-100 rounded" /></div>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <div className="w-8 h-0.5 bg-cyan-600 rounded" />
          </div>
          <div className="ml-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-cyan-300" /><div className="w-8 h-0.5 bg-cyan-100 rounded" /></div>
          </div>
          {/* Important Formulas */}
          <div className="w-14 h-0.5 bg-cyan-500 rounded mt-0.5" />
          <div className="bg-cyan-50 rounded p-0.5">
            <div className="w-[80%] h-1 bg-cyan-200 rounded" />
            <div className="w-[60%] h-1 bg-cyan-200 rounded mt-0.5" />
          </div>
          {/* Vocabulary table */}
          <div className="w-10 h-0.5 bg-cyan-500 rounded mt-0.5" />
          <div className="flex gap-0.5">
            <div className="flex-1 h-0.5 bg-cyan-300 rounded" />
            <div className="flex-1 h-0.5 bg-cyan-300 rounded" />
          </div>
          <div className="flex gap-0.5">
            <div className="flex-1 h-0.5 bg-cyan-100 rounded" />
            <div className="flex-1 h-0.5 bg-cyan-100 rounded" />
          </div>
          {/* Questions */}
          <div className="w-14 h-0.5 bg-amber-500 rounded mt-0.5" />
          <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-amber-400" /><div className="w-12 h-0.5 bg-amber-100 rounded" /></div>
          <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-amber-400" /><div className="w-10 h-0.5 bg-amber-100 rounded" /></div>
        </div>
      </div>
    ),
  },
  {
    id: 'consulting-agreement',
    name: 'Consulting Agreement',
    icon: '🤝',
    color: 'bg-card border-2 border-border hover:border-muted-foreground/40',
    preview: (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Formal header */}
        <div className="px-2.5 pt-2 pb-1 flex flex-col items-center gap-0.5">
          <div className="w-[60%] h-1.5 bg-slate-700 rounded" />
          <div className="w-10 h-0.5 bg-slate-300 rounded" />
        </div>
        <div className="h-0.5 bg-muted mx-2.5" />
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-0.5 overflow-hidden">
          {/* Parties */}
          <div className="w-8 h-0.5 bg-slate-500 rounded" />
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="w-8 h-0.5 bg-slate-400 rounded" />
              <div className="w-10 h-0.5 bg-muted rounded" />
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="w-10 h-0.5 bg-slate-400 rounded" />
              <div className="w-8 h-0.5 bg-muted rounded" />
            </div>
          </div>
          {/* Clause 1 - Scope */}
          <div className="flex items-center gap-0.5 mt-0.5">
            <div className="w-2 h-2 bg-slate-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">1</div>
            <div className="w-10 h-0.5 bg-slate-500 rounded" />
          </div>
          <div className="ml-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-slate-400" /><div className="w-12 h-0.5 bg-muted rounded" /></div>
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-slate-400" /><div className="w-10 h-0.5 bg-muted rounded" /></div>
          </div>
          {/* Clause 2 - Compensation */}
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-slate-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">2</div>
            <div className="w-12 h-0.5 bg-slate-500 rounded" />
          </div>
          <div className="ml-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5"><div className="w-6 h-0.5 bg-slate-300 rounded" /><div className="w-10 h-0.5 bg-muted rounded" /></div>
            <div className="flex items-center gap-0.5"><div className="w-8 h-0.5 bg-slate-300 rounded" /><div className="w-6 h-0.5 bg-muted rounded" /></div>
          </div>
          {/* Clause 3 - Deliverables table */}
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-slate-500 rounded-sm flex items-center justify-center text-[4px] text-white font-bold">3</div>
            <div className="w-10 h-0.5 bg-slate-500 rounded" />
          </div>
          <div className="ml-2.5 bg-muted/50 rounded p-0.5">
            <div className="flex gap-0.5 mb-0.5">
              <div className="flex-[1.5] h-0.5 bg-slate-300 rounded" />
              <div className="flex-1 h-0.5 bg-slate-300 rounded" />
            </div>
            <div className="flex gap-0.5">
              <div className="flex-[1.5] h-0.5 bg-muted rounded" />
              <div className="flex-1 h-0.5 bg-muted rounded" />
            </div>
          </div>
        </div>
        {/* Dual signature lines */}
        <div className="h-px bg-muted mx-2.5" />
        <div className="px-2.5 py-1.5 flex gap-3">
          <div className="flex-1">
            <div className="w-full border-b border-slate-300" />
            <div className="w-6 h-0.5 bg-muted rounded mt-0.5" />
          </div>
          <div className="flex-1">
            <div className="w-full border-b border-slate-300" />
            <div className="w-8 h-0.5 bg-muted rounded mt-0.5" />
          </div>
        </div>
      </div>
    ),
  },
]

// Helper: get template preview by document template ID
function getTemplatePreview(templateId: string) {
  return allTemplates.find(t => t.id === templateId) || allTemplates[0]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function HomePage() {
  const { user, documents, orgDocuments, activeOrgId, organizations, recentDocViewMode, setRecentDocViewMode, logout, createDocument, fetchDocuments, setCurrentView, setActiveDocumentId, deleteDocument, updateDocument, avatarVersion, pendingInvitations, dismissPendingInvitation, fetchOrganizations } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [creatingDoc, setCreatingDoc] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeInvitationToken, setActiveInvitationToken] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user, activeOrgId])

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    setCanScrollLeft(container.scrollLeft > 5)
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 5)
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    checkScrollability()
    container.addEventListener('scroll', checkScrollability)
    window.addEventListener('resize', checkScrollability)
    return () => {
      container.removeEventListener('scroll', checkScrollability)
      window.removeEventListener('resize', checkScrollability)
    }
  }, [checkScrollability])

  // Re-check scrollability after animations settle
  useEffect(() => {
    const timer = setTimeout(checkScrollability, 500)
    return () => clearTimeout(timer)
  }, [checkScrollability])

  const scrollByAmount = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return
    const scrollAmount = 320 // approximately 2 template cards width
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const handleCreateDocument = async (templateId: string, templateName: string, icon: string) => {
    setCreatingDoc(true)
    try {
      const doc = await createDocument(
        templateId === 'blank' ? 'Untitled Document' : templateName,
        templateId,
        icon,
        activeOrgId || undefined
      )
      if (doc) {
        setActiveDocumentId(doc.id)
        setCurrentView('editor')
        toast({ title: 'Document created', description: `"${doc.title}" is ready to edit` })
      }
    } finally {
      setCreatingDoc(false)
    }
  }

  const handleOpenDocument = (docId: string) => {
    setActiveDocumentId(docId)
    setCurrentView('editor')
  }

  const handleDeleteDocument = async (docId: string) => {
    const doc = allDocs.find((d) => d.id === docId)
    if (!doc) return
    if (!confirm(`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`)) return
    const success = await deleteDocument(docId)
    if (success) {
      toast({ title: 'Document deleted', description: `"${doc.title}" has been removed` })
    } else {
      toast({ title: 'Delete failed', description: 'Could not delete the document', variant: 'destructive' })
    }
  }

  const handleToggleStar = async (docId: string, isStarred: boolean) => {
    const success = await updateDocument(docId, { isStarred: !isStarred })
    if (success) {
      toast({
        title: isStarred ? 'Star removed' : 'Document starred',
        description: isStarred ? 'Star has been removed' : 'Document has been added to starred',
      })
    }
  }

  // ─── Role-based access control ────────────────────────────────
  // Determine the current user's role in the active organization
  const activeOrg = organizations.find((o) => o.id === activeOrgId) || null
  const userOrgRole = activeOrg?.role ?? null // 'admin', 'member', 'viewer', or null (personal)

  // Permission flags — personal docs always allow everything
  const canCreate = !activeOrgId || ['admin', 'member'].includes(userOrgRole || '')
  const canStar = !activeOrgId || ['admin', 'member'].includes(userOrgRole || '')
  const canDelete = !activeOrgId || userOrgRole === 'admin'

  // Use the correct document list based on active org context
  const allDocs = activeOrgId ? orgDocuments : documents

  const filteredDocuments = allDocs.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const recentDocuments = filteredDocuments
  const starredDocuments = filteredDocuments.filter((doc) => doc.isStarred)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center shadow-md shadow-purple-200">
                <FileText className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
                UmairDocs
              </span>
            </div>

            {/* Search - visible on all screens */}
            <div className="flex flex-1 max-w-md mx-4 md:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={activeOrgId ? "Search team documents..." : "Search documents..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-10 bg-muted border-border focus:bg-background focus:border-purple-300 focus:ring-purple-200/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-muted">
                    <Avatar key={`avatar-home-${avatarVersion}`} className="h-9 w-9 border-2 border-purple-200">
                      {user?.avatar && <AvatarImage src={user.avatar} alt="" />}
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <div className="px-2 py-3 mb-1">
                    <div className="flex items-center gap-3">
                      <Avatar key={`avatar-home-dd-${avatarVersion}`} className="h-10 w-10 border-2 border-purple-200">
                        {user?.avatar && <AvatarImage src={user.avatar} alt="" />}
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setCurrentView('settings')}>
                    <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={() => {
                      logout()
                      toast({ title: 'Signed out', description: 'You have been signed out successfully' })
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Start a new document or continue where you left off</p>
        </motion.div>

        {/* Pending Invitations Banner */}
        <AnimatePresence>
          {pendingInvitations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 space-y-2"
            >
              {pendingInvitations.map((inv) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-lg">{inv.organization.icon || '🏢'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-purple-500">{inv.inviter.name || inv.inviter.email}</span> invited you to join{' '}
                      <span className="font-semibold">{inv.organization.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Role: <span className="capitalize">{inv.role}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                      onClick={() => setActiveInvitationToken(inv.token)}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                      onClick={() => dismissPendingInvitation(inv.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                      Dismiss
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Invitation Dialog */}
        {activeInvitationToken && (
          <InvitationDialog
            token={activeInvitationToken}
            onClose={() => {
              setActiveInvitationToken(null)
              fetchOrganizations()
            }}
          />
        )}

        {/* Start a New Document Section - Horizontal Carousel (hidden for viewers) */}
        {canCreate && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Start a New Document
            </h2>
            <span className="text-xs text-muted-foreground">{allTemplates.length} templates available</span>
          </div>

          {/* Horizontal Carousel with Arrow Buttons */}
          <div className="relative group/carousel">
            {/* Left Arrow */}
            <motion.button
              onClick={() => scrollByAmount('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-20 w-10 h-10 rounded-full bg-card/95 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 hover:shadow-purple-100 transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none disabled:cursor-default"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={!canScrollLeft}
              aria-label="Scroll templates left"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover/carousel:text-purple-600 transition-colors" />
            </motion.button>

            {/* Right Arrow */}
            <motion.button
              onClick={() => scrollByAmount('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-20 w-10 h-10 rounded-full bg-card/95 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 hover:shadow-purple-100 transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none disabled:cursor-default"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={!canScrollRight}
              aria-label="Scroll templates right"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover/carousel:text-purple-600 transition-colors" />
            </motion.button>

            {/* Scrollable Template Row */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 px-6 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {allTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 + index * 0.03, duration: 0.4 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="cursor-pointer group flex-shrink-0 snap-start"
                  onClick={() => handleCreateDocument(template.id, template.name, template.icon)}
                >
                  <Card className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-100/50 ${template.color} w-[140px] sm:w-[150px]`}>
                    <CardContent className="p-0">
                      <div className="aspect-[3/4] relative overflow-hidden">
                        {template.preview}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-card rounded-full p-2.5 shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-200">
                            <Plus className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <p className="mt-2 text-xs font-medium text-foreground group-hover:text-purple-600 transition-colors text-center truncate max-w-[140px] sm:max-w-[150px]">
                    {template.name}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Fade edges for smooth visual */}
            <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          </div>
        </motion.section>
        )}

        {/* Recent Documents Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              {searchQuery ? `Search Results` : 'Recent Documents'}
            </h2>
            <div className="flex items-center gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  {filteredDocuments.length} result{filteredDocuments.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {starredDocuments.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                  {starredDocuments.length} starred
                </Badge>
              )}
              {recentDocuments.length > 0 && (
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setRecentDocViewMode('grid')}
                    className={`p-1.5 transition-colors ${recentDocViewMode === 'grid' ? 'bg-purple-50 text-purple-600' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRecentDocViewMode('list')}
                    className={`p-1.5 transition-colors ${recentDocViewMode === 'list' ? 'bg-purple-50 text-purple-600' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {recentDocuments.length === 0 && searchQuery ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-card rounded-2xl border border-dashed border-border"
            >
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-foreground font-medium mb-1">No results found</h3>
              <p className="text-muted-foreground text-sm">Try a different search term</p>
            </motion.div>
          ) : recentDocuments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center py-16 bg-card rounded-2xl border border-dashed border-border"
            >
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-foreground font-medium mb-1">No documents yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {canCreate ? 'Create your first document to get started' : 'No documents have been shared with you yet'}
              </p>
              {canCreate && (
              <Button
                onClick={() => handleCreateDocument('blank', 'Untitled Document', '📄')}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
              )}
            </motion.div>
          ) : recentDocViewMode === 'grid' ? (
            /* Grid View with Thumbnails */
            <div className="max-h-[480px] overflow-y-auto docs-scrollbar pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {recentDocuments.map((doc, index) => {
                  const tplPreview = getTemplatePreview(doc.template)
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      whileHover={{ y: -4 }}
                      className="cursor-pointer group"
                      onClick={() => handleOpenDocument(doc.id)}
                    >
                      <Card className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-100/50 ${tplPreview.color}`}>
                        <CardContent className="p-0">
                          <div className="aspect-[3/4] relative overflow-hidden">
                            {tplPreview.preview}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/10 transition-colors duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5">
                                {/* Star toggle — hidden for viewers */}
                                {canStar && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 bg-card/90 hover:bg-card shadow-md rounded-full"
                                  onClick={(e) => { e.stopPropagation(); handleToggleStar(doc.id, doc.isStarred) }}
                                >
                                  <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                                </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 bg-card/90 hover:bg-card shadow-md rounded-full"
                                  onClick={(e) => { e.stopPropagation(); handleOpenDocument(doc.id) }}
                                >
                                  <Edit3 className="w-4 h-4 text-purple-600" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 bg-card/90 hover:bg-card shadow-md rounded-full"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleOpenDocument(doc.id)}>
                                      <Edit3 className="w-4 h-4 mr-2" />
                                      Open in editor
                                    </DropdownMenuItem>
                                    {/* Star option — hidden for viewers */}
                                    {canStar && (
                                    <DropdownMenuItem onClick={() => handleToggleStar(doc.id, doc.isStarred)}>
                                      <Star className="w-4 h-4 mr-2" />
                                      {doc.isStarred ? 'Remove star' : 'Add star'}
                                    </DropdownMenuItem>
                                    )}
                                    {/* Delete option — hidden for non-admins in org */}
                                    {canDelete && (
                                    <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                    </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {/* Star badge — hidden for viewers */}
                            {canStar && doc.isStarred && (
                              <div className="absolute top-1.5 right-1.5 opacity-100 group-hover:opacity-0 transition-opacity">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-sm" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <div className="mt-1.5 px-0.5">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
            </div>
          ) : (
            /* List View */
            <div className="max-h-[480px] overflow-y-auto docs-scrollbar pr-1">
            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/80 border-b border-border/60 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-5">Name</div>
                <div className="col-span-2 hidden md:block">Shared</div>
                <div className="col-span-3 hidden md:block">Last modified</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Document Rows */}
              <AnimatePresence>
                {recentDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-purple-50/30 dark:hover:bg-purple-950/30 transition-colors group border-b border-border/40 last:border-b-0 cursor-pointer"
                    onClick={() => handleOpenDocument(doc.id)}
                  >
                    {/* Name with mini thumbnail */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-12 rounded border border-border overflow-hidden flex-shrink-0 shadow-sm">
                        {getTemplatePreview(doc.template).preview}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                          {doc.title}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                      {/* Star icon — hidden for viewers */}
                      {canStar && doc.isStarred && (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Shared */}
                    <div className="col-span-2 hidden md:block">
                      <span className="text-xs text-muted-foreground">Only you</span>
                    </div>

                    {/* Last Modified */}
                    <div className="col-span-3 hidden md:block">
                      <span className="text-xs text-muted-foreground">{formatDate(doc.updatedAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Star toggle — hidden for viewers */}
                      {canStar && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleToggleStar(doc.id, doc.isStarred)}
                      >
                        <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                      </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenDocument(doc.id)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Open in editor
                          </DropdownMenuItem>
                          {/* Star option — hidden for viewers */}
                          {canStar && (
                          <DropdownMenuItem onClick={() => handleToggleStar(doc.id, doc.isStarred)}>
                            <Star className="w-4 h-4 mr-2" />
                            {doc.isStarred ? 'Remove star' : 'Add star'}
                          </DropdownMenuItem>
                          )}
                          {/* Delete option — hidden for non-admins in org */}
                          {canDelete && (
                          <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                          </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            </div>
          )}
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/50 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2025 UmairDocs. All rights reserved.</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Secured with end-to-end encryption</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Loading overlay for document creation */}
      <AnimatePresence>
        {creatingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card dark:bg-card rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-foreground font-medium">Creating document...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chatbot */}
      <AIChatbot />
      </div>{/* end main area wrapper */}
    </div>
  )
}
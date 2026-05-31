'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Code,
  Quote,
  Link2,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Share2,
  FileText,
  Printer,
  Sparkles,
  Minus,
  Highlighter,
  FileDown,
  Clock,
  Check,
  ImagePlus,
  Palette,
  Pencil,
  Columns2,
  Columns3,
  Subscript,
  Superscript,
  RemoveFormatting,
  TextCursorInput,
  Paintbrush,
  Eraser,
  IndentIncrease,
  IndentDecrease,
  Table as TableIcon,
  PenTool,
  Pipette,
  Pilcrow,
  ZoomIn,
  ZoomOut,
  Move,
  Download,
  PanelLeft,
  PanelRight,
  ChevronDown,
  SmilePlus,
  Space,
  Workflow,
  AlertCircle,
  Crop,
  Lock,
  Unlock,
  Trash2,
  RefreshCcw,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { AIChatbot } from '@/components/chat/ai-chatbot'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

// Font families available for selection
const FONT_FAMILIES = [
  { name: 'Default', value: 'sans-serif' },
  { name: 'Serif', value: 'serif' },
  { name: 'Monospace', value: 'monospace' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { name: 'Impact', value: 'Impact, sans-serif' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { name: 'Palatino', value: '"Palatino Linotype", serif' },
]

// Font sizes
const FONT_SIZES = [
  '8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '32', '36', '48', '64', '72',
]

// Line heights
const LINE_HEIGHTS = [
  { label: '1.0', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: '1.8', value: '1.8' },
  { label: '2.0', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: '3.0', value: '3' },
]

// Color palette
const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
]

// Drawing colors for canvas
const DRAW_COLORS = [
  '#000000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#0000ff', '#9900ff', '#ff00ff',
  '#434343', '#cc4125', '#e06666', '#f6b26b', '#93c47d', '#6d9eeb', '#8e7cc3', '#c27ba0',
]

// Layout templates
const LAYOUT_TEMPLATES = [
  { id: 'single', name: 'Single Column', icon: FileText, description: 'Default single column layout' },
  { id: 'two-col', name: 'Two Column', icon: Columns2, description: 'Side by side columns' },
  { id: 'three-col', name: 'Three Column', icon: Columns3, description: 'Three equal columns' },
  { id: 'left-sidebar', name: 'Left Sidebar', icon: PanelLeft, description: 'Narrow left + wide right' },
  { id: 'right-sidebar', name: 'Right Sidebar', icon: PanelRight, description: 'Wide left + narrow right' },
]

export function EditorPage() {
  const { documents, orgDocuments, activeDocumentId, activeOrgId, setCurrentView, updateDocument, setActiveDocumentId, fetchDocuments } = useAppStore()
  const [title, setTitle] = useState('Untitled Document')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [showDrawCanvas, setShowDrawCanvas] = useState(false)
  const [drawColor, setDrawColor] = useState('#000000')
  const [drawSize, setDrawSize] = useState(3)
  const [isEraser, setIsEraser] = useState(false)
  const [fetchedContent, setFetchedContent] = useState<string | null>(null)

  // Image edit dialog state
  const [imageEditOpen, setImageEditOpen] = useState(false)
  const [editingImageSrc, setEditingImageSrc] = useState('')
  const [editingImageElement, setEditingImageElement] = useState<HTMLImageElement | null>(null)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0 })
  const [cropZoom, setCropZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined)
  const [resizeWidth, setResizeWidth] = useState(0)
  const [resizeHeight, setResizeHeight] = useState(0)
  const [resizeLockAspect, setResizeLockAspect] = useState(true)
  const [imageEditTab, setImageEditTab] = useState<'crop' | 'resize'>('crop')
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 })

  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeDocumentIdRef = useRef(activeDocumentId)
  const titleRef = useRef(title)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  const activeDocument = documents.find((d) => d.id === activeDocumentId) || orgDocuments.find((d) => d.id === activeDocumentId)

  // Keep refs in sync
  useEffect(() => {
    activeDocumentIdRef.current = activeDocumentId
  }, [activeDocumentId])

  useEffect(() => {
    titleRef.current = title
  }, [title])

  // Fetch full document content when opening a document
  // (the list API no longer returns content to save bandwidth)
  useEffect(() => {
    if (activeDocumentId && !fetchedContent && !isReady) {
      fetch(`/api/documents/${activeDocumentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.document) {
            setFetchedContent(data.document.content || '<p><br></p>')
            setTitle(data.document.title)
          }
        })
        .catch(() => {
          setFetchedContent('<p><br></p>')
        })
    }
  }, [activeDocumentId, fetchedContent, isReady])

  // Wrap any existing bare images in draggable wrappers
  const wrapExistingImages = useCallback(() => {
    if (!editorRef.current) return
    const bareImages = editorRef.current.querySelectorAll('img:not(.umair-img-wrapper img)')
    bareImages.forEach((img) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'umair-img-wrapper'
      wrapper.setAttribute('contenteditable', 'false')
      wrapper.style.cssText = 'position: relative; display: inline-block; margin: 8px 0; max-width: 100%; cursor: move;'

      const handle = document.createElement('div')
      handle.className = 'umair-img-resize-handle'
      handle.style.cssText = 'position: absolute; bottom: -4px; right: -4px; width: 12px; height: 12px; background: #7c3aed; border-radius: 2px; cursor: nwse-resize;'

      const imgEl = img as HTMLImageElement
      // Reset image styles for wrapper context
      imgEl.style.maxWidth = '100%'
      imgEl.style.height = 'auto'
      imgEl.style.borderRadius = '8px'
      imgEl.style.display = 'block'
      imgEl.style.margin = '0'

      img.parentNode?.insertBefore(wrapper, img)
      wrapper.appendChild(img)
      wrapper.appendChild(handle)
    })
  }, [])

  // Initialize editor content
  useEffect(() => {
    if (fetchedContent !== null && editorRef.current && !isReady) {
      // Use setTimeout to ensure the DOM is ready before setting innerHTML
      // This is important for large content with embedded images
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = fetchedContent
          // Wrap any existing bare images in draggable wrappers
          wrapExistingImages()
          setIsReady(true)
        }
      }, 0)
    }
  }, [fetchedContent, isReady, wrapExistingImages])

  // Delegated event listener for image drag and resize
  useEffect(() => {
    if (!isReady || !editorRef.current) return

    const editor = editorRef.current

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Check if clicking on resize handle
      const resizeHandle = target.closest('.umair-img-resize-handle')
      if (resizeHandle) {
        e.preventDefault()
        e.stopPropagation()
        const wrapper = resizeHandle.parentElement as HTMLElement
        const img = wrapper.querySelector('img') as HTMLImageElement
        if (!img) return

        const startX = e.clientX
        const startWidth = img.offsetWidth

        const handleMouseMove = (me: MouseEvent) => {
          const diff = me.clientX - startX
          const newWidth = Math.max(50, startWidth + diff)
          img.style.width = newWidth + 'px'
          img.style.maxWidth = 'none'
          img.style.height = 'auto'
        }

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
          handleContentChange()
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return
      }

      // Check if clicking on image wrapper for drag
      const wrapper = target.closest('.umair-img-wrapper') as HTMLElement
      if (wrapper && !resizeHandle) {
        e.preventDefault()
        const startX = e.clientX
        const startY = e.clientY

        // Get current transform
        const currentTransform = wrapper.style.transform || ''
        const matchX = currentTransform.match(/translateX\(([-\d.]+)px\)/)
        const matchY = currentTransform.match(/translateY\(([-\d.]+)px\)/)
        const offsetX = matchX ? parseFloat(matchX[1]) : 0
        const offsetY = matchY ? parseFloat(matchY[1]) : 0

        const handleMouseMove = (me: MouseEvent) => {
          const diffX = me.clientX - startX + offsetX
          const diffY = me.clientY - startY + offsetY
          wrapper.style.transform = `translateX(${diffX}px) translateY(${diffY}px)`
        }

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
          handleContentChange()
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
      }
    }

    editor.addEventListener('mousedown', handleMouseDown)
    return () => editor.removeEventListener('mousedown', handleMouseDown)
  }, [isReady])

  // Double-click on image opens edit dialog
  useEffect(() => {
    if (!isReady || !editorRef.current) return
    const editor = editorRef.current

    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const img = target.closest('.umair-img-wrapper img') as HTMLImageElement | null
      if (!img) return

      e.preventDefault()
      setEditingImageElement(img)
      setEditingImageSrc(img.src)
      setResizeWidth(img.naturalWidth)
      setResizeHeight(img.naturalHeight)
      setOriginalImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      setCropArea({ x: 0, y: 0 })
      setCropZoom(1)
      setCroppedAreaPixels(null)
      setCropAspect(undefined)
      setImageEditTab('crop')
      setResizeLockAspect(true)
      setImageEditOpen(true)
    }

    editor.addEventListener('dblclick', handleDoubleClick)
    return () => editor.removeEventListener('dblclick', handleDoubleClick)
  }, [isReady])

  // Fetch documents list if not yet loaded (for sidebar/metadata)
  useEffect(() => {
    if (activeDocumentId && !activeDocument) {
      fetchDocuments()
    }
  }, [activeDocumentId, !!activeDocument])

  // Redirect home if document content can't be fetched
  useEffect(() => {
    if (fetchedContent === null && activeDocumentId && !isReady) {
      const timer = setTimeout(() => {
        if (!isReady) {
          setCurrentView('home')
          setActiveDocumentId(null)
        }
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [fetchedContent, activeDocumentId, isReady, setCurrentView, setActiveDocumentId])

  const saveDocument = useCallback(async (showToast = false) => {
    const docId = activeDocumentIdRef.current
    if (!docId || !editorRef.current) return
    setIsSaving(true)
    setSaveError(false)
    try {
      const htmlContent = editorRef.current.innerHTML
      const success = await updateDocument(docId, { content: htmlContent, title: titleRef.current })
      if (success) {
        setLastSaved(new Date().toLocaleTimeString())
        if (showToast) toast({ title: 'Saved', description: 'Document saved successfully' })
      } else {
        console.error('Failed to save document')
        setSaveError(true)
        if (showToast) toast({ title: 'Save failed', description: 'Could not save your document. Try again.', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Save document error:', error)
      setSaveError(true)
      if (showToast) toast({ title: 'Save failed', description: 'Could not save your document. Try again.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }, [updateDocument])

  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument()
    }, 3000)
  }, [saveDocument])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleContentChange = () => {
    scheduleAutoSave()
  }

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleContentChange()
  }

  // Insert HTML directly into the contentEditable editor using DOM API
  // This is more reliable than document.execCommand('insertHTML')
  const insertHTMLAtCursor = (html: string) => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      // No selection — append at end
      editor.insertAdjacentHTML('beforeend', html)
      handleContentChange()
      return
    }

    const range = sel.getRangeAt(0)
    range.deleteContents()

    // Create a temporary container to parse the HTML
    const temp = document.createElement('div')
    temp.innerHTML = html

    // Insert each child node
    const frag = document.createDocumentFragment()
    let lastNode: Node | null = null
    while (temp.firstChild) {
      lastNode = temp.firstChild
      frag.appendChild(temp.firstChild)
    }

    range.insertNode(frag)

    // Move cursor after the inserted content
    if (lastNode) {
      const newRange = document.createRange()
      newRange.setStartAfter(lastNode)
      newRange.collapse(true)
      sel.removeAllRanges()
      sel.addRange(newRange)
    }

    handleContentChange()
  }

  const handleBack = async () => {
    await saveDocument(false)
    setActiveDocumentId(null)
    setCurrentView('home')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      saveDocument(true)
    }
  }

  const handleManualSave = () => {
    saveDocument(true)
  }

  // Image insertion
  const handleInsertImage = (src: string) => {
    // Escape any quotes in the src to prevent HTML injection
    const escapedSrc = src.replace(/"/g, '&quot;')
    const imgHTML = `<div class="umair-img-wrapper" contenteditable="false" style="position: relative; display: inline-block; margin: 8px 0; max-width: 100%; cursor: move;"><img src="${escapedSrc}" style="max-width: 100%; height: auto; border-radius: 8px; display: block;" /><div class="umair-img-resize-handle" style="position: absolute; bottom: -4px; right: -4px; width: 12px; height: 12px; background: #7c3aed; border-radius: 2px; cursor: nwse-resize;"></div></div>`
    insertHTMLAtCursor(imgHTML)
    toast({ title: 'Image added', description: 'Drag to move, double-click to crop/edit' })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be under 5MB', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) return

      // Compress the image to reduce data URL size for database storage
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 800
        let width = img.width
        let height = img.height

        // Scale down large images while preserving aspect ratio
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width)
          width = MAX_WIDTH
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height)
          height = MAX_HEIGHT
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          // Compress to JPEG at 0.8 quality (good balance of quality and size)
          const compressed = canvas.toDataURL('image/jpeg', 0.8)
          handleInsertImage(compressed)
        } else {
          // Fallback: use original data URL
          handleInsertImage(dataUrl)
        }
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleImageUrl = () => {
    const url = prompt('Enter image URL:')
    if (url) handleInsertImage(url)
  }

  // ─── Image Crop ──────────────────────────────────────────────
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx)
  }, [])

  const applyCrop = useCallback(async () => {
    if (!editingImageElement || !croppedAreaPixels) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = editingImageSrc

    await new Promise<void>(resolve => { img.onload = () => resolve() })

    const canvas = document.createElement('canvas')
    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(
      img,
      croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0,
      croppedAreaPixels.width, croppedAreaPixels.height
    )

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    editingImageElement.src = croppedDataUrl
    handleContentChange()
    setImageEditOpen(false)
    toast({ title: 'Image cropped', description: 'Crop applied successfully' })
  }, [editingImageElement, croppedAreaPixels, editingImageSrc])

  // ─── Image Resize ────────────────────────────────────────────
  const applyResize = useCallback(() => {
    if (!editingImageElement || resizeWidth <= 0 || resizeHeight <= 0) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = editingImageSrc

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = resizeWidth
      canvas.height = resizeHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0, resizeWidth, resizeHeight)
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9)

      editingImageElement.src = resizedDataUrl
      editingImageElement.style.width = resizeWidth + 'px'
      editingImageElement.style.height = resizeHeight + 'px'
      handleContentChange()
      setImageEditOpen(false)
      toast({ title: 'Image resized', description: 'Resize applied successfully' })
    }
  }, [editingImageElement, resizeWidth, resizeHeight, editingImageSrc])

  const handleResizeWidthChange = (newWidth: number) => {
    setResizeWidth(newWidth)
    if (resizeLockAspect && originalImageDimensions.width > 0) {
      setResizeHeight(Math.round((newWidth / originalImageDimensions.width) * originalImageDimensions.height))
    }
  }

  const handleResizeHeightChange = (newHeight: number) => {
    setResizeHeight(newHeight)
    if (resizeLockAspect && originalImageDimensions.height > 0) {
      setResizeWidth(Math.round((newHeight / originalImageDimensions.height) * originalImageDimensions.width))
    }
  }

  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingImageElement) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) return
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const compressed = canvas.toDataURL('image/jpeg', 0.8)
          editingImageElement.src = compressed
          handleContentChange()
          setEditingImageSrc(compressed)
          setResizeWidth(img.width)
          setResizeHeight(img.height)
          setOriginalImageDimensions({ width: img.width, height: img.height })
          toast({ title: 'Image replaced', description: 'New image applied' })
        }
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleDeleteImage = () => {
    if (!editingImageElement) return
    const wrapper = editingImageElement.closest('.umair-img-wrapper')
    if (wrapper) {
      wrapper.remove()
    } else {
      editingImageElement.remove()
    }
    handleContentChange()
    setImageEditOpen(false)
    toast({ title: 'Image deleted', description: 'Image removed from document' })
  }

  const applyResizePreset = (percent: number) => {
    const newW = Math.round(originalImageDimensions.width * (percent / 100))
    const newH = Math.round(originalImageDimensions.height * (percent / 100))
    setResizeWidth(newW)
    setResizeHeight(newH)
  }

  // Table insertion
  const handleInsertTable = (rows: number, cols: number) => {
    let tableHTML = '<table style="width:100%; border-collapse:collapse; margin:12px 0; border:1px solid #e2e8f0;">'
    for (let r = 0; r < rows; r++) {
      tableHTML += '<tr>'
      for (let c = 0; c < cols; c++) {
        const bg = r === 0 ? ' style="background:#f1f5f9; font-weight:600; padding:8px 12px; border:1px solid #e2e8f0;"' : ' style="padding:8px 12px; border:1px solid #e2e8f0;"'
        tableHTML += `<td${bg}>${r === 0 ? 'Header' : ' '}</td>`
      }
      tableHTML += '</tr>'
    }
    tableHTML += '</table><p><br></p>'
    insertHTMLAtCursor(tableHTML)
    toast({ title: 'Table added', description: `${rows}×${cols} table inserted` })
  }

  // Layout insertion
  const handleApplyLayout = (layoutId: string) => {
    let html = ''
    switch (layoutId) {
      case 'single':
        html = '<div style="padding:8px;"><p>Start typing in a single column layout...</p></div>'
        break
      case 'two-col':
        html = '<div style="display:flex; gap:24px; padding:8px;"><div style="flex:1; min-width:0;"><p>Left column content...</p></div><div style="flex:1; min-width:0;"><p>Right column content...</p></div></div>'
        break
      case 'three-col':
        html = '<div style="display:flex; gap:16px; padding:8px;"><div style="flex:1; min-width:0;"><p>Column 1...</p></div><div style="flex:1; min-width:0;"><p>Column 2...</p></div><div style="flex:1; min-width:0;"><p>Column 3...</p></div></div>'
        break
      case 'left-sidebar':
        html = '<div style="display:flex; gap:24px; padding:8px;"><div style="flex:1; min-width:0;"><p>Sidebar content...</p></div><div style="flex:2; min-width:0;"><p>Main content area...</p></div></div>'
        break
      case 'right-sidebar':
        html = '<div style="display:flex; gap:24px; padding:8px;"><div style="flex:2; min-width:0;"><p>Main content area...</p></div><div style="flex:1; min-width:0;"><p>Sidebar content...</p></div></div>'
        break
    }
    insertHTMLAtCursor(html)
    toast({ title: 'Layout applied', description: 'Layout template has been inserted' })
  }

  // Drawing canvas logic
  const initDrawCanvas = () => {
    setShowDrawCanvas(true)
    setTimeout(() => {
      const canvas = drawCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawCtxRef.current = ctx
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }, 100)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawCtxRef.current) return
    isDrawingRef.current = true
    const rect = drawCanvasRef.current!.getBoundingClientRect()
    lastPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !drawCtxRef.current) return
    const ctx = drawCtxRef.current
    const rect = drawCanvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(x, y)
    ctx.strokeStyle = isEraser ? '#ffffff' : drawColor
    ctx.lineWidth = isEraser ? drawSize * 4 : drawSize
    ctx.stroke()
    lastPosRef.current = { x, y }
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
  }

  const insertDrawing = () => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    // Use JPEG compression for smaller file size (PNG is 5-10x larger)
    // White background fill first since JPEG doesn't support transparency
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        // Fill white background
        tempCtx.fillStyle = '#ffffff'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        // Draw the original canvas content on top
        tempCtx.drawImage(canvas, 0, 0)
        // Export as JPEG at 90% quality (much smaller than PNG)
        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9)
        handleInsertImage(dataUrl)
      } else {
        // Fallback to PNG if canvas context unavailable
        const dataUrl = canvas.toDataURL('image/png')
        handleInsertImage(dataUrl)
      }
    } else {
      const dataUrl = canvas.toDataURL('image/png')
      handleInsertImage(dataUrl)
    }
    setShowDrawCanvas(false)
    toast({ title: 'Drawing inserted', description: 'Your drawing has been added to the document' })
  }

  const clearCanvas = () => {
    const canvas = drawCanvasRef.current
    const ctx = drawCtxRef.current
    if (!canvas || !ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Emoji insertion
  const EMOJI_LIST = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '🥲', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐', '🌟', '✨', '⚡', '🔥', '💫', '🎵', '🎶', '✅', '❌', '⭕', '💯', '🎯', '🏆', '📖', '📝', '📎', '📌', '💡', '🔔', '🎨', '🖌️']

  const insertEmoji = (emoji: string) => {
    executeCommand('insertText', emoji)
  }

  // Toolbar definition
  const toolbarButtons = [
    {
      group: 'history',
      items: [
        { icon: Undo2, command: 'undo', tooltip: 'Undo (Ctrl+Z)' },
        { icon: Redo2, command: 'redo', tooltip: 'Redo (Ctrl+Y)' },
      ],
    },
    {
      group: 'text-style',
      items: [
        { icon: Heading1, command: 'formatBlock', value: 'h1', tooltip: 'Heading 1' },
        { icon: Heading2, command: 'formatBlock', value: 'h2', tooltip: 'Heading 2' },
        { icon: Heading3, command: 'formatBlock', value: 'h3', tooltip: 'Heading 3' },
        { icon: Pilcrow, command: 'formatBlock', value: 'p', tooltip: 'Paragraph' },
      ],
    },
    {
      group: 'formatting',
      items: [
        { icon: Bold, command: 'bold', tooltip: 'Bold (Ctrl+B)' },
        { icon: Italic, command: 'italic', tooltip: 'Italic (Ctrl+I)' },
        { icon: Underline, command: 'underline', tooltip: 'Underline (Ctrl+U)' },
        { icon: Strikethrough, command: 'strikeThrough', tooltip: 'Strikethrough' },
        { icon: Subscript, command: 'subscript', tooltip: 'Subscript' },
        { icon: Superscript, command: 'superscript', tooltip: 'Superscript' },
      ],
    },
    {
      group: 'alignment',
      items: [
        { icon: AlignLeft, command: 'justifyLeft', tooltip: 'Align Left' },
        { icon: AlignCenter, command: 'justifyCenter', tooltip: 'Align Center' },
        { icon: AlignRight, command: 'justifyRight', tooltip: 'Align Right' },
        { icon: AlignJustify, command: 'justifyFull', tooltip: 'Justify' },
      ],
    },
    {
      group: 'lists-indent',
      items: [
        { icon: List, command: 'insertUnorderedList', tooltip: 'Bullet List' },
        { icon: ListOrdered, command: 'insertOrderedList', tooltip: 'Numbered List' },
        { icon: IndentIncrease, command: 'indent', tooltip: 'Increase Indent' },
        { icon: IndentDecrease, command: 'outdent', tooltip: 'Decrease Indent' },
      ],
    },
    {
      group: 'insert',
      items: [
        { icon: Quote, command: 'formatBlock', value: 'blockquote', tooltip: 'Quote' },
        { icon: Minus, command: 'insertHorizontalRule', tooltip: 'Divider' },
        { icon: Code, command: 'formatBlock', value: 'pre', tooltip: 'Code Block' },
        { icon: RemoveFormatting, command: 'removeFormat', tooltip: 'Clear Formatting' },
      ],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background" onKeyDown={handleKeyDown}>
      {/* AI Chatbot */}
      <AIChatbot />
      {/* Top Bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-card border-b border-border shadow-sm"
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 hover:bg-muted" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to documents</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{activeDocument?.icon || '📄'}</span>
              {isEditingTitle ? (
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false) }}
                  className="h-8 text-sm font-medium border-purple-300 focus:border-purple-500"
                />
              ) : (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-sm font-medium text-foreground hover:text-purple-600 truncate transition-colors"
                >
                  {title}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
              {isSaving ? (
                <><div className="w-3 h-3 border-2 border-border border-t-purple-600 rounded-full animate-spin" /><span>Saving...</span></>
              ) : saveError ? (
                <><AlertCircle className="w-3 h-3 text-red-500" /><span className="text-red-500">Save failed</span><Button variant="ghost" size="sm" className="h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-1" onClick={() => saveDocument(true)}>Retry</Button></>
              ) : lastSaved ? (
                <><Check className="w-3 h-3 text-green-500" /><span>Saved at {lastSaved}</span></>
              ) : null}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Zoom controls */}
            <div className="flex items-center gap-0.5 mr-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground w-10 text-center font-medium">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleManualSave}>
                    <FileDown className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save (Ctrl+S)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => window.print()}>
                    <Printer className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-foreground hover:text-purple-600" onClick={() => toast({ title: 'Share feature coming soon!' })}>
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="sticky top-14 z-40 bg-card border-b border-border shadow-sm"
      >
        <div className="px-4 py-1.5 space-y-1.5">
          {/* Row 1: Main toolbar buttons */}
          <div className="flex items-center gap-0.5 overflow-x-auto">
            <TooltipProvider delayDuration={200}>
              {toolbarButtons.map((group, groupIndex) => (
                <div key={group.group} className="flex items-center">
                  {group.items.map((item) => (
                    <Tooltip key={item.tooltip}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-purple-500/10 hover:text-purple-600 flex-shrink-0"
                          onClick={() => {
                            if (item.command === 'createLink') {
                              const url = prompt('Enter URL:')
                              if (url) executeCommand(item.command, url)
                            } else if (item.command === 'formatBlock') {
                              executeCommand(item.command, item.value)
                            } else {
                              executeCommand(item.command, item.value)
                            }
                          }}
                        >
                          <item.icon className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">{item.tooltip}</TooltipContent>
                    </Tooltip>
                  ))}
                  {groupIndex < toolbarButtons.length - 1 && (
                    <Separator orientation="vertical" className="h-5 mx-1" />
                  )}
                </div>
              ))}

              {/* Link button */}
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple-500/10 hover:text-purple-600 flex-shrink-0" onClick={() => { const url = prompt('Enter URL:'); if (url) executeCommand('createLink', url) }}>
                    <Link2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Insert Link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Row 2: Extended tools (Font, Size, Colors, Image, Draw, Layout, Table, Emoji) */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {/* Font Family Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 min-w-[100px] justify-between border-border hover:border-purple-300">
                  <Type className="w-3 h-3" />
                  <span className="truncate">Font</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto">
                {FONT_FAMILIES.map((font) => (
                  <DropdownMenuItem
                    key={font.value}
                    onClick={() => executeCommand('fontName', font.value)}
                    className="cursor-pointer"
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Font Size Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 min-w-[60px] justify-between border-border hover:border-purple-300">
                  <TextCursorInput className="w-3 h-3" />
                  <span>Size</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-20 max-h-64 overflow-y-auto">
                {FONT_SIZES.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => executeCommand('fontSize', size)}
                    className="cursor-pointer text-center"
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Line Height Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border hover:border-purple-300">
                  <Space className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-24">
                {LINE_HEIGHTS.map((lh) => (
                  <DropdownMenuItem
                    key={lh.value}
                    onClick={() => executeCommand('formatBlock', `<div style="line-height: ${lh.value}">`)}
                    className="cursor-pointer"
                  >
                    {lh.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-5 mx-0.5" />

            {/* Text Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border hover:border-purple-300">
                  <Palette className="w-3 h-3" />
                  <div className="w-3 h-3 rounded-sm border border-slate-300 bg-black" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" side="bottom">
                <p className="text-xs font-medium text-muted-foreground mb-2">Text Color</p>
                <div className="grid grid-cols-10 gap-1">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-4 h-4 rounded-sm border border-border hover:scale-125 transition-transform cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => executeCommand('foreColor', color)}
                      title={color}
                    />
                  ))}
                </div>
                <Separator className="my-2" />
                <div className="flex items-center gap-2">
                  <Pipette className="w-3 h-3 text-muted-foreground/50" />
                  <input
                    type="color"
                    className="w-6 h-6 rounded cursor-pointer border-0"
                    onChange={(e) => executeCommand('foreColor', e.target.value)}
                    title="Custom color"
                  />
                  <span className="text-xs text-muted-foreground/50">Custom color</span>
                </div>
              </PopoverContent>
            </Popover>

            {/* Highlight Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border hover:border-purple-300">
                  <Highlighter className="w-3 h-3" />
                  <div className="w-3 h-3 rounded-sm border border-slate-300 bg-yellow-200" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" side="bottom">
                <p className="text-xs font-medium text-muted-foreground mb-2">Highlight Color</p>
                <div className="grid grid-cols-10 gap-1">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={`hl-${color}`}
                      className="w-4 h-4 rounded-sm border border-border hover:scale-125 transition-transform cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => executeCommand('hiliteColor', color)}
                      title={color}
                    />
                  ))}
                </div>
                <Separator className="my-2" />
                <Button variant="ghost" size="sm" className="w-full text-xs h-6" onClick={() => executeCommand('hiliteColor', 'transparent')}>
                  <Eraser className="w-3 h-3 mr-1" /> Remove Highlight
                </Button>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-5 mx-0.5" />

            {/* Image Insert */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border hover:border-purple-300">
                  <ImagePlus className="w-3 h-3" />
                  <span>Image</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" side="bottom">
                <p className="text-xs font-medium text-muted-foreground mb-2">Insert Image</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-purple-500/10 hover:border-purple-300 cursor-pointer transition-colors">
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">Upload from device</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-purple-500/10 hover:border-purple-300 cursor-pointer transition-colors w-full"
                    onClick={handleImageUrl}
                  >
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">From URL</span>
                  </button>
                  <Separator />
                  <p className="text-[10px] text-muted-foreground/50">Supported: JPG, PNG, GIF, SVG, WebP (max 5MB)</p>
                </div>
              </PopoverContent>
            </Popover>

            {/* Draw Tool */}
            <Dialog open={showDrawCanvas} onOpenChange={setShowDrawCanvas}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border hover:border-purple-300" onClick={initDrawCanvas}>
                  <PenTool className="w-3 h-3" />
                  <span>Draw</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-purple-600" />
                    Drawing Canvas
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {/* Drawing Tools */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Button
                        variant={!isEraser ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setIsEraser(false)}
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Pen
                      </Button>
                      <Button
                        variant={isEraser ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setIsEraser(true)}
                      >
                        <Eraser className="w-3 h-3 mr-1" /> Eraser
                      </Button>
                    </div>
                    <Separator orientation="vertical" className="h-5" />
                    <div className="flex items-center gap-1">
                      {DRAW_COLORS.map((c) => (
                        <button
                          key={c}
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${drawColor === c && !isEraser ? 'border-purple-500 scale-110' : 'border-border hover:scale-110'}`}
                          style={{ backgroundColor: c }}
                          onClick={() => { setDrawColor(c); setIsEraser(false) }}
                        />
                      ))}
                    </div>
                    <Separator orientation="vertical" className="h-5" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground/50">Size:</span>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={drawSize}
                        onChange={(e) => setDrawSize(Number(e.target.value))}
                        className="w-16 h-1 accent-purple-600"
                      />
                      <span className="text-xs text-muted-foreground w-4">{drawSize}</span>
                    </div>
                  </div>

                  {/* Canvas */}
                  <div className="border-2 border-border rounded-lg overflow-hidden">
                    <canvas
                      ref={drawCanvasRef}
                      className="w-full cursor-crosshair"
                      style={{ height: '350px' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={clearCanvas} className="text-xs">
                      <Eraser className="w-3 h-3 mr-1" /> Clear Canvas
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowDrawCanvas(false)} className="text-xs">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={insertDrawing} className="text-xs bg-purple-600 hover:bg-purple-700">
                        <ImagePlus className="w-3 h-3 mr-1" /> Insert Drawing
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Separator orientation="vertical" className="h-5 mx-0.5" />

            {/* Table Insert */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border hover:border-purple-300">
                  <TableIcon className="w-3 h-3" />
                  <span>Table</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" side="bottom">
                <p className="text-xs font-medium text-muted-foreground mb-2">Insert Table</p>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 3 },
                    { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 4, c: 5 },
                    { r: 5, c: 5 }, { r: 6, c: 4 }, { r: 6, c: 6 },
                  ].map(({ r, c }) => (
                    <button
                      key={`${r}x${c}`}
                      className="px-2 py-1.5 text-xs rounded border border-border hover:bg-purple-500/10 hover:border-purple-300 transition-colors"
                      onClick={() => handleInsertTable(r, c)}
                    >
                      {r}×{c}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Layout Templates */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border hover:border-purple-300">
                  <Workflow className="w-3 h-3" />
                  <span>Layout</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" side="bottom">
                <p className="text-xs font-medium text-muted-foreground mb-2">Page Layouts</p>
                <div className="space-y-1">
                  {LAYOUT_TEMPLATES.map((layout) => (
                    <button
                      key={layout.id}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md border border-border hover:bg-purple-500/10 hover:border-purple-300 transition-colors text-left"
                      onClick={() => handleApplyLayout(layout.id)}
                    >
                      <layout.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{layout.name}</p>
                        <p className="text-[10px] text-muted-foreground/50">{layout.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Emoji Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border hover:border-purple-300">
                  <SmilePlus className="w-3 h-3" />
                  <span>Emoji</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" side="bottom">
                <p className="text-xs font-medium text-muted-foreground mb-2">Insert Emoji</p>
                <div className="grid grid-cols-10 gap-0.5 max-h-48 overflow-y-auto">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      className="w-6 h-6 flex items-center justify-center hover:bg-purple-500/10 rounded text-sm transition-colors"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </motion.div>

      {/* Editor Area */}
      <div className="flex-1 py-8 px-4 relative">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading document...</p>
            </div>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : 20 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="max-w-4xl mx-auto"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <div
            className="bg-card dark:bg-card rounded-xl shadow-sm border border-border/60 min-h-[calc(100vh-200px)] p-12 md:p-16 focus:outline-none prose prose-slate prose-lg max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:block"
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentChange}
            data-placeholder="Start typing your document..."
            style={{
              lineHeight: '1.8',
              fontSize: '16px',
            }}
          />
        </motion.div>
      </div>

      {/* Footer Status Bar */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="sticky bottom-0 bg-card border-t border-border shadow-sm mt-auto"
      >
        <div className="flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {activeDocument?.template === 'blank' ? 'Document' : activeDocument?.template || 'Document'}
            </span>
            <span>Zoom: {zoom}%</span>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last saved: {lastSaved}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              UmairDocs Editor
            </span>
          </div>
        </div>
      </motion.footer>

      {/* Image Edit Dialog */}
      <Dialog open={imageEditOpen} onOpenChange={(open) => { if (!open) setImageEditOpen(false) }}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5 text-purple-600" />
              Edit Image
            </DialogTitle>
          </DialogHeader>

          {/* Tab Switcher */}
          <div className="flex gap-2 border-b border-border pb-2">
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-t-lg transition-colors ${imageEditTab === 'crop' ? 'bg-purple-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setImageEditTab('crop')}
            >
              <Crop className="w-4 h-4 inline mr-1" /> Crop
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-t-lg transition-colors ${imageEditTab === 'resize' ? 'bg-purple-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setImageEditTab('resize')}
            >
              <RefreshCcw className="w-4 h-4 inline mr-1" /> Resize
            </button>
          </div>

          {imageEditTab === 'crop' ? (
            <div className="space-y-3">
              {/* Cropper */}
              <div className="relative w-full h-[300px] bg-black rounded-lg overflow-hidden">
                <Cropper
                  image={editingImageSrc}
                  crop={cropArea}
                  zoom={cropZoom}
                  aspect={cropAspect}
                  onCropChange={setCropArea}
                  onZoomChange={setCropZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  className="flex-1 accent-purple-600"
                />
                <span className="text-xs text-muted-foreground w-8">{cropZoom.toFixed(1)}x</span>
              </div>

              {/* Aspect Ratio Presets */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ratio:</span>
                {[
                  { label: 'Free', value: undefined },
                  { label: '1:1', value: 1 },
                  { label: '4:3', value: 4 / 3 },
                  { label: '16:9', value: 16 / 9 },
                  { label: '3:2', value: 3 / 2 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setCropAspect(preset.value)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${cropAspect === preset.value ? 'border-purple-500 bg-purple-500/10 text-purple-600' : 'border-border hover:border-purple-300'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <Button className="w-full" onClick={applyCrop} disabled={!croppedAreaPixels}>
                <Crop className="w-4 h-4 mr-1" /> Apply Crop
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Width / Height */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Width (px)</label>
                  <Input
                    type="number"
                    value={resizeWidth}
                    onChange={(e) => handleResizeWidthChange(Number(e.target.value))}
                    min={1}
                    className="h-8"
                  />
                </div>
                <button
                  onClick={() => setResizeLockAspect(!resizeLockAspect)}
                  className="mt-5 p-1.5 rounded-md hover:bg-muted transition-colors"
                  title={resizeLockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                >
                  {resizeLockAspect ? <Lock className="w-4 h-4 text-purple-600" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
                </button>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Height (px)</label>
                  <Input
                    type="number"
                    value={resizeHeight}
                    onChange={(e) => handleResizeHeightChange(Number(e.target.value))}
                    min={1}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Percentage Presets */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Presets:</span>
                {[
                  { label: '25%', value: 25 },
                  { label: '50%', value: 50 },
                  { label: '75%', value: 75 },
                  { label: '100%', value: 100 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyResizePreset(preset.value)}
                    className="px-2.5 py-1 text-xs rounded-md border border-border hover:border-purple-300 hover:bg-purple-500/10 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground">
                Original: {originalImageDimensions.width} × {originalImageDimensions.height} → New: {resizeWidth} × {resizeHeight}
              </p>

              <Button className="w-full" onClick={applyResize} disabled={resizeWidth <= 0 || resizeHeight <= 0}>
                <RefreshCcw className="w-4 h-4 mr-1" /> Apply Resize
              </Button>
            </div>
          )}

          {/* Bottom actions */}
          <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-muted cursor-pointer text-xs transition-colors">
                <ImagePlus className="w-3.5 h-3.5" /> Replace
                <input type="file" accept="image/*" className="hidden" onChange={handleReplaceImage} />
              </label>
              <Button variant="outline" size="sm" className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDeleteImage}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            </div>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setImageEditOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
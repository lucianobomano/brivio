import {
    ArrowRight, ArrowUpRight, ArrowLeft, ArrowDown, ChevronRight, ChevronDown, MoveRight,
    Download, Upload, ExternalLink, Link2, Play, PlayCircle, Plus, Check, X,
    Mail, Phone, MessageCircle, Send, Calendar, Clock, MapPin, Globe,
    Heart, Star, Bookmark, Share2, Eye, Search, Copy, Sparkles, Zap, Rocket,
    FileText, FolderOpen, Image, Palette, Type, Lock, LogIn, User, ShoppingBag, Info,
    type LucideIcon,
} from "lucide-react"

/** Icons a button can carry, by the name stored in `content.icon.name` */
export const BUTTON_ICONS: Record<string, LucideIcon> = {
    'arrow-right': ArrowRight,
    'arrow-up-right': ArrowUpRight,
    'move-right': MoveRight,
    'chevron-right': ChevronRight,
    'arrow-left': ArrowLeft,
    'arrow-down': ArrowDown,
    'chevron-down': ChevronDown,
    'download': Download,
    'upload': Upload,
    'external-link': ExternalLink,
    'link': Link2,
    'play': Play,
    'play-circle': PlayCircle,
    'plus': Plus,
    'check': Check,
    'x': X,
    'mail': Mail,
    'phone': Phone,
    'message': MessageCircle,
    'send': Send,
    'calendar': Calendar,
    'clock': Clock,
    'map-pin': MapPin,
    'globe': Globe,
    'heart': Heart,
    'star': Star,
    'bookmark': Bookmark,
    'share': Share2,
    'eye': Eye,
    'search': Search,
    'copy': Copy,
    'sparkles': Sparkles,
    'zap': Zap,
    'rocket': Rocket,
    'file': FileText,
    'folder': FolderOpen,
    'image': Image,
    'palette': Palette,
    'type': Type,
    'lock': Lock,
    'log-in': LogIn,
    'user': User,
    'shopping-bag': ShoppingBag,
    'info': Info,
}

export interface ButtonIconSettings {
    name: string
    /** Where the icon sits; 'only' hides the label (it stays as the accessible name) */
    position?: 'left' | 'right' | 'only'
    /** px */
    size?: number
    /** Defaults to the button text color */
    color?: string
    /** Nudges the icon in its direction when the button is hovered */
    hoverShift?: boolean
}

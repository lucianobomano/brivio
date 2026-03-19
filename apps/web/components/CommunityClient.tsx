"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, MessageSquare, Share2, Search, MoreHorizontal, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProjectViewerModal } from "./ProjectViewerModal"
import { FloatingMenu } from "./layout/FloatingMenu"

import { likePost } from "@/app/actions/community"
import { toggleProjectLike } from "@/app/actions/projects"

interface Post {
    id: string
    author: string
    authorId?: string
    avatar: string
    image: string
    title: string
    likes: number
    comments: number
    tags: string[]
    liked: boolean
    type?: string
    content_json?: any[]
    category?: string
    created_at?: string
    likers?: string[]
}

const CATEGORIES = ["All", "Branding", "UI/UX", "Illustration", "Typography", "Motion", "Packaging"]

export function CommunityClient({ initialPosts }: { initialPosts: Post[] }) {
    const [posts, setPosts] = React.useState(initialPosts)

    React.useEffect(() => {
        setPosts(initialPosts)
    }, [initialPosts])

    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedCategory, setSelectedCategory] = React.useState("All")
    const [selectedProject, setSelectedProject] = React.useState<Post | null>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)



    const handleLike = async (postId: string) => {
        // Optimistic update
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    liked: !post.liked,
                    likes: post.liked ? post.likes - 1 : post.likes + 1
                }
            }
            return post
        }))

        // Server action
        const post = posts.find(p => p.id === postId)
        if (post) {
            try {
                if (post.type === 'project') {
                    await toggleProjectLike(postId)
                } else {
                    await likePost(postId)
                }
            } catch (error) {
                console.error("Error liking:", error)
                // Revert on error
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) {
                        return {
                            ...p,
                            liked: !p.liked, // Revert like status
                            likes: p.liked ? p.likes + 1 : p.likes - 1 // Revert count
                        }
                    }
                    return p
                }))
            }
        }
    }

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.author.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory.toLowerCase() === "all" ||
            post.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase()) ||
            (post as any).category?.toLowerCase() === selectedCategory.toLowerCase()
        return matchesSearch && matchesCategory
    })

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto px-4 pt-0 pb-12 bg-bg-0 relative">
            {/* Hero Section */}
            <div className="max-w-full mx-auto px-2 flex flex-col items-center justify-start text-center pt-[50px]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                >
                    <div className="mb-8 px-5 py-[6px] rounded-full text-[14px] font-normal font-inter-tight text-text-secondary animate-border-glow-flow">
                        <span className="relative z-10">Welcome to Brivio°</span>
                    </div>
                    <h1 className="text-[150px] leading-[0.9] font-normal font-inter-tight tracking-[-0.04em] text-text-primary mb-12 uppercase text-center">
                        Create, Discover <br /> and Inspire
                    </h1>
                    <p className="text-xl text-text-secondary max-w-xl leading-relaxed">
                        Join the world&apos;s most innovative creative community. Share your brand experiments and connect with design leaders.
                    </p>
                </motion.div>
            </div>

            {/* Search & Filters group */}
            <div className="mt-[80px] flex flex-col md:flex-row md:items-center gap-6 justify-between">
                <div className="relative w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-accent-indigo transition-colors" />
                    <input
                        type="text"
                        placeholder="Search for inspiration..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 bg-bg-1 border border-bg-3 rounded-2xl pl-12 pr-4 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo focus:ring-4 focus:ring-accent-indigo/10 transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
                                selectedCategory === category
                                    ? "bg-text-primary text-bg-0"
                                    : "bg-bg-1 text-text-secondary border border-bg-3 hover:border-text-primary hover:text-text-primary"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Feed */}
            <div className="max-w-full mx-auto px-2 mt-[80px]">
                <div className="flex flex-wrap gap-8 justify-center">
                    <AnimatePresence mode="popLayout">
                        {filteredPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="bg-bg-1 rounded-3xl border border-bg-3 overflow-hidden group hover:border-accent-indigo/50 hover:shadow-2xl hover:shadow-accent-indigo/5 transition-all duration-500 h-[625px] flex flex-col w-full md:w-[590px]"
                            >
                                {/* Media Container */}
                                <div
                                    onClick={(e) => {
                                        if (post.type === 'project') {
                                            e.preventDefault();
                                            setSelectedProject(post);
                                        }
                                    }}
                                    className="relative flex-1 bg-bg-2 overflow-hidden cursor-pointer group-hover:brightness-105 transition-all duration-700"
                                >
                                    <div className="absolute inset-0">
                                        {post.image && !post.image.includes('gradient') ? (
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        const fallback = document.createElement('div');
                                                        fallback.className = "absolute inset-0 bg-gradient-to-br from-accent-indigo/20 to-accent-blue/20";
                                                        parent.appendChild(fallback);
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className={cn(
                                                "absolute inset-0 bg-gradient-to-br transition-opacity duration-700",
                                                post.image?.includes('gradient') ? post.image : "from-accent-indigo/10 to-transparent opacity-50"
                                            )} />
                                        )}
                                    </div>

                                    {/* Action Overlays */}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 z-20">
                                        <div className="flex justify-end">
                                            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-accent-indigo transition-all duration-300 transform hover:scale-110">
                                                <Share2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex justify-end">
                                            <button className="w-12 h-12 rounded-full bg-accent-indigo text-white flex items-center justify-center shadow-xl shadow-accent-indigo/20 transform hover:scale-110 transition-transform">
                                                <ArrowUpRight className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                                </div>

                                {/* Details */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <Link href={`/creators/${post.authorId}`} className="flex items-center gap-3 group/author">
                                            <div className="w-10 h-10 rounded-full bg-bg-3 border border-bg-3 flex items-center justify-center font-bold text-text-primary text-sm overflow-hidden transition-transform group-hover/author:scale-105">
                                                {post.avatar ? (
                                                    <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-tr from-accent-blue/20 to-accent-indigo/20 flex items-center justify-center">
                                                        {post.author.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-text-primary group-hover/author:text-accent-indigo transition-colors cursor-pointer tracking-tight">{post.author}</span>
                                                <span className="text-[11px] text-text-tertiary font-medium uppercase tracking-widest leading-none mt-0.5">Contributor</span>
                                            </div>
                                        </Link>
                                        <button className="w-8 h-8 rounded-full hover:bg-bg-2 flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <h3 className="text-[24px] font-bold text-text-primary group-hover:text-accent-indigo transition-colors leading-tight mb-6 truncate" title={post.title}>
                                        {post.title}
                                    </h3>

                                    <div className="flex items-center justify-between pt-6 border-t border-bg-3">
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={() => handleLike(post.id)}
                                                className={cn(
                                                    "flex items-center gap-2 text-sm font-bold transition-all duration-300",
                                                    post.liked ? "text-[#ff0054] scale-105" : "text-text-secondary hover:text-[#ff0054]"
                                                )}
                                            >
                                                <Heart className={cn("w-5 h-5", post.liked && "fill-current")} />
                                                <span>{post.likes}</span>
                                            </button>
                                            <button className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm font-bold">
                                                <MessageSquare className="w-5 h-5" />
                                                <span>{post.comments}</span>
                                            </button>
                                        </div>
                                        <div className="flex -space-x-2 items-center">
                                            {post.likers?.slice(0, 4).map((avatar, i) => (
                                                <div key={i} className="w-[25px] h-[25px] rounded-full border-2 border-bg-1 bg-bg-3 shadow-sm flex items-center justify-center overflow-hidden">
                                                    {avatar ? (
                                                        <img src={avatar} alt="Liker" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-tr from-accent-indigo/10 to-accent-blue/10" />
                                                    )}
                                                </div>
                                            ))}
                                            {(post.likers?.length || 0) > 4 && (
                                                <div className="w-[25px] h-[25px] rounded-full border-2 border-bg-1 bg-bg-3 shadow-sm flex items-center justify-center text-[9px] font-bold text-text-secondary">
                                                    +{post.likers!.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nominees Section */}
            <div className="max-w-full mx-auto px-2 mt-[160px] pb-[160px]">
                {/* Nominees Header */}
                <div className="flex flex-col items-center text-center mb-[80px]">
                    <span className="text-sm font-medium text-text-secondary mb-4 font-inter-tight">Lastest</span>
                    <h2 className="text-[120px] font-normal font-inter-tight tracking-[-0.04em] text-text-primary uppercase leading-none mb-6">
                        NOMINEES
                    </h2>
                    <p className="text-sm text-text-secondary max-w-sm font-inter-tight leading-relaxed">
                        Vote for the latest projects on brivio awards
                    </p>
                </div>

                {/* Nominees Grid (3 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.slice(0, 3).map((post) => (
                        <div
                            key={`nominee-${post.id}`}
                            onClick={() => {
                                if (post.type === 'project') {
                                    setSelectedProject(post);
                                }
                            }}
                            className="flex flex-col group cursor-pointer"
                        >
                            {/* Card Image Container */}
                            <div className="aspect-[4/3] rounded-[32px] overflow-hidden bg-bg-2 mb-6 border border-bg-3 group-hover:border-accent-indigo/30 transition-all duration-500 relative">
                                <div className="absolute inset-0">
                                    {post.image && !post.image.includes('gradient') ? (
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    const fallback = document.createElement('div');
                                                    fallback.className = "absolute inset-0 bg-gradient-to-br from-accent-indigo/20 to-accent-blue/20";
                                                    parent.appendChild(fallback);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className={cn(
                                            "absolute inset-0 bg-gradient-to-br transition-all duration-700 group-hover:scale-105",
                                            post.image?.includes('gradient') ? post.image : "from-accent-indigo/10 to-transparent opacity-50"
                                        )} />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                            </div>

                            {/* Nominee Metadata */}
                            <div className="flex items-center space-x-2 px-2">
                                <span className="text-[15px] font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{post.title}</span>
                                <span className="text-[13px] text-text-tertiary">by</span>
                                <Link href={`/creators/${post.authorId}`} className="flex items-center gap-2 group/author">
                                    <div className="w-5 h-5 rounded-full bg-bg-3 overflow-hidden flex items-center justify-center">
                                        {post.avatar ? (
                                            <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-accent-blue/20 to-accent-indigo/20 flex items-center justify-center text-[8px] font-bold text-text-primary">
                                                {post.author.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[15px] font-bold text-text-primary group-hover/author:text-accent-indigo transition-colors whitespace-nowrap">{post.author}</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Nominees Footer link */}
                <div className="mt-[100px] flex justify-center">
                    <button className="flex items-center gap-4 group">
                        <span className="text-sm text-text-secondary font-medium font-inter-tight group-hover:text-text-primary transition-colors">Check out all submitted projects</span>
                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300">
                            <span className="w-12 h-[1px] bg-bg-3 group-hover:bg-text-primary transition-colors" />
                            <span className="text-sm font-bold text-text-primary font-inter-tight">View all Nominees</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Floating Footer Menu */}
            <FloatingMenu
                leftElement={
                    <div className="w-[60px] h-[60px] bg-[#232323]/80 rounded-full flex items-center justify-center group cursor-pointer hover:bg-[#2a2a2a] transition-colors shrink-0">
                        <div className="w-10 h-10 rounded-full border-[3px] border-transparent bg-origin-border bg-clip-content border-box bg-gradient-to-tr from-[#FF0054] via-[#88007F] to-[#06D6A0] relative">
                            <div className="absolute inset-0 rounded-full border-[1.5px] border-white/20" />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#311C99]/40 to-transparent" />
                        </div>
                    </div>
                }
                rightElement={
                    <button className="w-[90px] h-[60px] bg-[#E9E9E9] rounded-full text-[13px] font-bold text-[#222222] hover:bg-white transition-colors shrink-0 shadow-lg">
                        Be pro
                    </button>
                }
            >
                {[
                    { label: 'Brands', href: '/brands' },
                    { label: 'Brand books', href: '#' },
                    { label: 'Collections', href: '#' },
                    { label: 'Creators pool', href: '/creators-pool' }
                ].map(item => (
                    <Link key={item.label} href={item.href}>
                        <button className="h-[48px] rounded-full border-[0.5px] border-[#727272]/50 text-[#727272] hover:border-[#E9E9E9] hover:text-[#E9E9E9] text-[13px] font-bold font-inter-tight px-[20px] whitespace-nowrap transition-all">
                            {item.label}
                        </button>
                    </Link>
                ))}
            </FloatingMenu>

            {selectedProject && (
                <ProjectViewerModal
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    project={{
                        id: selectedProject.id,
                        name: selectedProject.title,
                        content_json: selectedProject.content_json || [],
                        category: selectedProject.category,
                        tags: selectedProject.tags,
                        cover_url: selectedProject.image,
                        author: selectedProject.author,
                        avatar: selectedProject.avatar,
                        created_at: selectedProject.created_at
                    }}
                    authorProjects={posts
                        .filter(p => p.author === selectedProject.author && p.id !== selectedProject.id)
                        .map(p => ({
                            id: p.id,
                            name: p.title,
                            cover_url: p.image
                        }))
                    }
                    onSelectProject={(projectId) => {
                        const newProject = posts.find(p => p.id === projectId)
                        if (newProject) {
                            setSelectedProject(newProject)
                        }
                    }}
                />
            )}
        </div >
    )
}

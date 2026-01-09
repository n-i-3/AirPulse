'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { BentoCard } from '@/components/dashboard/BentoCard';
import { usePrivy } from '@privy-io/react-auth';
import {
    ArrowUp, ArrowDown, MessageCircle, MapPin, Calendar, ExternalLink,
    Factory, Car, AlertTriangle, CloudRain, ShieldCheck, Filter, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Report {
    _id: string;
    cid: string;
    reporter: string;
    metadata: {
        category: string;
        description: string;
    };
    location: {
        coordinates: [number, number];
    };
    upvotes: number;
    downvotes: number;
    upvotedBy: string[];
    downvotedBy: string[];
    commentCount: number;
    timestamp: string;
}

interface Comment {
    _id: string;
    userId: string;
    text: string;
    createdAt: string;
    upvotes: number;
}

const categoryIcons: Record<string, any> = {
    industrial: Factory,
    vehicular: Car,
    construction: AlertTriangle,
    waste: CloudRain,
    other: ShieldCheck
};

const categoryColors: Record<string, string> = {
    industrial: 'border-orange-500/30 bg-orange-950/10',
    vehicular: 'border-blue-500/30 bg-blue-950/10',
    construction: 'border-yellow-500/30 bg-yellow-950/10',
    waste: 'border-red-500/30 bg-red-950/10',
    other: 'border-cyan-500/30 bg-cyan-950/10'
};

export default function CommunityPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [commentText, setCommentText] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('recent');

    const { user, authenticated, login } = usePrivy();

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        filterAndSort();
    }, [reports, filterCategory, sortBy]);

    const fetchReports = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports`);
            const data = await res.json();
            setReports(data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSort = () => {
        let filtered = [...reports];

        // Filter by category
        if (filterCategory !== 'all') {
            filtered = filtered.filter(r => r.metadata?.category === filterCategory);
        }

        // Sort
        if (sortBy === 'upvotes') {
            filtered.sort((a, b) => b.upvotes - a.upvotes);
        } else if (sortBy === 'comments') {
            filtered.sort((a, b) => b.commentCount - a.commentCount);
        } else {
            filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }

        setFilteredReports(filtered);
    };

    const handleVote = async (reportId: string, voteType: 'upvote' | 'downvote') => {
        if (!authenticated || !user) {
            login();
            return;
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/${reportId}/${voteType}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                }
            );

            if (res.ok) {
                const { upvotes, downvotes } = await res.json();
                setReports(prev => prev.map(r =>
                    r._id === reportId ? { ...r, upvotes, downvotes } : r
                ));
            }
        } catch (error) {
            console.error('Vote failed:', error);
        }
    };

    const fetchComments = async (reportId: string) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/${reportId}/comments`
            );
            const data = await res.json();
            setComments(prev => ({ ...prev, [reportId]: data }));
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const handleAddComment = async (reportId: string) => {
        if (!authenticated || !user) {
            login();
            return;
        }

        if (!commentText.trim()) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/${reportId}/comments`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, text: commentText })
                }
            );

            if (res.ok) {
                setCommentText('');
                fetchComments(reportId);
                setReports(prev => prev.map(r =>
                    r._id === reportId ? { ...r, commentCount: r.commentCount + 1 } : r
                ));
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const toggleReport = (reportId: string) => {
        if (selectedReport === reportId) {
            setSelectedReport(null);
        } else {
            setSelectedReport(reportId);
            if (!comments[reportId]) {
                fetchComments(reportId);
            }
        }
    };

    const timeAgo = (timestamp: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <main className="min-h-screen bg-[#020617] text-white font-sans selection:bg-primary/30 relative overflow-x-hidden">
            <Header />

            <div className="mx-auto max-w-[1600px] px-6 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Community Reports</h1>
                    <p className="text-zinc-400">Citizen-powered pollution watchdog. View, validate, and discuss environmental violations.</p>
                </div>

                {/* Stats & Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <BentoCard className="p-4 border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2 relative z-10">Total Reports</div>
                        <div className="text-3xl font-bold text-white font-mono relative z-10">{reports.length}</div>
                    </BentoCard>

                    <BentoCard className="p-4 col-span-2 border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Category</label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-cyan-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="industrial">Industrial</option>
                                    <option value="vehicular">Vehicular</option>
                                    <option value="construction">Construction</option>
                                    <option value="waste">Waste Burning</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-cyan-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="recent">Most Recent</option>
                                    <option value="upvotes">Most Upvoted</option>
                                    <option value="comments">Most Discussed</option>
                                </select>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard className="p-4 border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2 relative z-10">Active Now</div>
                        <div className="text-3xl font-bold text-emerald-500 font-mono relative z-10">{filteredReports.length}</div>
                    </BentoCard>
                </div>

                {/* Reports Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-zinc-500 font-mono animate-pulse">Loading reports...</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredReports.map((report) => {
                            const Icon = categoryIcons[report.metadata?.category] || ShieldCheck;
                            const isExpanded = selectedReport === report._id;
                            const userVote = authenticated && user ?
                                (report.upvotedBy?.includes(user.id) ? 'up' :
                                    report.downvotedBy?.includes(user.id) ? 'down' : null) : null;

                            return (
                                <motion.div
                                    key={report._id}
                                    layout
                                    className={cn(
                                        "relative overflow-hidden cursor-pointer",
                                        isExpanded && "lg:col-span-2 xl:col-span-3"
                                    )}
                                    onClick={() => toggleReport(report._id)}
                                >
                                    <BentoCard
                                        className={cn(
                                            "p-6 transition-all hover:scale-[1.02]",
                                            categoryColors[report.metadata?.category] || 'border-cyan-500/20'
                                        )}
                                    >
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                                    <Icon className="h-5 w-5 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white capitalize">{report.metadata?.category || 'Report'}</h3>
                                                    <p className="text-xs text-zinc-500">{timeAgo(report.timestamp)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-zinc-300 mb-4 line-clamp-2">
                                            {report.metadata?.description || 'No description provided'}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleVote(report._id, 'upvote'); }}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2 py-1 rounded transition-colors",
                                                        userVote === 'up' ? "bg-emerald-500/20 text-emerald-500" : "hover:bg-white/5 text-zinc-400"
                                                    )}
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                    <span className="text-sm font-mono">{report.upvotes || 0}</span>
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleVote(report._id, 'downvote'); }}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2 py-1 rounded transition-colors",
                                                        userVote === 'down' ? "bg-red-500/20 text-red-500" : "hover:bg-white/5 text-zinc-400"
                                                    )}
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                    <span className="text-sm font-mono">{report.downvotes || 0}</span>
                                                </button>

                                                <div className="flex items-center gap-1 text-zinc-400">
                                                    <MessageCircle className="h-4 w-4" />
                                                    <span className="text-sm font-mono">{report.commentCount || 0}</span>
                                                </div>
                                            </div>

                                            <a
                                                href={`https://ipfs.io/ipfs/${report.cid}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                IPFS
                                            </a>
                                        </div>

                                        {/* Expanded Section */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-6 pt-6 border-t border-white/10"
                                                >
                                                    {/* Full Description */}
                                                    <div className="mb-6">
                                                        <h4 className="text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wider">Full Report</h4>
                                                        <p className="text-zinc-300 leading-relaxed">{report.metadata?.description}</p>
                                                    </div>

                                                    {/* Metadata */}
                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className="text-xs">
                                                            <span className="text-zinc-500">Reporter:</span>
                                                            <div className="font-mono text-emerald-400 mt-1">{report.reporter.substring(0, 20)}...</div>
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="text-zinc-500">CID:</span>
                                                            <div className="font-mono text-cyan-400 mt-1">{report.cid.substring(0, 20)}...</div>
                                                        </div>
                                                    </div>

                                                    {/* Comments */}
                                                    <div>
                                                        <h4 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                            <MessageCircle className="h-4 w-4 text-cyan-500" />
                                                            Discussion ({report.commentCount || 0})
                                                        </h4>

                                                        {/* Comment List */}
                                                        <div className="space-y-3 mb-4">
                                                            {comments[report._id]?.map((comment) => (
                                                                <div key={comment._id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <span className="text-xs font-mono text-emerald-400">{comment.userId.substring(0, 15)}...</span>
                                                                        <span className="text-xs text-zinc-500">{timeAgo(comment.createdAt)}</span>
                                                                    </div>
                                                                    <p className="text-sm text-zinc-300">{comment.text}</p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Add Comment */}
                                                        {authenticated ? (
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={commentText}
                                                                    onChange={(e) => setCommentText(e.target.value)}
                                                                    placeholder="Add a comment..."
                                                                    className="flex-1 bg-zinc-900/50 border border-cyan-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleAddComment(report._id); }}
                                                                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg text-sm font-bold transition-colors"
                                                                >
                                                                    Post
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); login(); }}
                                                                className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-lg text-sm font-bold transition-colors border border-emerald-500/20"
                                                            >
                                                                Connect Wallet to Comment
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </BentoCard>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}

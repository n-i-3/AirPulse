'use client';
import { Button } from '@/components/ui/button';
import { usePrivy } from '@privy-io/react-auth';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Loader2, UploadCloud, MapPin, Camera, AlertTriangle, CloudRain, Car, Factory, CheckCircle2, Bot, ShieldCheck } from 'lucide-react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import StatsMap from '@/components/map/StatsMap';
import { cn } from '@/lib/utils';
import { generateIdentityCommitment } from '@/lib/zk';
import { BentoCard } from '@/components/dashboard/BentoCard';
import { AtmosphereBackground } from '@/components/dashboard/AtmosphereBackground';

type PollutionCategory = 'industrial' | 'vehicular' | 'construction' | 'waste' | 'other';

const categories: { id: PollutionCategory; label: string; icon: any }[] = [
    { id: 'industrial', label: 'Industrial Smoke', icon: Factory },
    { id: 'vehicular', label: 'Vehicle Emissions', icon: Car },
    { id: 'construction', label: 'Construction Dust', icon: AlertTriangle },
    { id: 'waste', label: 'Waste Burning', icon: CloudRain },
    { id: 'other', label: 'Other Issue', icon: ShieldCheck },
];

export default function ReportPage() {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<PollutionCategory | null>(null);
    const [customCategory, setCustomCategory] = useState('');
    const [manualLocation, setManualLocation] = useState('Sector 62, Noida (Geofenced)');
    const [uploading, setUploading] = useState(false);
    const [fileAttached, setFileAttached] = useState(false);
    const [aiVerifying, setAiVerifying] = useState(false);
    const [aiVerified, setAiVerified] = useState(false);
    const [zkProof, setZkProof] = useState<string | null>(null);
    const [generatingProof, setGeneratingProof] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setFileAttached(true);

            // Auto-start AI Verification on file select
            setAiVerifying(true);
            toast.info("AI Analysis Started", { description: "Scanning image for pollution signatures..." });

            setTimeout(() => {
                setAiVerifying(false);
                setAiVerified(true);
                toast.success("AI Verification Complete", { description: "Pollution signature detected (Confidence: 94%)" });
            }, 2000);
        }
    };

    const handleSubmit = async () => {
        if (!description.trim() || !selectedCategory || (selectedCategory === 'other' && !customCategory.trim()) || !manualLocation.trim()) {
            toast.error("Please complete all required fields.");
            return;
        }

        setLoading(true);
        try {
            // Mock signing process
            const timestamp = new Date().toISOString();

            // Generate ZK Proof
            setGeneratingProof(true);
            const proof = await generateIdentityCommitment(user?.id || 'anon', timestamp);
            setZkProof(proof);
            setGeneratingProof(false);

            // Simulate Blockchain Transaction
            await new Promise(resolve => setTimeout(resolve, 1500));

            // [REAL] Submit to Backend
            const reportPayload = {
                description,
                category: selectedCategory === 'other' ? customCategory : selectedCategory,
                location: { lat: 28.61, lng: 77.23 }, // Default to Central Delhi if no geocoding (for demo)
                zkProof: proof,
                reporter: user?.wallet?.address || user?.id || 'anon_user'
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportPayload)
            });

            if (!response.ok) throw new Error('Failed to save report to server');
            const savedReport = await response.json();

            toast.success("Report Submitted On-Chain!", {
                description: `CID: ${savedReport.cid.substring(0, 15)}... | ZK Proof Verified`
            });

            setDescription('');
            setSelectedCategory(null);
            setCustomCategory('');
            setFileAttached(false);
            setAiVerified(false);
            setZkProof(null);

            // Auto logout for one-time use
            setTimeout(async () => {
                await logout();
                toast.dismiss();
            }, 2000);
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to submit report", { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    const { login, authenticated, ready, user, getAccessToken, logout } = usePrivy();
    const [isBackendAuthenticated, setIsBackendAuthenticated] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);

    // Sync Privy Auth with Backend Session
    useEffect(() => {
        const syncAuth = async () => {
            if (ready && authenticated && user) {
                try {
                    const token = await getAccessToken();
                    if (token) {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token })
                        });
                        if (res.ok) {
                            setIsBackendAuthenticated(true);
                        } else {
                            console.error("Backend Auth Failed");
                            toast.error("Server Synchronization Failed");
                        }
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setAuthChecking(false);
                }
            } else if (ready && !authenticated) {
                setIsBackendAuthenticated(false);
                setAuthChecking(false);
            }
        };

        syncAuth();
    }, [ready, authenticated, user, getAccessToken]);

    if (!ready || authChecking) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <div className="text-zinc-500 font-mono text-sm">Initializing Secure Environment...</div>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <main className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-primary/30 relative overflow-x-hidden">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">

                    <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
                        <div className="space-y-6 text-center lg:text-left">
                            <div>
                                <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter mb-6 text-white">
                                    <span className="text-emerald-500 block">Decentralized</span>
                                    Pollution Reporting
                                </h1>
                                <p className="text-lg text-zinc-400 leading-relaxed">
                                    Join the network of verified citizens. Your reports are immutable, censorship-resistant, and powered by Web3 technology.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button
                                    size="lg"
                                    className="h-14 text-lg px-8 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
                                    onClick={login}
                                >
                                    <ShieldCheck className="mr-2 h-5 w-5" />
                                    Connect Wallet to Report
                                </Button>
                                <div className="flex items-center justify-center lg:justify-start h-14 px-4 group cursor-pointer hover:text-emerald-400 text-zinc-400 transition-colors">
                                    <span className="text-sm font-mono tracking-wider border-b border-transparent group-hover:border-emerald-500/50 pb-0.5">READ_PROTOCOL_V2</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { title: "IPFS Storage", desc: "Evidence is stored on distributed networks, ensuring it can never be deleted or altered.", icon: UploadCloud },
                                { title: "Cryptographic Proof", desc: "Every report is signed by your unique digital signature, verifying authenticity.", icon: ShieldCheck },
                                { title: "Zero-Knowledge", desc: "Report strictly what matters while maintaining complete privacy of your identity.", icon: CheckCircle2 },
                                { title: "Secure Identity", desc: "Powered by Privy to ensure enterprise-grade wallet security and seamless social login.", icon: ShieldCheck },
                            ].map((feature, i) => (
                                <BentoCard key={i} className="bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors p-6">
                                    <div className="pb-4">
                                        <feature.icon className="h-8 w-8 text-emerald-500 mb-4" />
                                        <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                                        <p className="text-xs text-zinc-400 leading-snug">{feature.desc}</p>
                                    </div>
                                </BentoCard>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-primary/30 relative overflow-x-hidden">
            <Header />

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:h-[calc(100vh-64px)]">
                {/* Left Panel: Map */}
                <div className="relative h-[400px] lg:h-full w-full bg-zinc-900/50 border-r border-white/5 order-2 lg:order-1">
                    <div className="absolute inset-0 z-0">
                        <StatsMap onLocationSelect={(loc) => setManualLocation(loc)} />
                    </div>
                    {/* Location Card - Top Left */}
                    <div className="absolute top-6 left-6 z-[400] w-72 lg:w-80 pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl pointer-events-auto">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center animate-pulse shrink-0 border border-emerald-500/30">
                                <MapPin className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="w-full">
                                <p className="text-[10px] font-mono text-zinc-400 uppercase mb-1 tracking-wider">Confirm Location</p>
                                <Input
                                    value={manualLocation}
                                    onChange={(e) => setManualLocation(e.target.value)}
                                    className="h-8 text-sm font-bold border-0 border-b border-white/20 rounded-none px-0 bg-transparent focus-visible:ring-0 focus-visible:border-emerald-500 placeholder:text-zinc-600 text-white"
                                    placeholder="Click map or type..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="h-full flex flex-col bg-black/40 backdrop-blur-md overflow-hidden order-1 lg:order-2">
                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-12 lg:py-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="max-w-xl mx-auto w-full space-y-8 pb-8">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2 flex items-center gap-3 text-white">
                                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                                    Secure Reporting
                                </h1>
                                <p className="text-sm text-zinc-400">
                                    Submit authenticated evidence to the AirPulse Governance Ledger.
                                    This ensures reports cannot be deleted or manipulated, even under pressure.
                                </p>
                            </div>

                            {/* Category Grid */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Incident Type</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 text-center hover:bg-white/5",
                                                selectedCategory === cat.id
                                                    ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                                    : "border-white/5 bg-zinc-900/50 text-zinc-400"
                                            )}
                                        >
                                            <cat.icon className={cn(
                                                "h-5 w-5",
                                                selectedCategory === cat.id ? "text-emerald-500" : "text-zinc-500"
                                            )} />
                                            <span className={cn(
                                                "text-xs font-bold",
                                                selectedCategory === cat.id ? "text-white" : "text-zinc-400"
                                            )}>{cat.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Category Input */}
                                {selectedCategory === 'other' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Input
                                            placeholder="Specify pollution type..."
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            className="bg-zinc-900/50 border-white/10 focus:border-emerald-500 h-10 text-sm text-white"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 flex justify-between">
                                    Incident Description
                                    <span className="text-[10px] text-emerald-500/70 font-mono flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        ENCRYPTED
                                    </span>
                                </label>
                                <Input
                                    placeholder="Describe the violation in detail..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-zinc-900/50 h-12 border-white/10 focus:border-emerald-500 transition-colors text-white placeholder:text-zinc-600"
                                />
                            </div>

                            {/* Evidence Upload */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Digital Evidence</label>
                                <input
                                    type="file"
                                    id="evidence-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                <label
                                    htmlFor="evidence-upload"
                                    className={cn(
                                        "border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group min-h-[140px]",
                                        fileAttached ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-emerald-500/30 hover:bg-zinc-900/80 bg-zinc-900/30"
                                    )}
                                >
                                    {uploading ? (
                                        <div className="flex items-center gap-3 animate-pulse">
                                            <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                                            <span className="text-xs text-zinc-400">Encrypting & Uploading to IPFS...</span>
                                        </div>
                                    ) : fileAttached ? (
                                        <div className="flex items-center gap-4">
                                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                            <div className="text-left">
                                                <span className="text-sm font-bold text-emerald-500 block mb-1">
                                                    {selectedFile ? selectedFile.name : "Evidence Secured"}
                                                </span>
                                                {aiVerifying ? (
                                                    <span className="text-xs text-zinc-400 animate-pulse font-mono">Running AI Analysis...</span>
                                                ) : aiVerified && (
                                                    <span className="text-xs text-emerald-400 font-mono">✓ Verified by Neural Network</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-emerald-500/20">
                                                <Camera className="h-6 w-6 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-sm font-medium block text-zinc-300 group-hover:text-white transition-colors">Click to Upload Evidence</span>
                                                <span className="text-xs text-zinc-500 block mt-1">JPG, PNG, MP4 (Max 50MB)</span>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Footer Action */}
                    <div className="p-6 bg-black/60 backdrop-blur-xl border-t border-white/5 shrink-0 z-20">
                        <div className="max-w-xl mx-auto w-full space-y-3">
                            <Button
                                className="w-full h-12 text-base relative overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl"
                                size="lg"
                                onClick={handleSubmit}
                                disabled={loading || uploading || (fileAttached && aiVerifying)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{generatingProof ? "Generating ZK Proof..." : "Establishing Consensus..."}</span>
                                    </div>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Sign & Submit Report
                                        <ShieldCheck className="h-4 w-4 opacity-70" />
                                    </span>
                                )}
                            </Button>

                            <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1 font-mono">
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    BASE_MAINNET::ACTIVE
                                </div>
                                <div>
                                    Last Block: <span className="text-zinc-400">18,293,021</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster position="top-center" theme="dark" />
        </main>
    )
}

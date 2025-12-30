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

    const handleFileUpload = () => {
        setUploading(true);
        // Simulate upload & AI scan
        setTimeout(() => {
            setUploading(false);
            setFileAttached(true);
            setAiVerifying(true);
            toast.info("AI Analysis Started", { description: "Scanning image for pollution signatures..." });

            setTimeout(() => {
                setAiVerifying(false);
                setAiVerified(true);
                toast.success("AI Verification Complete", { description: "Pollution signature detected (Confidence: 94%)" });
            }, 2000);
        }, 1500);
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

            // Simulate Blockchain Transaction
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast.success("Report Submitted On-Chain!", {
                description: `Tx Hash: 0x${Math.random().toString(16).slice(2, 42)}`
            });

            setDescription('');
            setSelectedCategory(null);
            setCustomCategory('');
            setFileAttached(false);
            setAiVerified(false);
            
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
                        const res = await fetch('http://localhost:5000/api/auth/login', {
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
            <div className="h-screen w-full bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!authenticated) {
        return (
            <main className="min-h-screen bg-transparent text-foreground flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                    {/* Background Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10" />

                    <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
                        <div className="space-y-6 text-center lg:text-left">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                                    <span className="text-primary block">Decentralized</span>
                                    Pollution Reporting
                                </h1>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Join the network of verified citizens. Your reports are immutable, censorship-resistant, and powered by Web3 technology.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button
                                    size="lg"
                                    className="h-12 text-lg px-8 shadow-primary/25 shadow-lg"
                                    onClick={login}
                                >
                                    <ShieldCheck className="mr-2 h-5 w-5" />
                                    Connect Wallet to Report
                                </Button>
                                <Button variant="outline" size="lg" className="h-12 text-lg px-8 border-primary/20 hover:bg-primary/5">
                                    Learn More
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { title: "IPFS Storage", desc: "Evidence is stored on distributed networks, ensuring it can never be deleted or altered.", icon: UploadCloud },
                                { title: "Cryptographic Proof", desc: "Every report is signed by your unique digital signature, verifying authenticity.", icon: ShieldCheck },
                                { title: "Smart Contracts", desc: "Automated governance triggers immediate action based on validated reports.", icon: Bot },
                                { title: "Zero-Knowledge", desc: "Report strictly what matters while maintaining complete privacy of your identity.", icon: CheckCircle2 },
                            ].map((feature, i) => (
                                <Card key={i} className="glass-card border-border/50 bg-background/20 hover:bg-background/40 transition-colors">
                                    <CardHeader className="pb-2">
                                        <feature.icon className="h-8 w-8 text-primary mb-2" />
                                        <CardTitle className="text-base">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground leading-snug">{feature.desc}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-transparent text-foreground flex flex-col">
            <Header />

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:h-[calc(100vh-64px)]">
                {/* Left Panel: Map */}
                <div className="relative h-[400px] lg:h-full w-full bg-muted/20 border-r border-border">
                    <div className="absolute inset-0 z-0">
                        <StatsMap onLocationSelect={(loc) => setManualLocation(loc)} />
                    </div>
                    {/* Location Card - Top Left */}
                    <div className="absolute top-4 left-4 z-[400] w-72 lg:w-80">
                        <Card className="glass-card border border-border shadow-lg">
                            <CardContent className="p-3 lg:p-4 flex items-center gap-3">
                                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse shrink-0">
                                    <MapPin className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                                </div>
                                <div className="w-full">
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Confirm Location</p>
                                    <Input
                                        value={manualLocation}
                                        onChange={(e) => setManualLocation(e.target.value)}
                                        className="h-7 text-xs lg:text-sm font-bold border-0 border-b border-primary/50 rounded-none px-0 bg-transparent focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                                        placeholder="Click map or type..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="h-full flex flex-col bg-background/30 backdrop-blur-sm overflow-hidden">
                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-8 lg:py-6">
                        <div className="max-w-xl mx-auto w-full space-y-4 pb-4">
                            <div>
                                <h1 className="text-xl lg:text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                                    Secure Reporting
                                </h1>
                                <p className="text-xs lg:text-sm text-muted-foreground">
                                    Submit authenticated evidence to the AirPulse Governance Ledger.
                                </p>
                            </div>

                            {/* Category Grid */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={cn(
                                                "p-2 lg:p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-1.5 text-center hover:bg-muted/50",
                                                selectedCategory === cat.id
                                                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                                    : "border-border bg-card/50"
                                            )}
                                        >
                                            <cat.icon className={cn(
                                                "h-4 w-4 lg:h-5 lg:w-5",
                                                selectedCategory === cat.id ? "text-primary" : "text-muted-foreground"
                                            )} />
                                            <span className={cn(
                                                "text-[10px] lg:text-xs font-medium",
                                                selectedCategory === cat.id ? "text-foreground" : "text-muted-foreground"
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
                                            className="bg-background/20 border-primary/50 focus:border-primary h-9 text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2 lg:space-y-3">
                                <label className="text-sm font-medium flex justify-between">
                                    Incident Description
                                    <span className="text-[10px] lg:text-xs text-muted-foreground font-mono">ENCRYPTED</span>
                                </label>
                                <Input
                                    placeholder="Describe the violation in detail..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-background/20 h-10 lg:h-12 border-border focus:border-primary/50 transition-colors"
                                />
                            </div>

                            {/* Evidence Upload */}
                            <div
                                onClick={handleFileUpload}
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group min-h-[100px]",
                                    fileAttached ? "border-green-500/50 bg-green-500/5" : "border-border hover:border-primary/50 hover:bg-muted/10"
                                )}
                            >
                                {uploading ? (
                                    <div className="flex items-center gap-3 animate-pulse">
                                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                        <span className="text-xs text-muted-foreground">Uploading...</span>
                                    </div>
                                ) : fileAttached ? (
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        <div className="text-left">
                                            <span className="text-xs font-medium text-green-500 block">Evidence Secured</span>
                                            {aiVerifying ? (
                                                <span className="text-[10px] text-primary animate-pulse">Scanning...</span>
                                            ) : aiVerified && (
                                                <span className="text-[10px] text-green-400">Verified by AI</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Camera className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-xs font-medium block">Upload Evidence</span>
                                            <span className="text-[10px] text-muted-foreground block">JPG, PNG, MP4</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sticky Footer Action */}
                    <div className="p-4 lg:p-6 bg-background/90 backdrop-blur-md border-t border-border shrink-0 z-20">
                        <div className="max-w-xl mx-auto w-full space-y-2">
                            <Button
                                className="w-full h-10 lg:h-12 text-sm lg:text-base relative overflow-hidden group shadow-lg shadow-primary/20"
                                size="lg"
                                onClick={handleSubmit}
                                disabled={loading || uploading || (fileAttached && aiVerifying)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Establishing Consensus...</span>
                                    </div>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Sign & Submit
                                        <ShieldCheck className="h-4 w-4 opacity-70" />
                                    </span>
                                )}
                            </Button>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                                <div className="flex items-center gap-1.5 font-mono text-green-500">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    BASE_MAINNET
                                </div>
                                <div className="font-mono">
                                    Tx: <span className="text-primary truncate max-w-[80px]">0x71C...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster position="top-center" />
        </main>
    )
}

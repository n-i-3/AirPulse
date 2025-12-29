'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Loader2, UploadCloud, MapPin } from 'lucide-react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

export default function ReportPage() {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!description.trim()) {
            toast.error("Please provide a description.");
            return;
        }

        setLoading(true);
        try {
            // Mock signing process
            const timestamp = new Date().toISOString();
            console.log('Report submitted:', { description, timestamp });

            toast.success("Report submitted!", {
                description: `Report logged successfully.`
            });
            setDescription('');
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to submit report", { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="container max-w-lg py-12">
                <Card className="border-white/10 shadow-2xl bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-primary" />
                            Submit Evidence
                        </CardTitle>
                        <CardDescription>
                            Submit pollution reports. (Privy wallet integration ready for production)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>Detected: Lat 28.61, Lng 77.20 (Simulated)</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                placeholder="e.g. Construction dust at intersection..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-background/50"
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                className="w-full relative overflow-hidden group"
                                size="lg"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Report
                            </Button>
                            <p className="text-xs text-center mt-3 text-muted-foreground">
                                Privy integration available (set NEXT_PUBLIC_PRIVY_APP_ID in .env)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Toaster />
        </main>
    )
}

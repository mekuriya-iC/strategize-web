"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Loader2,
    CheckCircle,
    XCircle,
    Target,
    ShieldCheck,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    Info
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface KPISubmission {
    kpiId: string;
    name: string;
    status: string;
    weight?: number;
    baseline?: number | string;
    submissionId?: string;
}

interface DivisionLevelApprovalDialogProps {
    children: React.ReactNode;
    submission: {
        submissionId: string;
        objective?: {
            objectiveId: string;
            name?: string;
            type?: string;
            parent?: { objectiveId: string; name?: string } | null;
        } | null;
        level?: string;
        submittedBy: {
            fullName: string;
        };
    };
    associatedKPIs: KPISubmission[];
    onApprove: (submissionId: string, reason: string, selectedKPIs?: string[]) => Promise<void>;
    onReject: (submissionId: string, reason: string) => Promise<void>;
}

export default function DivisionLevelApprovalDialog({
    children,
    submission,
    associatedKPIs,
    onApprove,
    onReject,
}: DivisionLevelApprovalDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [reason, setReason] = useState("");
    const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alignmentConfirmed, setAlignmentConfirmed] = useState(false);

    // Initialize
    useEffect(() => {
        if (open) {
            setStep(1);
            const allKPIIds = associatedKPIs.map((kpi) => kpi.kpiId);
            setSelectedKPIs(allKPIIds);
            setReason("");
            setAlignmentConfirmed(false);
        }
    }, [open, associatedKPIs]);

    const handleKPIToggle = (kpiId: string) => {
        setSelectedKPIs((prev) =>
            prev.includes(kpiId)
                ? prev.filter((id) => id !== kpiId)
                : [...prev, kpiId]
        );
    };

    const handleApprove = async () => {
        if (!alignmentConfirmed) {
            toast.error("Please confirm strategic alignment before approving.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onApprove(submission.submissionId, reason.trim(), selectedKPIs);
            toast.success("Division objective and KPIs approved!");
            setOpen(false);
        } catch (error) {
            console.error("Error approving:", error);
            toast.error("Failed to approve. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onReject(submission.submissionId, reason.trim());
            toast.success("Division objective rejected.");
            setOpen(false);
        } catch (error) {
            console.error("Error rejecting:", error);
            toast.error("Failed to reject. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const progressValue = (step / 3) * 100;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none rounded-2xl shadow-2xl">
                {/* Abstract Premium Header */}
                <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 text-white">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-400/30">
                                <ShieldCheck className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight">
                                    Division Level Approval
                                </DialogTitle>
                                <p className="text-blue-200/70 text-sm">
                                    Strategic Review & Alignment Workflow
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
                            Step {step} of 3
                        </Badge>
                    </div>
                    <Progress value={progressValue} className="h-1.5 bg-white/10" />
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                    <Target className="h-4 w-4" />
                                    Objective Details
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    {submission.objective?.name}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                                        Type: {submission.objective?.type}
                                    </Badge>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                        Level: {submission.level}
                                    </Badge>
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100">
                                        By: {submission.submittedBy.fullName}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        Associated KPIs
                                        <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                                            {selectedKPIs.length}/{associatedKPIs.length}
                                        </Badge>
                                    </h4>
                                    <div className="text-xs text-slate-500 italic">
                                        Select KPIs to include in this approval
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    {associatedKPIs.map((kpi) => (
                                        <div
                                            key={kpi.kpiId}
                                            className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${selectedKPIs.includes(kpi.kpiId)
                                                    ? "bg-white border-blue-200 shadow-md ring-1 ring-blue-100"
                                                    : "bg-slate-100/50 border-slate-200 hover:bg-white hover:border-blue-100"
                                                }`}
                                        >
                                            <Checkbox
                                                checked={selectedKPIs.includes(kpi.kpiId)}
                                                onCheckedChange={() => handleKPIToggle(kpi.kpiId)}
                                                className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-slate-900 truncate">
                                                    {kpi.name}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">WEIGHT</Badge> {kpi.weight ?? "N/A"}%
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">BASELINE</Badge> {kpi.baseline || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge
                                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${kpi.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                        kpi.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-slate-200 text-slate-600'
                                                    }`}
                                            >
                                                {kpi.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <ShieldCheck size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2 text-blue-200 text-xs font-bold uppercase tracking-widest">
                                        <Info className="h-4 w-4" />
                                        Parent Alignment Review
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">
                                        Review Strategic Objective
                                    </h3>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                        <p className="text-sm text-blue-100 mb-1">Aligned Corporate Objective:</p>
                                        <p className="text-lg font-semibold uppercase tracking-tight">
                                            {submission.objective?.parent?.name || "Corporate Strategic Goal 2024"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-4">
                                <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-amber-900 mb-1">Alignment Confirmation Required</h4>
                                    <p className="text-sm text-amber-800 leading-relaxed overflow-y-auto">
                                        As a division-level approver, you are responsible for ensuring that this objective directly contributes to the Corporate strategy. Review the predefined objectives above before proceeding.
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-start gap-4 ${alignmentConfirmed
                                        ? "bg-emerald-50 border-emerald-500 shadow-inner"
                                        : "bg-white border-slate-200 hover:border-blue-400"
                                    }`}
                                onClick={() => setAlignmentConfirmed(!alignmentConfirmed)}
                            >
                                <div className={`mt-1 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors ${alignmentConfirmed ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300"
                                    }`}>
                                    {alignmentConfirmed && <CheckCircle className="h-4 w-4 text-white" />}
                                </div>
                                <div>
                                    <h4 className={`font-bold mb-1 transition-colors ${alignmentConfirmed ? "text-emerald-900" : "text-slate-900"}`}>
                                        I confirm this objective aligns with Corporate Strategy
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        I have reviewed the predefined objectives and verified that the targets and metrics are consistent with our division's mandate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-2xl border transition-all ${!reason ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100"}`}>
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                                        <Badge variant="secondary">1</Badge> Review Summary
                                    </h4>
                                    <ul className="text-xs space-y-2 text-slate-600">
                                        <li className="flex justify-between">
                                            <span>Objective:</span>
                                            <span className="font-semibold text-slate-900">Verified</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>KPIs Selected:</span>
                                            <span className="font-semibold text-blue-600">{selectedKPIs.length}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Alignment:</span>
                                            <span className="font-semibold text-emerald-600">Confirmed</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                                        <Badge variant="secondary">2</Badge> Status
                                    </h4>
                                    <div className="flex flex-col items-center justify-center h-12">
                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-4 py-1">
                                            Final Review Required
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="final-reason" className="font-bold text-slate-900">
                                    Final Comments / Feedback
                                </Label>
                                <Textarea
                                    id="final-reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Provide feedback to the division manager. This will be visible in the history..."
                                    className="min-h-[120px] rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                />
                                <p className="text-xs text-slate-500">
                                    Tip: A detailed reason helps employees understand your decision and make adjustments if rejected.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-white border-t border-slate-100 flex items-center gap-3">
                    {step === 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="px-6 text-slate-500 hover:text-slate-900"
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            className="px-6 rounded-xl border-slate-200"
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    )}

                    <div className="flex-1" />

                    {step < 3 ? (
                        <Button
                            onClick={nextStep}
                            className="px-8 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-lg"
                        >
                            Continue to Step {step + 1}
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                disabled={isSubmitting || !reason}
                                onClick={handleReject}
                                className="px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Reject
                            </Button>
                            <Button
                                disabled={isSubmitting || !alignmentConfirmed}
                                onClick={handleApprove}
                                className="px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Final Approve
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

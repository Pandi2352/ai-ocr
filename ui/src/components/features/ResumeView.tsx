import React, { useState, useEffect } from 'react';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { resumeApi, ResumeResult } from '../../api/resume.api';
import { FileText, Briefcase, Calculator, CheckCircle, XCircle, ChevronRight, Loader2, Award, Zap, AlertTriangle, User, MapPin, Mail, Phone, Code, GraduationCap, Calendar, Laptop } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/ToastContext';

const ResumeView: React.FC = () => {
    const [files, setFiles] = useState<OCRResult[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [jdText, setJdText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ResumeResult | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const loadFiles = async () => {
            try {
                const res = await ocrApi.getList(1, 100);
                if (res.success) {
                    setFiles(res.data.data.filter((f: OCRResult) => f.status.overall === 'SUCCESS'));
                }
            } catch (error) {
                console.error(error);
            }
        };
        loadFiles();
    }, []);

    const handleAnalyze = async () => {
        if (!selectedResumeId || !jdText.trim()) {
            showToast('Please select a resume and enter a job description', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await resumeApi.analyze(selectedResumeId, jdText);
            if (res.success) {
                setResult(res.data);
                showToast('Analysis Complete', 'success');
            }
        } catch (error) {
            showToast('Analysis Failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400 border-green-500 shadow-green-900/50';
        if (score >= 50) return 'text-orange-400 border-orange-500 shadow-orange-900/50';
        return 'text-red-400 border-red-500 shadow-red-900/50';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Input & Header Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                     {/* Inputs */}
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase">Select Candidate (Resume)</label>
                           <select 
                               value={selectedResumeId}
                               onChange={(e) => setSelectedResumeId(e.target.value)}
                               className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 focus:ring-2 focus:ring-purple-500/30 outline-none"
                           >
                               <option value="">Choose a file...</option>
                               {files.map(f => (
                                   <option key={f._id} value={f._id}>{f.originalName}</option>
                               ))}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase">Job Description Target</label>
                            <input 
                               type="text"
                               value={jdText}
                               onChange={(e) => setJdText(e.target.value)}
                               placeholder="Enter JD or paste short description..." 
                               className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 focus:ring-2 focus:ring-purple-500/30 outline-none"
                            />
                        </div>
                    </div>
                    {/* Action Button */}
                     <button 
                        onClick={handleAnalyze} 
                        disabled={loading}
                        className={cn(
                            "w-full lg:w-48 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-6 md:mt-0",
                            loading ? "bg-gray-800 text-gray-500 cursor-wait" : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20"
                        )}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        {loading ? 'Analyzing...' : 'Match Profile'}
                    </button>
                </div>
            </div>

            {result && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* LEFT COLUMN: Candidate Profile */}
                    <div className="xl:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
                            <div className="relative flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 border-2 border-purple-500/30 shadow-lg">
                                    <User className="w-10 h-10 text-purple-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">{result.parsedProfile.personal_info.name}</h2>
                                <p className="text-sm text-gray-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {result.parsedProfile.personal_info.location}
                                </p>
                                
                                <div className="flex gap-2 mt-4 w-full">
                                    {result.parsedProfile.personal_info.email && (
                                        <div className="flex-1 bg-gray-950/50 p-2 rounded-lg border border-gray-800 flex flex-col items-center">
                                            <Mail className="w-4 h-4 text-gray-500 mb-1" />
                                            <span className="text-[10px] text-gray-300 truncate w-full text-center" title={result.parsedProfile.personal_info.email}>{result.parsedProfile.personal_info.email}</span>
                                        </div>
                                    )}
                                    {result.parsedProfile.personal_info.phone && (
                                        <div className="flex-1 bg-gray-950/50 p-2 rounded-lg border border-gray-800 flex flex-col items-center">
                                            <Phone className="w-4 h-4 text-gray-500 mb-1" />
                                            <span className="text-[10px] text-gray-300 truncate w-full text-center">{result.parsedProfile.personal_info.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                         {/* Skills Cloud */}
                         <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-200 uppercase mb-4 flex items-center gap-2">
                                <Code className="w-4 h-4 text-blue-400" /> Skills & Tools
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {result.parsedProfile.skills.hard_skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-blue-900/20 text-blue-300 border border-blue-800/30 rounded-md text-xs font-medium">
                                        {skill}
                                    </span>
                                ))}
                                {result.parsedProfile.skills.tools.map((tool, i) => (
                                    <span key={i} className="px-2 py-1 bg-cyan-900/20 text-cyan-300 border border-cyan-800/30 rounded-md text-xs font-medium">
                                        {tool}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Experience Timeline */}
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-200 uppercase mb-4 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-orange-400" /> Work History
                            </h3>
                            <div className="space-y-6 relative ml-3 border-l border-gray-800">
                                {result.parsedProfile.work_experience.map((exp, i) => (
                                    <div key={i} className="relative pl-6">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-700 border border-gray-900 ring-2 ring-gray-800" />
                                        <h4 className="text-sm font-bold text-white">{exp.title}</h4>
                                        <div className="text-xs text-purple-400 font-medium">{exp.company}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 mb-2">{exp.duration}</div>
                                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 hover:line-clamp-none cursor-help transition-all">
                                            {exp.summary}
                                        </p>
                                    </div>
                                ))}
                                {result.parsedProfile.projects.map((proj, i) => (
                                     <div key={`proj-${i}`} className="relative pl-6">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-700 border border-gray-900 ring-2 ring-gray-800" />
                                        <h4 className="text-sm font-bold text-white">{proj.name} <span className="text-[10px] font-normal text-gray-500 bg-gray-800 px-1 rounded ml-1">Project</span></h4>
                                        <div className="text-[10px] text-gray-500 mt-0.5 mb-2 flex gap-1">
                                            {proj.tech_stack.map(ts => <span key={ts}>{ts}</span>)}
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            {proj.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Analysis Dashboard */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Overall Verdict Card */}
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                             <div className={cn("absolute inset-0 opacity-10 blur-3xl", 
                                result.overallMatchScore > 50 ? "bg-green-500" : "bg-red-500"
                            )} />
                            
                            <div className="relative z-10 flex-1">
                                <h2 className="text-2xl font-bold text-white mb-2">Analysis Verdict</h2>
                                <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase border mb-4", 
                                    result.matchResult.final_verdict.recommendation === 'recommended' 
                                        ? "bg-green-900/30 text-green-400 border-green-800" 
                                        : "bg-red-900/30 text-red-400 border-red-800"
                                )}>
                                    {result.matchResult.final_verdict.recommendation || "Review Required"}
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-gray-700 pl-4">
                                    {result.matchResult.final_verdict.reasoning}
                                </p>
                            </div>

                            <div className={cn("relative w-40 h-40 rounded-full border-[12px] flex items-center justify-center shrink-0 shadow-2xl", getScoreColor(result.overallMatchScore))}>
                                <div className="text-center">
                                    <div className="text-4xl font-black text-white">{result.overallMatchScore}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Match Score</div>
                                </div>
                            </div>
                        </div>

                        {/* Gap Analysis */}
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-200 uppercase mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400" /> Gap Analysis
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Experience Analysis */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Experience Check</h4>
                                    <div className={cn("p-4 rounded-xl border flex flex-col gap-2",
                                        result.matchResult.experience_match.status === 'met' 
                                            ? "bg-green-900/10 border-green-500/20" 
                                            : "bg-red-900/10 border-red-500/20"
                                    )}>
                                        <div className="flex justify-between items-center text-sm font-bold text-gray-200">
                                            <span>Required: {result.matchResult.experience_match.required_years} yrs</span>
                                            <span>Actual: {result.matchResult.experience_match.candidate_years} yrs</span>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-snug">
                                            {result.matchResult.experience_match.gap_analysis}
                                        </p>
                                    </div>
                                </div>

                                {/* Skills Analysis */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Skill Gap Breakdown</h4>
                                    <div className="space-y-2">
                                         {/* Matched */}
                                         <div className="flex flex-wrap gap-1.5">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase mr-1 pt-1">Matched:</span>
                                            {result.matchResult.skill_breakdown.matched_hard_skills.length > 0 ? (
                                                result.matchResult.skill_breakdown.matched_hard_skills.map(s => (
                                                    <span key={s} className="px-2 py-0.5 bg-green-900/20 text-green-400 border border-green-800/30 rounded text-[10px] font-medium flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> {s}
                                                    </span>
                                                ))
                                            ) : <span className="text-xs text-gray-600 italic">None</span>}
                                         </div>

                                         {/* Missing */}
                                         <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-800">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase mr-1 pt-1">Missing:</span>
                                             {result.matchResult.skill_breakdown.missing_hard_skills.length > 0 ? (
                                                result.matchResult.skill_breakdown.missing_hard_skills.map(s => (
                                                    <span key={s} className="px-2 py-0.5 bg-red-900/20 text-red-400 border border-red-800/30 rounded text-[10px] font-medium flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" /> {s}
                                                    </span>
                                                ))
                                            ) : <span className="text-xs text-gray-600 italic">None</span>}
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* Education & Certs */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                                <h3 className="text-sm font-bold text-gray-200 uppercase mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-pink-400" /> Education
                                </h3>
                                <div className="space-y-3">
                                    {result.parsedProfile.education.map((edu, i) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5 shrink-0" />
                                            <div>
                                                <div className="text-sm font-bold text-white">{edu.degree}</div>
                                                <div className="text-xs text-gray-400">{edu.university}</div>
                                                <div className="text-[10px] text-gray-600 font-bold">{edu.year}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                             <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                                <h3 className="text-sm font-bold text-gray-200 uppercase mb-4 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-yellow-400" /> Certifications
                                </h3>
                                <div className="space-y-2">
                                    {result.parsedProfile.certifications.map((cert, i) => (
                                        <div key={i} className="p-2 bg-yellow-900/10 border border-yellow-700/20 rounded-lg text-xs text-yellow-200/80 flex gap-2">
                                            <Award className="w-3 h-3 shrink-0 mt-0.5 text-yellow-500" />
                                            {cert}
                                        </div>
                                    ))}
                                    {result.parsedProfile.certifications.length === 0 && (
                                        <div className="text-xs text-gray-600 italic">No certifications listed.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeView;

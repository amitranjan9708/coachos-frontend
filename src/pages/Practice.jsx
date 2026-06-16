import React, { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Clock, ArrowRight, CheckCircle2, XCircle, RotateCcw, BarChart3, HelpCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Practice() {
  const [mode, setMode] = useState("setup"); // setup | testing | insights
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Setup selections
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [questionCount, setQuestionCount] = useState("5");

  // Active Test state
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { q_id: selected_option / text }
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);

  // Selected Insight Attempt
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const loadMeta = async () => {
    try {
      const res = await api.get("/practice/meta");
      setSubjects(res.data.subjects || []);
      setTopics(res.data.topics || []);
    } catch (e) {
      toast.error("Failed to load metadata");
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get("/practice/history");
      setHistory(res.data || []);
    } catch (e) {
      toast.error("Failed to load history");
    }
  };

  useEffect(() => {
    loadMeta();
    loadHistory();
  }, []);

  // Timer effect for active test
  useEffect(() => {
    if (mode === "testing") {
      timerRef.current = setInterval(() => {
        setTimeSpent(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  const startTest = async () => {
    try {
      const body = {
        subject: selectedSubject === "all" ? "" : selectedSubject,
        topic: selectedTopic === "all" ? "" : selectedTopic,
        difficulty: difficulty,
        count: Number(questionCount)
      };
      const res = await api.post("/practice/generate", body);
      if (!res.data.questions || res.data.questions.length === 0) {
        toast.error("No questions found matching criteria.");
        return;
      }
      setQuestions(res.data.questions);
      setCurrentIdx(0);
      setAnswers({});
      setTimeSpent(0);
      setMode("testing");
      toast.success(`Practice test started with ${res.data.questions.length} questions!`);
    } catch (e) {
      toast.error("Failed to generate test");
    }
  };

  const submitTest = async () => {
    try {
      const body = {
        subject: selectedSubject === "all" ? "General" : selectedSubject,
        topic: selectedTopic === "all" ? "" : selectedTopic,
        answers: answers,
        time_spent_seconds: timeSpent
      };
      const res = await api.post("/practice/submit", body);
      if (res.data.ok) {
        setSelectedAttempt(res.data.result);
        setMode("insights");
        loadHistory();
        toast.success("Practice test submitted successfully!");
      }
    } catch (e) {
      toast.error("Failed to submit test");
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div data-testid="practice-page" className="max-w-6xl mx-auto space-y-6">
      
      {/* 1. SETUP / CONFIGURATOR VIEW */}
      {mode === "setup" && (
        <>
          <PageHeader
            eyebrow="Custom Study"
            title="Practice Portal"
            subtitle="Build a personalized practice test to test your skills and see instant insights."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Test Configuration Form */}
            <div className="swiss-card p-6 md:col-span-1 space-y-4">
              <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <RotateCcw size={18} className="text-indigo-600" />
                Configure Practice
              </h2>
              
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Chapter / Topic</Label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chapters</SelectItem>
                      {topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Number of Questions</Label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5", "10", "15", "20"].map(c => <SelectItem key={c} value={c}>{c} Questions</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={startTest} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 mt-4 rounded-sm flex items-center justify-center gap-2">
                Start Practicing <ArrowRight size={16} />
              </Button>
            </div>

            {/* Right Column: Practice History / Achievements */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Award size={18} className="text-indigo-600" />
                Previous Practice Attempts
              </h2>

              <div className="space-y-3">
                {history.map(attempt => {
                  const percent = attempt.total_questions > 0 
                    ? Math.round((attempt.correct_answers / attempt.total_questions) * 100) 
                    : 0;
                  return (
                    <div key={attempt.id} className="swiss-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{attempt.subject || "General"}</span>
                          {attempt.topic && <span className="pill pill-slate text-[10px]">{attempt.topic}</span>}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                          <span>Date: {new Date(attempt.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(attempt.time_spent_seconds)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-lg font-bold text-indigo-600">{attempt.score} / {attempt.max_score}</div>
                          <div className="text-xs text-slate-500">{percent}% Accuracy</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedAttempt(attempt); setMode("insights"); }} className="rounded-sm">
                          View Insights
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {history.length === 0 && (
<div className="empty-state empty-state text-center text-sm text-slate-500 py-12 border border-dashed border-slate-300 rounded-sm bg-white">
                    No practice sessions recorded yet. Build your first test on the left to start!
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. ACTIVE TEST TAKING PORTAL */}
      {mode === "testing" && (
        <div className="max-w-4xl mx-auto swiss-card p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Practice Session</span>
              <h1 className="font-display font-black text-xl text-slate-900 mt-1">
                {selectedSubject === "all" ? "General Science & Math" : selectedSubject}
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-sm font-mono font-bold">
              <Clock size={16} />
              <span>{formatTime(timeSpent)}</span>
            </div>
          </div>

          {/* Question Index Bar */}
          <div className="flex flex-wrap gap-1.5 py-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-9 h-9 rounded-sm border text-sm font-semibold flex items-center justify-center transition-colors ${
                  currentIdx === i
                    ? "bg-slate-900 border-slate-900 text-white"
                    : answers[questions[i].id]
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Current Question */}
          {questions[currentIdx] && (
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Question {currentIdx + 1} of {questions.length}</span>
                  {questions[currentIdx].difficulty && (
                    <span className={`pill ${questions[currentIdx].difficulty === "easy" ? "pill-green" : questions[currentIdx].difficulty === "hard" ? "pill-red" : "pill-amber"}`}>{questions[currentIdx].difficulty}</span>
                  )}
                  <span className="text-xs text-slate-400">{questions[currentIdx].marks} Marks</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{questions[currentIdx].text}</h3>
                {questions[currentIdx].image_url && (
                  <div className="mt-4">
                    <img src={api.defaults.baseURL + questions[currentIdx].image_url.replace('/api', '')} alt="Question Reference" className="max-h-64 rounded border border-slate-200" />
                  </div>
                )}
              </div>

              {/* Options */}
              {questions[currentIdx].type === "mcq" && questions[currentIdx].options?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {questions[currentIdx].options.map((opt, oIdx) => {
                    const isSelected = answers[questions[currentIdx].id] === opt;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => setAnswers({ ...answers, [questions[currentIdx].id]: opt })}
                        className={`p-4 border rounded-sm text-left transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold shadow-sm"
                            : "border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-mono text-indigo-600 mr-2">{"ABCD"[oIdx]}.</span> {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 max-w-md">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Answer</Label>
                  <Input
                    placeholder="Enter your exact numerical or short answer"
                    value={answers[questions[currentIdx].id] || ""}
                    onChange={e => setAnswers({ ...answers, [questions[currentIdx].id]: e.target.value })}
                    className="rounded-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Nav Actions */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-8">
            <Button
              variant="outline"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
              className="rounded-sm"
            >
              Previous
            </Button>
            
            {currentIdx < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm"
              >
                Next Question
              </Button>
            ) : (
              <Button
                onClick={submitTest}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-sm"
              >
                Submit Practice Test
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. RESULT INSIGHTS / ANALYSIS DASHBOARD */}
      {mode === "insights" && selectedAttempt && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setMode("setup")} className="flex items-center gap-2 rounded-sm text-slate-600">
              <ArrowLeft size={16} /> Back to Portal
            </Button>
            <span className="text-xs font-bold text-slate-400">ID: {selectedAttempt.id}</span>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="swiss-card p-5 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Practice Score</div>
              <div className="text-3xl font-black text-indigo-600 mt-2">{selectedAttempt.score} / {selectedAttempt.max_score}</div>
              <div className="text-xs text-slate-500 mt-1">Points Gained</div>
            </div>

            <div className="swiss-card p-5 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Accuracy</div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {selectedAttempt.total_questions > 0 
                  ? Math.round((selectedAttempt.correct_answers / selectedAttempt.total_questions) * 100) 
                  : 0}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Correct vs. Total</div>
            </div>

            <div className="swiss-card p-5 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Time</div>
              <div className="text-3xl font-black text-slate-900 mt-2">{formatTime(selectedAttempt.time_spent_seconds)}</div>
              <div className="text-xs text-slate-500 mt-1">Elapsed Time</div>
            </div>

            <div className="swiss-card p-5 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Metrics</div>
              <div className="flex items-center justify-center gap-4 mt-3">
                <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> {selectedAttempt.correct_answers}
                </span>
                <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
                  <XCircle size={14} /> {selectedAttempt.wrong_answers}
                </span>
                <span className="text-sm font-semibold text-slate-500 flex items-center gap-1">
                  <HelpCircle size={14} /> {selectedAttempt.total_questions - selectedAttempt.correct_answers - selectedAttempt.wrong_answers}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">Correct / Wrong / Left</div>
            </div>
          </div>

          {/* Deep Detailed Performance Analysis */}
          <div className="swiss-card p-6 space-y-6">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <BarChart3 size={18} className="text-indigo-600" />
              Detailed Breakdown & Solutions
            </h2>

            <div className="space-y-6">
              {Object.keys(selectedAttempt.answers).map((qId, idx) => {
                const studentAns = selectedAttempt.answers[qId];
                const qDetail = (selectedAttempt.questions_data || {})[qId] || {};
                
                const isCorrect = studentAns && qDetail.correct_answer && String(studentAns).trim().toLowerCase() === String(qDetail.correct_answer).trim().toLowerCase();
                const isUnanswered = !studentAns || String(studentAns).trim() === "";

                return (
                  <div key={qId} className={`p-5 rounded-sm border ${
                    isUnanswered 
                      ? "border-amber-200 bg-amber-50/10" 
                      : isCorrect 
                        ? "border-emerald-200 bg-emerald-50/10" 
                        : "border-red-200 bg-red-50/10"
                  } space-y-3`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                        <div className="font-semibold text-slate-800 text-base">{qDetail.text || "Question text not available"}</div>
                      </div>
                      <div>
                        {isUnanswered ? (
                          <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold">Skipped</span>
                        ) : isCorrect ? (
                          <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold">Correct</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 font-semibold">Incorrect</span>
                        )}
                      </div>
                    </div>

                    {qDetail.options && qDetail.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3">
                        {qDetail.options.map((opt, oIdx) => {
                          const isSelected = studentAns === opt;
                          const isCorrectOpt = qDetail.correct_answer === opt;
                          return (
                            <div 
                              key={oIdx} 
                              className={`p-2.5 border rounded-sm ${
                                isCorrectOpt 
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold" 
                                  : isSelected 
                                    ? "bg-red-50 border-red-300 text-red-800 font-semibold" 
                                    : "bg-white border-slate-200 text-slate-700"
                              }`}
                            >
                              <span className="font-mono mr-2">{"ABCD"[oIdx]}.</span> {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-xs space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                      <div><strong>Your Answer:</strong> <span className={isUnanswered ? "text-amber-700 font-medium" : isCorrect ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>{studentAns || "None"}</span></div>
                      <div><strong>Correct Answer:</strong> <span className="text-emerald-700 font-bold">{qDetail.correct_answer || "N/A"}</span></div>
                      {qDetail.explanation && (
                        <div className="mt-2 text-slate-600 bg-white p-3 border border-slate-100 rounded-sm">
                          <strong>Explanation:</strong> {qDetail.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="bg-indigo-50 border border-indigo-100 rounded-sm p-4 text-sm text-indigo-800">
                <strong>Tip for improvement:</strong> Review chapters with accuracy below 75%. Generate small, 5-question high-difficulty tests focused exclusively on those topics to master them quickly.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

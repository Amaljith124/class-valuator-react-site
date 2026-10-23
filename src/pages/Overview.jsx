import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    ArrowUpRight,
    AudioLines,
    CheckCircle2,
    Clock3,
    FileVideo,
    Plus,
    Sparkles,
    Video,
    Workflow
} from "lucide-react";
import Layout from "../components/Layout";
import { MetricCard, PageHeading, RowAction, ScoreRing, SectionTitle, StatusPill } from "../components/UI";
import { getEvaluations, getProcesses } from "../webservices/webservices";

function FlaskIcon()
{
    return <span className="flask-glyph">⚗</span>;
}

export default function Overview()
{
    const [evaluations, setEvaluations] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(function ()
    {
        Promise.all([getEvaluations(), getProcesses()])
            .then(function ([evaluationData, processData])
            {
                setEvaluations(evaluationData);
                setProcesses(processData);
            })
            .catch(function (requestError)
            {
                console.error("[Overview.load] load overview data failed", requestError);
                setError(requestError.message);
            });
    }, []);

    const completed = evaluations.filter(function (evaluation)
    {
        return evaluation.status === "completed";
    });
    const averageScore = completed.length
        ? Math.round(completed.reduce(function (total, evaluation)
        {
            return total + (evaluation.overall_score || 0);
        }, 0) / completed.length)
        : 0;
    const pendingCount = processes.filter(function (process)
    {
        return ["queued", "processing"].includes(process.status);
    }).length;

    return (
        <Layout>
            <PageHeading
                eyebrow="TUESDAY, OCTOBER 22, 2026"
                title="Good evening, Amaljith 👋"
                description="Here's what's happening across your classroom evaluations today."
                action={(
                    <button className="btn btn-primary" onClick={() => navigate("/upload")}>
                        <Plus size={17} /> New evaluation
                    </button>
                )}
            />
            {error && (
                <div className="inline-alert">
                    Could not load live data: {error}. Check your Node API connection.
                </div>
            )}

            <div className="welcome-banner">
                <div className="welcome-copy">
                    <div className="banner-kicker"><Sparkles size={14} /> YOUR CLASSROOM SNAPSHOT</div>
                    <h2>Better teaching starts with <em>better insights.</em></h2>
                    <p>Review lesson quality, discover what works, and make every class count.</p>
                    <button className="btn btn-light" onClick={() => navigate("/evaluations")}>
                        Explore evaluations <ArrowRight size={16} />
                    </button>
                </div>
                <div className="banner-illustration">
                    <div className="orb orb-one" />
                    <div className="orb orb-two" />
                    <div className="banner-card">
                        <div className="banner-card-top">
                            <span>AVERAGE TEACHING SCORE</span>
                            <span className="mini-trend"><ArrowUpRight size={13} /> 4.8%</span>
                        </div>
                        <div className="banner-score">{averageScore || 84}<small>/100</small></div>
                        <div className="mini-bars">
                            {[42, 64, 50, 78, 60, 87, 68, 95, 73, 88, 70, 100, 82, 92].map(function (height, index)
                            {
                                return <span key={index} style={{ height: `${height}%` }} />;
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="metrics-grid">
                <MetricCard
                    label="Total evaluations"
                    value={evaluations.length.toString().padStart(2, "0")}
                    change="12%"
                    subtext="vs. last month"
                    icon={FileVideo}
                />
                <MetricCard
                    label="Average teaching score"
                    value={`${averageScore || 84}/100`}
                    change="4.8%"
                    subtext="across completed lessons"
                    icon={Sparkles}
                    tone="purple"
                />
                <MetricCard
                    label="In the queue"
                    value={String(pendingCount).padStart(2, "0")}
                    subtext="Awaiting or processing"
                    icon={Clock3}
                    tone="amber"
                />
                <MetricCard
                    label="Completed analyses"
                    value={String(completed.length).padStart(2, "0")}
                    change="8%"
                    subtext="this month"
                    icon={CheckCircle2}
                    tone="blue"
                />
            </div>

            <div className="dashboard-grid">
                <section className="panel recent-panel">
                    <SectionTitle
                        title="Recent evaluations"
                        detail="Your latest classroom analysis"
                        action={(
                            <button className="text-button" onClick={() => navigate("/evaluations")}>
                                View all <ArrowRight size={14} />
                            </button>
                        )}
                    />
                    <div className="evaluation-list">
                        {evaluations.slice(0, 4).map(function (evaluation, index)
                        {
                            return (
                                <div className="evaluation-row" key={evaluation.evaluation_id}>
                                    <div className={`subject-icon subject-${index % 4}`}>
                                        {index === 0 ? <span>∑</span> : index === 1 ? <span>✳</span> : index === 2 ? <span>◷</span> : <span>⅟</span>}
                                    </div>
                                    <div className="eval-main">
                                        <strong>{evaluation.title}</strong>
                                        <span>{evaluation.teacher} <i /> {evaluation.subject} <i /> {evaluation.date}</span>
                                    </div>
                                    <div className="eval-score">
                                        {evaluation.overall_score ? (
                                            <><strong>{evaluation.overall_score}</strong><small>/100</small></>
                                        ) : (
                                            <span className="score-dash">—</span>
                                        )}
                                    </div>
                                    <StatusPill status={evaluation.status} />
                                    <RowAction onClick={() => navigate(`/evaluations/${evaluation.evaluation_id}`)} />
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="panel quick-panel">
                    <SectionTitle title="Quick actions" detail="Jump right into your workflow" />
                    <button className="quick-action" onClick={() => navigate("/upload")}>
                        <div className="quick-icon mint"><FileVideo size={19} /></div>
                        <div><strong>Upload a recording</strong><span>Start a new class evaluation</span></div>
                        <ArrowRight size={16} />
                    </button>
                    <button className="quick-action" onClick={() => navigate("/testing")}>
                        <div className="quick-icon purple"><FlaskIcon /></div>
                        <div><strong>Run a test session</strong><span>Validate each analysis module</span></div>
                        <ArrowRight size={16} />
                    </button>
                    <button className="quick-action" onClick={() => navigate("/processes")}>
                        <div className="quick-icon blue"><Workflow size={19} /></div>
                        <div><strong>Monitor processes</strong><span>Inspect queue and API logs</span></div>
                        <ArrowRight size={16} />
                    </button>
                    <div className="pipeline-status">
                        <div className="pipeline-heading">
                            <span>ANALYSIS PIPELINE</span>
                            <span className="pipeline-live"><span className="online-dot" /> OPERATIONAL</span>
                        </div>
                        <div className="pipeline-items">
                            <div><AudioLines size={16} /><span>Transcription</span><CheckCircle2 size={14} /></div>
                            <div><Sparkles size={16} /><span>Teaching analysis</span><CheckCircle2 size={14} /></div>
                            <div><Video size={16} /><span>Video &amp; screen</span><CheckCircle2 size={14} /></div>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}

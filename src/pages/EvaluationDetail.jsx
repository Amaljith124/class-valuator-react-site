import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowUpRight,
    AudioLines,
    CheckCircle2,
    ChevronRight,
    Download,
    FileText,
    Lightbulb,
    MessageCircle,
    Sparkles,
    Video
} from "lucide-react";
import Layout from "../components/Layout";
import { PageHeading, ScoreRing, StatusPill } from "../components/UI";
import { getEvaluation } from "../webservices/webservices";

function DimensionRow({ icon: Icon, color, title, score, barColor })
{
    return (
        <div className="dimension-row">
            <div className={`dimension-icon ${color}`}><Icon size={17} /></div>
            <div className="dimension-info">
                <strong>{title}</strong>
                <div className={`score-bar ${barColor || ""}`}>
                    <span style={{ width: `${score || 0}%` }} />
                </div>
            </div>
            <b>{score == null ? "—" : score}</b>
        </div>
    );
}

export default function EvaluationDetail()
{
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [error, setError] = useState("");

    useEffect(function ()
    {
        getEvaluation(id)
            .then(function (evaluation)
            {
                setItem(evaluation);
            })
            .catch(function (requestError)
            {
                console.error("[EvaluationDetail.load] load evaluation failed", {
                    evaluationId: id,
                    error: requestError
                });
                setError(requestError.message);
            });
    }, [id]);

    function exportReport()
    {
        const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `humaniti-${id}-evaluation.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    if (!item)
    {
        return (
            <Layout>
                <div className="detail-loading">{error || "Loading evaluation…"}</div>
            </Layout>
        );
    }
    else
    {
        const criteria = item.criteria || [];
        let scoreHeading = "Opportunity to improve";

        if (item.overall_score == null)
        {
            scoreHeading = "Not ready";
        }
        else if (item.overall_score >= 85)
        {
            scoreHeading = "Excellent teaching quality";
        }
        else if (item.overall_score >= 70)
        {
            scoreHeading = "Strong teaching foundation";
        }
        else
        {
            // Keep the default heading for scores below 70.
        }

        return (
            <Layout>
                <PageHeading
                    eyebrow="EVALUATION REPORT"
                    title={item.title}
                    description={`${item.teacher || "Teacher not specified"} · ${item.subject || "Subject not specified"} · ${item.date || "Date unavailable"}`}
                    action={(
                        <>
                            <button className="btn btn-secondary" onClick={() => navigate("/evaluations")}>
                                <ArrowLeft size={15} /> All evaluations
                            </button>
                            <button className="btn btn-primary" onClick={exportReport}>
                                <Download size={15} /> Export report
                            </button>
                        </>
                    )}
                />

                <div className="report-meta">
                    <StatusPill status={item.status} />
                    <span><FileText size={14} /> ID: {item.evaluation_id}</span>
                    <span><AudioLines size={14} /> Duration: {item.duration || "—"}</span>
                    <span>
                        <CheckCircle2 size={14} /> Evidence coverage: {item.coverage == null ? "—" : `${item.coverage}%`}
                    </span>
                </div>

                {item.status !== "completed" && (
                    <div className={item.status === "failed" ? "inline-alert" : "info-banner"}>
                        {item.status === "failed"
                            ? "This evaluation did not complete. Check the process log for the failure reason and retry the failed job."
                            : "This evaluation is still running. Scores will appear when the analysis pipeline completes."}
                        <button className="text-button" onClick={() => navigate("/processes")}>
                            Open process monitor <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                <div className="report-score-grid">
                    <section className="panel overall-score-panel">
                        <div className="eyebrow">OVERALL TEACHING SCORE</div>
                        <div className="overall-score-content">
                            <ScoreRing score={item.overall_score || 0} size={142} />
                            <div>
                                <h2>{scoreHeading}</h2>
                                <p>{item.summary || "The overall score will be available after analysis is complete."}</p>
                                <div className="score-scale">
                                    <span><i className="scale-dot low" /> Needs work</span>
                                    <span><i className="scale-dot mid" /> Developing</span>
                                    <span><i className="scale-dot high" /> Strong</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="panel dimension-panel">
                        <div className="eyebrow">SIGNAL QUALITY</div>
                        <h2>Analysis dimensions</h2>
                        <DimensionRow
                            icon={Sparkles}
                            color="mint"
                            title="Teaching effectiveness"
                            score={item.teaching_score}
                        />
                        <DimensionRow
                            icon={AudioLines}
                            color="blue"
                            title="Audio quality"
                            score={item.audio_score}
                            barColor="blue-bar"
                        />
                        <DimensionRow
                            icon={Video}
                            color="amber"
                            title="Video & screen quality"
                            score={item.video_score}
                            barColor="amber-bar"
                        />
                        <p className="dimension-note">
                            Audio and visual quality are reported separately and are not automatically blended into the teaching score.
                        </p>
                    </section>
                </div>

                <section className="panel criteria-panel">
                    <div className="section-title">
                        <div>
                            <h2>Teaching criteria</h2>
                            <p>Scores should be supported by evidence from the transcript or sampled frames.</p>
                        </div>
                        <span className="count-label">{criteria.length} / 8 criteria available</span>
                    </div>
                    {criteria.length ? (
                        criteria.map(function (criterion, index)
                        {
                            return (
                                <div className="criterion-row" key={criterion.name}>
                                    <div className="criterion-number">{String(index + 1).padStart(2, "0")}</div>
                                    <div className="criterion-main">
                                        <div className="criterion-title-row">
                                            <strong>{criterion.name}</strong>
                                            <span>{criterion.weight}% weight</span>
                                        </div>
                                        <div className="score-bar">
                                            <span style={{ width: `${criterion.score}%` }} />
                                        </div>
                                        <div className="evidence-quote">
                                            <MessageCircle size={14} />
                                            <span>{criterion.evidence || "No supporting evidence returned."}</span>
                                        </div>
                                    </div>
                                    <div className="criterion-score">
                                        <strong>{criterion.score}</strong>
                                        <small>/100</small>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="criteria-empty">
                            <div className="output-empty-icon"><FileText size={24} /></div>
                            <h3>Criterion breakdown unavailable</h3>
                            <p>When the backend returns evidence-backed criteria scores, each dimension will appear here.</p>
                        </div>
                    )}
                </section>

                <section className="improvement-panel">
                    <div className="improvement-icon"><Lightbulb size={22} /></div>
                    <div>
                        <div className="eyebrow">NEXT STEP</div>
                        <h2>Turn this evaluation into action</h2>
                        <p>Use the evidence to discuss one teaching strength and one practical improvement with the teacher.</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate("/testing")}>
                        Test a module <ArrowUpRight size={15} />
                    </button>
                </section>
            </Layout>
        );
    }
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Download,
    FileVideo,
    Filter,
    Search,
    SlidersHorizontal
} from "lucide-react";
import Layout from "../components/Layout";
import { EmptyState, PageHeading, ScoreRing, SectionTitle, StatusPill } from "../components/UI";
import { getEvaluations } from "../webservices/webservices";

export default function Evaluations()
{
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("newest");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(function ()
    {
        getEvaluations()
            .then(function (data)
            {
                setItems(data);
            })
            .catch(function (requestError)
            {
                console.error("[Evaluations.load] load evaluation list failed", requestError);
                setError(requestError.message);
            });
    }, []);

    const visible = items
        .filter(function (evaluation)
        {
            const searchText = `${evaluation.title} ${evaluation.teacher} ${evaluation.subject} ${evaluation.evaluation_id}`;
            return (status === "all" || evaluation.status === status) &&
                searchText.toLowerCase().includes(search.toLowerCase());
        })
        .sort(function (first, second)
        {
            if (sort === "score")
            {
                return (second.overall_score || 0) - (first.overall_score || 0);
            }
            else if (sort === "oldest")
            {
                return first.evaluation_id.localeCompare(second.evaluation_id);
            }
            else
            {
                return second.evaluation_id.localeCompare(first.evaluation_id);
            }
        });

    function exportEvaluations()
    {
        const blob = new Blob([JSON.stringify(visible, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "humaniti-evaluations.json";
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <Layout>
            <PageHeading
                eyebrow="CLASSROOM INSIGHTS / LIBRARY"
                title="Evaluations"
                description="Explore class recordings, teaching scores and evidence-backed feedback."
                action={(
                    <button className="btn btn-secondary" onClick={exportEvaluations}>
                        <Download size={16} /> Export JSON
                    </button>
                )}
            />
            {error && <div className="inline-alert">{error}</div>}

            <div className="eval-summary-strip">
                <div><span>ALL SESSIONS</span><strong>{items.length.toString().padStart(2, "0")}</strong></div>
                <div>
                    <span>COMPLETED</span>
                    <strong>{items.filter(item => item.status === "completed").length.toString().padStart(2, "0")}</strong>
                </div>
                <div>
                    <span>IN PROGRESS</span>
                    <strong>{items.filter(item => item.status === "processing").length.toString().padStart(2, "0")}</strong>
                </div>
                <div>
                    <span>NEEDS ATTENTION</span>
                    <strong>{items.filter(item => item.status === "failed").length.toString().padStart(2, "0")}</strong>
                </div>
            </div>

            <section className="panel evaluations-panel">
                <SectionTitle
                    title="All evaluations"
                    detail="Select a session to explore its results."
                    action={<span className="count-label">{visible.length} sessions</span>}
                />
                <div className="table-toolbar">
                    <div className="search-field">
                        <Search size={16} />
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search title, teacher or subject"
                        />
                    </div>
                    <div className="filter-select">
                        <Filter size={15} />
                        <select value={status} onChange={event => setStatus(event.target.value)}>
                            <option value="all">All statuses</option>
                            <option value="completed">Completed</option>
                            <option value="processing">In progress</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    <div className="filter-select">
                        <SlidersHorizontal size={15} />
                        <select value={sort} onChange={event => setSort(event.target.value)}>
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="score">Highest score</option>
                        </select>
                    </div>
                </div>

                {visible.length === 0 ? (
                    <EmptyState
                        icon={FileVideo}
                        title="No evaluations found"
                        description="Try changing your search or status filter."
                    />
                ) : (
                    <div className="evaluation-cards">
                        {visible.map(function (evaluation)
                        {
                            return (
                                <button
                                    className="evaluation-card"
                                    key={evaluation.evaluation_id}
                                    onClick={() => navigate(`/evaluations/${evaluation.evaluation_id}`)}
                                >
                                    <div className="evaluation-card-top">
                                        <div className="subject-icon subject-0"><FileVideo size={18} /></div>
                                        <StatusPill status={evaluation.status} />
                                    </div>
                                    <h3>{evaluation.title}</h3>
                                    <p>
                                        {evaluation.teacher || "Teacher not specified"} <i />
                                        {evaluation.subject || "Subject not specified"}
                                    </p>
                                    <div className="evaluation-card-meta">
                                        <span>{evaluation.date || evaluation.created_date || "Date unavailable"}</span>
                                        <span>{evaluation.duration || "Duration —"}</span>
                                    </div>
                                    <div className="evaluation-card-bottom">
                                        {evaluation.overall_score != null ? (
                                            <>
                                                <ScoreRing score={evaluation.overall_score} size={52} />
                                                <div className="card-score-label">
                                                    <strong>{evaluation.overall_score}<small>/100</small></strong>
                                                    <span>Overall score</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="card-pending">
                                                <span>Score unavailable</span>
                                                <small>{evaluation.status === "failed" ? "Review failure details" : "Analysis in progress"}</small>
                                            </div>
                                        )}
                                        <span className="card-open">View report <ArrowRight size={15} /></span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>
        </Layout>
    );
}

import React, { useEffect, useRef, useState } from "react";
import {
    ArrowDownToLine,
    ArrowRight,
    Check,
    ChevronDown,
    Clock3,
    Code2,
    FileJson,
    RefreshCw,
    Search,
    Server,
    X
} from "lucide-react";
import Layout from "../components/Layout";
import { MetricCard, PageHeading, SectionTitle, StatusPill } from "../components/UI";
import { connectProcessSocket, getProcess, getProcesses, retryProcess } from "../webservices/webservices";

function formatDate(value)
{
    if (!value)
    {
        return "—";
    }
    else
    {
        const date = new Date(value);

        if (Number.isNaN(date.getTime()))
        {
            return value;
        }
        else
        {
            return new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
                timeStyle: "short"
            }).format(date);
        }
    }
}

function ProcessDrawer({ process, loading, retrying, onRetry, onClose })
{
    const logs = process.logs || [];
    const requestPayload = process.request || null;
    const responsePayload = process.response || null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="process-drawer" onClick={event => event.stopPropagation()}>
                <div className="drawer-head">
                    <div>
                        <div className="eyebrow">PROCESS DETAILS</div>
                        <h2>{process.name || "Class recording analysis"}</h2>
                        <span className="drawer-id">
                            {process.process_id} · {process.evaluation_id}
                        </span>
                    </div>
                    <button className="icon-button" onClick={onClose} aria-label="Close">
                        <X size={19} />
                    </button>
                </div>

                <div className="drawer-status">
                    <StatusPill status={process.status} />
                    <span>{process.stage || process.status}</span>
                    {process.status === "failed" && (
                        <button className="btn btn-secondary btn-small" disabled={retrying} onClick={onRetry}>
                            <RefreshCw size={14} />
                            {retrying ? "Retrying…" : "Retry process"}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="detail-loading">Loading process details…</div>
                ) : (
                    <>
                        <SectionTitle title="Activity log" detail="Recorded analysis attempts" />
                        <div className="activity-list">
                            {logs.map((log, index) => (
                                <div className="activity-item" key={`${log.attempt_number || index}-${index}`}>
                                    <div className={`activity-dot ${log.type || "request"}`} />
                                    <div className="activity-content">
                                        <div>
                                            <strong>
                                                {log.type === "error" ? "Error" : `FastAPI ${log.type || "request"}`}
                                            </strong>
                                            <time>{formatDate(log.time)}</time>
                                        </div>
                                        <p>{log.message}</p>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="table-empty">No analysis attempts have been recorded yet.</div>
                            )}
                        </div>

                        <div className="payload-section">
                            <div className="payload-title">
                                <h3><Code2 size={16} /> Request payload</h3>
                                {requestPayload && (
                                    <button
                                        className="icon-button"
                                        title="Copy request"
                                        onClick={() => navigator.clipboard?.writeText(JSON.stringify(requestPayload, null, 2))}
                                    >
                                        <FileJson size={15} />
                                    </button>
                                )}
                            </div>
                            <pre className="json-block"><code>{requestPayload
                                ? JSON.stringify(requestPayload, null, 2)
                                : "No request payload recorded."}</code></pre>

                            <div className="payload-title response-title">
                                <h3><ArrowDownToLine size={16} /> Response payload</h3>
                                {process.status_code != null && <span className="http-tag">HTTP {process.status_code}</span>}
                            </div>
                            <pre className="json-block"><code>{responsePayload
                                ? JSON.stringify(responsePayload, null, 2)
                                : "No response payload recorded."}</code></pre>
                            {process.error_message && <p className="payload-note">{process.error_message}</p>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Processes()
{
    const [processes, setProcesses] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const detailRequestId = useRef(0);
    const selectedProcessRef = useRef(null);
    selectedProcessRef.current = selected;

    function refresh(showLoader = true)
    {
        if (showLoader)
        {
            setLoading(true);
        }
        else
        {
            // Keep the current process table visible during background refreshes.
        }
        setError("");

        return getProcesses()
            .then(function (data)
            {
                setProcesses(data);
            })
            .catch(function (requestError)
            {
                console.error("[Processes.refresh] load process list failed", requestError);
                setError(requestError.message);
            })
            .finally(function ()
            {
                if (showLoader)
                {
                    setLoading(false);
                }
                else
                {
                    // Background refreshes do not control the visible loader.
                }
            });
    }

    useEffect(function ()
    {
        refresh();

        const socket = connectProcessSocket();
        socket.on("connect", function ()
        {
            refresh(false);
        });
        socket.on("connect_error", function (socketError)
        {
            console.error("[Processes.socket] connect to process updates failed", socketError);
        });
        socket.on("process:update", function (update)
        {
            setProcesses(function (current)
            {
                return current.map(function (process)
                {
                    return process.process_id === update.process_id
                        ? { ...process, status: update.status }
                        : process;
                });
            });

            if (update.refresh === true)
            {
                refresh(false);
            }
            else
            {
                // This event only carries a partial update; no list refresh was requested.
            }

            if (selectedProcessRef.current?.process_id === update.process_id)
            {
                getProcess(update.process_id)
                    .then(function (details)
                    {
                        setSelected(function (current)
                        {
                            return current?.process_id === update.process_id ? details : current;
                        });
                    })
                    .catch(function (requestError)
                    {
                        console.error("[Processes.socket] reload updated process details failed", {
                            processId: update.process_id,
                            error: requestError
                        });
                    });
            }
            else
            {
                // No detail drawer is open for this process.
            }
        });
        socket.connect();

        return function ()
        {
            socket.disconnect();
        };
    }, []);

    function selectProcess(process)
    {
        detailRequestId.current += 1;
        const requestId = detailRequestId.current;
        setSelected(process);
        setLoadingDetails(true);
        setError("");

        getProcess(process.process_id)
            .then(function (details)
            {
                if (requestId === detailRequestId.current)
                {
                    setSelected(details);
                }
                else
                {
                    // A newer selection has already replaced this response.
                }
            })
            .catch(function (requestError)
            {
                console.error("[Processes.selectProcess] load process details failed", {
                    processId: process.process_id,
                    error: requestError
                });
                if (requestId === detailRequestId.current)
                {
                    setError(requestError.message);
                }
                else
                {
                    // Ignore an error from a process that is no longer selected.
                }
            })
            .finally(function ()
            {
                if (requestId === detailRequestId.current)
                {
                    setLoadingDetails(false);
                }
                else
                {
                    // Keep the detail loader attached to the latest selection.
                }
            });
    }

    function closeDetails()
    {
        detailRequestId.current += 1;
        setSelected(null);
        setLoadingDetails(false);
    }

    function retry()
    {
        setRetrying(true);
        setError("");

        retryProcess(selected.process_id)
            .then(function ()
            {
                getProcess(selected.process_id)
                    .then(function (details)
                    {
                        setSelected(details);
                        refresh(false)
                            .then(function ()
                            {
                                // The process list has been refreshed.
                            })
                            .catch(function (refreshError)
                            {
                                console.error("[Processes.retry] refresh process list after retry failed", {
                                    processId: selected.process_id,
                                    error: refreshError
                                });
                                setError(refreshError.message);
                            });
                    })
                    .catch(function (requestError)
                    {
                        console.error("[Processes.retry] reload retried process failed", {
                            processId: selected.process_id,
                            error: requestError
                        });
                        setError(requestError.message);
                    });
            })
            .catch(function (requestError)
            {
                console.error("[Processes.retry] retry process failed", {
                    processId: selected.process_id,
                    error: requestError
                });
                setError(requestError.message);
            })
            .finally(function ()
            {
                setRetrying(false);
            });
    }

    const filtered = processes.filter(function (process)
    {
        const searchText = `${process.name || ""} ${process.process_id} ${process.evaluation_id}`.toLowerCase();
        return (filter === "all" || process.status === filter) && searchText.includes(search.toLowerCase());
    });
    const processingCount = processes.filter(process => process.status === "processing").length;
    const completedCount = processes.filter(process => ["processed", "completed"].includes(process.status)).length;
    const failedCount = processes.filter(process => process.status === "failed").length;

    return (
        <Layout>
            <PageHeading
                eyebrow="SYSTEM / JOB QUEUE"
                title="Process monitor"
                description="Track background jobs and inspect the requests sent to the analysis server."
                action={(
                    <button className="btn btn-secondary" onClick={refresh} disabled={loading}>
                        <RefreshCw size={15} /> {loading ? "Refreshing…" : "Refresh"}
                    </button>
                )}
            />
            {error && <div className="inline-alert">{error}</div>}

            <div className="metrics-grid process-metrics">
                <MetricCard label="Total processes" value={String(processes.length).padStart(2, "0")} subtext="Loaded from Node API" icon={Server} />
                <MetricCard label="Processing" value={String(processingCount).padStart(2, "0")} subtext="Currently running" icon={Clock3} tone="amber" />
                <MetricCard label="Completed" value={String(completedCount).padStart(2, "0")} subtext="Successfully finished" icon={Check} tone="blue" />
                <MetricCard label="Failed" value={String(failedCount).padStart(2, "0")} subtext="Need attention" icon={Code2} tone="purple" />
            </div>

            <section className="panel table-panel">
                <SectionTitle
                    title="Background process log"
                    detail="pg-boss queue · FastAPI request / response audit"
                    action={<span className="live-tag"><span className="online-dot" /> NODE API</span>}
                />
                <div className="table-toolbar">
                    <div className="search-field">
                        <Search size={16} />
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search process or evaluation ID"
                        />
                    </div>
                    <div className="filter-select">
                        <select value={filter} onChange={event => setFilter(event.target.value)}>
                            <option value="all">All statuses</option>
                            <option value="queued">Queued</option>
                            <option value="processing">Processing</option>
                            <option value="processed">Completed</option>
                            <option value="failed">Failed</option>
                        </select>
                        <ChevronDown size={14} />
                    </div>
                </div>

                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr><th>PROCESS</th><th>STATUS</th><th>STAGE</th><th>CREATED</th><th>DURATION</th><th /></tr>
                        </thead>
                        <tbody>
                            {filtered.map(process => (
                                <tr key={process.process_id} onClick={() => selectProcess(process)} className="clickable-row">
                                    <td>
                                        <div className="process-name">
                                            <div className="table-file-icon"><FileJson size={17} /></div>
                                            <div>
                                                <strong>{process.name || "Class recording analysis"}</strong>
                                                <span>{process.process_id} · {process.evaluation_id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><StatusPill status={process.status} /></td>
                                    <td><span className="stage-text">{process.stage || process.status}</span></td>
                                    <td className="muted-cell">{formatDate(process.created_at)}</td>
                                    <td className="duration-cell">{process.duration || "—"}</td>
                                    <td>
                                        <button
                                            className="row-action"
                                            onClick={event =>
                                            {
                                                event.stopPropagation();
                                                selectProcess(process);
                                            }}
                                            aria-label={`Inspect process ${process.process_id}`}
                                        >
                                            <ArrowRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="table-empty">Loading process records…</div>}
                    {!loading && filtered.length === 0 && (
                        <div className="table-empty">
                            {processes.length === 0 ? "No process records are available." : "No processes match your filters."}
                        </div>
                    )}
                </div>
                <div className="table-foot">
                    <span>Showing <b>{filtered.length}</b> of <b>{processes.length}</b> processes</span>
                    <span>Click a row to load its attempt logs and payloads</span>
                </div>
            </section>

            {selected && (
                <ProcessDrawer
                    process={selected}
                    loading={loadingDetails}
                    retrying={retrying}
                    onRetry={retry}
                    onClose={closeDetails}
                />
            )}
        </Layout>
    );
}

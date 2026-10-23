import React from "react";
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileVideo,
    LoaderCircle
} from "lucide-react";

export function PageHeading({ eyebrow, title, description, action })
{
    return (
        <div className="page-heading">
            <div>
                <div className="eyebrow">{eyebrow}</div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            {action && <div className="heading-action">{action}</div>}
        </div>
    );
}

export function StatusPill({ status })
{
    const normalizedStatus = String(status || "pending").toLowerCase();
    const labels = {
        completed: "Completed",
        processed: "Completed",
        processing: "In progress",
        queued: "Queued",
        pending: "Pending",
        failed: "Failed"
    };
    const icons = {
        completed: CheckCircle2,
        processed: CheckCircle2,
        failed: AlertTriangle,
        processing: LoaderCircle
    };
    const label = labels[normalizedStatus] || status;
    const Icon = icons[normalizedStatus] || Clock3;

    return (
        <span className={`status-pill ${normalizedStatus}`}>
            <Icon size={13} className={normalizedStatus === "processing" ? "spin" : ""} />
            {label}
        </span>
    );
}

export function ScoreRing({ score = 0, size = 64 })
{
    const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

    return (
        <div
            className="score-ring"
            style={{ "--score": `${safeScore * 3.6}deg`, width: size, height: size }}
        >
            <div className="score-ring-inner">
                <strong>{safeScore}</strong>
                <small>/100</small>
            </div>
        </div>
    );
}

export function MetricCard({ label, value, change, icon: Icon, tone = "mint", subtext })
{
    let changeIcon = null;
    let changeClass = "positive";

    if (change)
    {
        if (change.startsWith("-"))
        {
            changeIcon = ArrowDownRight;
            changeClass = "negative";
        }
        else
        {
            changeIcon = ArrowUpRight;
        }
    }
    else
    {
        // This metric has no change indicator.
    }
    const ChangeIcon = changeIcon;

    return (
        <div className="metric-card">
            <div className="metric-top">
                <span>{label}</span>
                <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-foot">
                {change && (
                    <span className={changeClass}>
                        <ChangeIcon size={14} /> {change}
                    </span>
                )}
                <span>{subtext}</span>
            </div>
        </div>
    );
}

export function EmptyState({ icon: Icon = FileVideo, title, description, action })
{
    return (
        <div className="empty-state">
            <div className="empty-icon"><Icon size={25} /></div>
            <h3>{title}</h3>
            <p>{description}</p>
            {action}
        </div>
    );
}

export function SectionTitle({ title, detail, action })
{
    return (
        <div className="section-title">
            <div>
                <h2>{title}</h2>
                {detail && <p>{detail}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

export function RowAction({ onClick, label = "Open details" })
{
    return (
        <button className="row-action" onClick={onClick} aria-label={label}>
            <ChevronRight size={17} />
        </button>
    );
}

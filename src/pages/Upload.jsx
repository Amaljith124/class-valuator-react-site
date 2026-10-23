import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    CloudUpload,
    FileVideo,
    Info,
    TriangleAlert,
    ShieldCheck,
    X
} from "lucide-react";
import Layout from "../components/Layout";
import { PageHeading } from "../components/UI";
import { uploadRecording } from "../webservices/webservices";

export default function Upload()
{
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [title, setTitle] = useState("");
    const [teacher, setTeacher] = useState("");
    const [subject, setSubject] = useState("");
    const [notes, setNotes] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    function selectFile(selectedFile)
    {
        if (!selectedFile)
        {
            // Keep the current selection when the file picker is cancelled.
        }
        else if (!selectedFile.type.startsWith("video/") && !selectedFile.type.startsWith("audio/"))
        {
            setError("Please choose a video or audio recording.");
        }
        else if (selectedFile.size > 2 * 1024 * 1024 * 1024)
        {
            setError("This demo UI accepts files up to 2 GB. Adjust the limit to match your backend and storage configuration.");
        }
        else
        {
            setError("");
            setFile(selectedFile);

            if (!title)
            {
                setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
            }
            else
            {
                // Keep the title already entered by the user.
            }
        }
    }

    useEffect(function ()
    {
        function warnBeforeLeaving(event)
        {
            event.preventDefault();
            event.returnValue = "";
        }

        if (busy)
        {
            window.addEventListener("beforeunload", warnBeforeLeaving);
        }
        else
        {
            // No upload is running, so leaving the page is safe.
        }

        return function ()
        {
            window.removeEventListener("beforeunload", warnBeforeLeaving);
        };
    }, [busy]);

    function submit(event)
    {
        event.preventDefault();

        if (!file)
        {
            setError("Choose a class recording to continue.");
        }
        else
        {
            setBusy(true);
            setProgress(0);
            setError("");

            uploadRecording(file, { title: title, teacher: teacher, subject: subject, notes: notes }, setProgress)
                .then(function (data)
                {
                    setResult(data);
                    setBusy(false);
                })
                .catch(function (requestError)
                {
                    console.error("[Upload.submit] upload recording failed", requestError);
                    setError(requestError.message);
                    setBusy(false);
                });
        }
    }

    function removeFile(event)
    {
        event.stopPropagation();
        setFile(null);
        setResult(null);
    }

    function handleDrop(event)
    {
        event.preventDefault();
        setDragging(false);
        selectFile(event.dataTransfer.files?.[0]);
    }

    function handleKeyDown(event)
    {
        if (event.key === "Enter" || event.key === " ")
        {
            inputRef.current?.click();
        }
        else
        {
            // Ignore keys that do not activate the file selector.
        }
    }

    return (
        <Layout>
            <PageHeading
                eyebrow="EVALUATION WORKFLOW / STEP 01"
                title="Upload a recording"
                description="Add a class recording to start your classroom analysis."
                action={(
                    <button className="btn btn-ghost" onClick={() => navigate("/")}>
                        <ArrowLeft size={16} /> Back to overview
                    </button>
                )}
            />

            <div className="upload-layout">
                <form className="panel upload-form" onSubmit={submit}>
                    <div className="form-section-head">
                        <div>
                            <h2>Recording details</h2>
                            <p>Give this session a little context before analysis.</p>
                        </div>
                        <span className="step-label">STEP 1 OF 1</span>
                    </div>

                    <label className="field-label">
                        Recording file <span className="required">*</span>
                    </label>
                    <div
                        className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
                        onDragOver={event =>
                        {
                            event.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="video/*,audio/*"
                            hidden
                            onChange={event => selectFile(event.target.files?.[0])}
                        />
                        {file ? (
                            <>
                                <div className="drop-icon success"><CheckCircle2 size={25} /></div>
                                <strong className="file-name">{file.name}</strong>
                                <span>{(file.size / 1024 / 1024).toFixed(1)} MB · Ready to upload</span>
                                <button className="remove-file" type="button" onClick={removeFile}>
                                    <X size={15} /> Remove file
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="drop-icon"><CloudUpload size={26} /></div>
                                <strong>Drop your recording here, or <span>browse files</span></strong>
                                <p>MP4, MOV, WebM, MP3, WAV or M4A</p>
                                <small>Maximum size: 2 GB · Video or audio</small>
                            </>
                        )}
                    </div>

                    <div className="form-grid">
                        <div className="field">
                            <label className="field-label" htmlFor="title">
                                Session title <span className="required">*</span>
                            </label>
                            <input
                                id="title"
                                required
                                value={title}
                                onChange={event => setTitle(event.target.value)}
                                placeholder="e.g. Introduction to Algebra"
                            />
                        </div>
                        <div className="field">
                            <label className="field-label" htmlFor="teacher">Teacher name</label>
                            <input
                                id="teacher"
                                value={teacher}
                                onChange={event => setTeacher(event.target.value)}
                                placeholder="e.g. Ms. Nair"
                            />
                        </div>
                        <div className="field">
                            <label className="field-label" htmlFor="subject">Subject</label>
                            <select id="subject" value={subject} onChange={event => setSubject(event.target.value)}>
                                <option value="">Choose a subject</option>
                                <option>Mathematics</option>
                                <option>Science</option>
                                <option>Biology</option>
                                <option>Physics</option>
                                <option>Chemistry</option>
                                <option>English</option>
                                <option>History</option>
                                <option>Computer Science</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="field">
                            <label className="field-label" htmlFor="notes">
                                Class notes <span className="optional">Optional</span>
                            </label>
                            <input
                                id="notes"
                                value={notes}
                                onChange={event => setNotes(event.target.value)}
                                placeholder="Grade, topic or context"
                            />
                        </div>
                    </div>

                    {busy && (
                        <div className="warning-alert" role="alert">
                            <TriangleAlert size={16} />
                            <span>
                                <strong>Upload in progress{progress > 0 ? ` (${progress}%)` : ""}.</strong> Please don't refresh, close this tab or go to another page until it finishes.
                            </span>
                        </div>
                    )}
                    {error && <div className="inline-alert"><Info size={16} />{error}</div>}
                    {result && (
                        <div className="success-alert">
                            <CheckCircle2 size={18} />
                            <div>
                                <strong>Recording submitted successfully</strong>
                                <p>Evaluation {result.evaluation_id} was added to the process queue.</p>
                                <button type="button" className="text-button" onClick={() => navigate("/processes")}>
                                    View process <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="form-footer">
                        <div className="privacy-note">
                            <ShieldCheck size={16} />
                            <span>Your recording is processed privately within your workspace.</span>
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={busy || !!result}>
                            {busy ? (progress > 0 && progress < 100 ? `Uploading ${progress}%` : "Submitting…") : result ? "Submitted" : "Upload & analyze"}
                            {!busy && !result && <ArrowRight size={16} />}
                        </button>
                    </div>
                </form>

                <aside className="upload-aside">
                    <div className="aside-card accent-card">
                        <div className="aside-card-icon"><Info size={19} /></div>
                        <h3>What happens next?</h3>
                        <p>Your recording moves through a structured analysis pipeline.</p>
                        <div className="steps-list">
                            <div className="step-item">
                                <span>01</span>
                                <div><strong>Upload &amp; queue</strong><small>Securely store the recording and create an evaluation.</small></div>
                            </div>
                            <div className="step-item">
                                <span>02</span>
                                <div><strong>Analyze the lesson</strong><small>Transcription, teaching criteria, audio and sampled video frames.</small></div>
                            </div>
                            <div className="step-item">
                                <span>03</span>
                                <div><strong>Review the results</strong><small>Explore scores, evidence and improvement opportunities.</small></div>
                            </div>
                        </div>
                    </div>

                    <div className="aside-card supported-card">
                        <div className="supported-head"><FileVideo size={18} /><strong>Supported formats</strong></div>
                        <div className="format-row"><span>Video</span><div>MP4 <i /> MOV <i /> WebM</div></div>
                        <div className="format-row"><span>Audio</span><div>MP3 <i /> WAV <i /> M4A</div></div>
                        <p>Analysis time depends on recording length, frame sampling and model response times.</p>
                    </div>
                </aside>
            </div>
        </Layout>
    );
}

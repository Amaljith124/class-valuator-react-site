import React, { useRef, useState } from "react";
import {
    ArrowRight,
    AudioLines,
    CheckCircle2,
    ChevronRight,
    CirclePlay,
    FileAudio,
    FileVideo,
    FlaskConical,
    Info,
    LoaderCircle,
    Sparkles,
    Video,
    X
} from "lucide-react";
import Layout from "../components/Layout";
import { PageHeading, StatusPill } from "../components/UI";
import { runTest } from "../webservices/webservices";

const tests = [
    {
        id: "transcription",
        name: "Transcription",
        description: "Convert speech into timestamped transcript segments.",
        icon: AudioLines,
        color: "mint",
        output: "Timestamped transcript, duration and language metadata."
    },
    {
        id: "teaching-effectiveness",
        name: "Teaching effectiveness",
        description: "Score teaching criteria with evidence from transcript.",
        icon: Sparkles,
        color: "purple",
        output: "Criterion scores, evidence quotes and coverage."
    },
    {
        id: "audio-quality",
        name: "Audio quality",
        description: "Measure silence, clipping, loudness and noise proxies.",
        icon: FileAudio,
        color: "blue",
        output: "Audio metrics and a quality score."
    },
    {
        id: "video-screen",
        name: "Video & shared screen",
        description: "Analyze sampled frames for visual and screen quality.",
        icon: Video,
        color: "amber",
        output: "Frame observations, readability and visual quality score."
    }
];

export default function Testing()
{
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("Test classroom recording");
    const [active, setActive] = useState("transcription");
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState({});
    const [error, setError] = useState("");
    const fileInput = useRef(null);
    const activeTest = tests.find(test => test.id === active);
    const activeResult = results[active];

    function run()
    {
        if (!file)
        {
            setError("Choose a recording first.");
        }
        else
        {
            setRunning(true);
            setError("");

            runTest(active, file, { title: title })
                .then(function (result)
                {
                    setResults(function (previousResults)
                    {
                        return { ...previousResults, [active]: result };
                    });
                    setRunning(false);
                })
                .catch(function (requestError)
                {
                    console.error("[Testing.run] run analysis module failed", {
                        testType: active,
                        error: requestError
                    });
                    setError(requestError.message);
                    setRunning(false);
                });
        }
    }

    function selectFile(event)
    {
        setFile(event.target.files?.[0] || null);
        setError("");
    }

    function clearFile(event)
    {
        event.stopPropagation();
        setFile(null);
    }

    function copyResult()
    {
        navigator.clipboard?.writeText(JSON.stringify(activeResult, null, 2));
    }

    return (
        <Layout>
            <PageHeading
                eyebrow="DEVELOPER TOOLS / VALIDATION"
                title="Testing session"
                description="Validate each analysis module independently before running the full pipeline."
                action={<span className="testing-mode"><span className="online-dot" /> ISOLATED TEST MODE</span>}
            />
            <div className="testing-layout">
                <section className="testing-main">
                    <div className="panel test-file-panel">
                        <div className="test-section-title">
                            <div>
                                <h2>Test input</h2>
                                <p>Use one recording to compare individual module outputs.</p>
                            </div>
                            <span className="step-label">SHARED INPUT</span>
                        </div>

                        <div
                            className={`test-file-drop ${file ? "selected" : ""}`}
                            onClick={() => fileInput.current?.click()}
                        >
                            <input
                                ref={fileInput}
                                hidden
                                type="file"
                                accept="video/*,audio/*"
                                onChange={selectFile}
                            />
                            {file ? (
                                <>
                                    <div className="test-file-icon"><FileVideo size={21} /></div>
                                    <div className="test-file-info">
                                        <strong>{file.name}</strong>
                                        <span>{(file.size / 1024 / 1024).toFixed(1)} MB · Ready for testing</span>
                                    </div>
                                    <button className="icon-button" onClick={clearFile} aria-label="Remove file">
                                        <X size={16} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="test-upload-icon"><FileVideo size={22} /></div>
                                    <div>
                                        <strong>Select a test recording</strong>
                                        <span>Choose an audio or video file to run any module.</span>
                                    </div>
                                    <button className="btn btn-secondary btn-small">Browse file</button>
                                </>
                            )}
                        </div>

                        <div className="field test-title-field">
                            <label className="field-label" htmlFor="test-title">Test session label</label>
                            <input id="test-title" value={title} onChange={event => setTitle(event.target.value)} />
                        </div>
                    </div>

                    <div className="test-modules-head">
                        <div>
                            <h2>Analysis modules</h2>
                            <p>Select a module to inspect its output independently.</p>
                        </div>
                        <span>{Object.keys(results).length} / 4 tested</span>
                    </div>

                    <div className="test-module-list">
                        {tests.map(function (test)
                        {
                            const Icon = test.icon;
                            const result = results[test.id];

                            return (
                                <button
                                    key={test.id}
                                    className={`test-module ${active === test.id ? "active" : ""}`}
                                    onClick={() => setActive(test.id)}
                                >
                                    <div className={`module-icon ${test.color}`}><Icon size={20} /></div>
                                    <div className="module-copy">
                                        <strong>{test.name}</strong>
                                        <span>{test.description}</span>
                                        <small>{test.output}</small>
                                    </div>
                                    <div className="module-status">
                                        {result ? (
                                            <span className="tested-badge"><CheckCircle2 size={13} /> Tested</span>
                                        ) : (
                                            <span className="not-tested">Not run</span>
                                        )}
                                        <ChevronRight size={17} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {error && <div className="inline-alert"><Info size={16} />{error}</div>}

                    <div className="test-run-footer">
                        <div>
                            <strong>Ready to test?</strong>
                            <span>{activeTest?.name} will run as a standalone request.</span>
                        </div>
                        <button className="btn btn-primary" onClick={run} disabled={running}>
                            {running ? (
                                <><LoaderCircle size={16} className="spin" /> Running test…</>
                            ) : (
                                <><CirclePlay size={17} /> Run selected test <ArrowRight size={16} /></>
                            )}
                        </button>
                    </div>
                </section>

                <aside className="test-output">
                    <div className="output-header">
                        <div>
                            <div className="eyebrow">LIVE OUTPUT</div>
                            <h2>Test results</h2>
                        </div>
                        {activeResult && <StatusPill status={activeResult.status} />}
                    </div>

                    {activeResult ? (
                        <>
                            <div className="output-success">
                                <CheckCircle2 size={19} />
                                <div>
                                    <strong>Test completed</strong>
                                    <span>{activeResult.message}</span>
                                </div>
                            </div>
                            <div className="output-code-head">
                                <span>RESPONSE JSON</span>
                                <button className="icon-button" onClick={copyResult}>Copy</button>
                            </div>
                            <pre className="output-code">{JSON.stringify(activeResult, null, 2)}</pre>
                        </>
                    ) : (
                        <div className="output-empty">
                            <div className="output-empty-icon"><FlaskConical size={27} /></div>
                            <h3>No output yet</h3>
                            <p>Choose a recording and run <b>{activeTest?.name}</b> to inspect the result here.</p>
                            <div className="output-hint">
                                <Info size={15} />
                                <span>Each test runs independently and doesn't change a full evaluation.</span>
                            </div>
                        </div>
                    )}

                    <div className="output-footer">
                        <div className="output-footer-icon"><CheckCircle2 size={16} /></div>
                        <div>
                            <strong>Test independently, ship confidently</strong>
                            <p>Review module output and logs before connecting the full pipeline.</p>
                        </div>
                    </div>
                </aside>
            </div>
        </Layout>
    );
}

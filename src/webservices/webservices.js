import { demoEvaluations } from "../data/demoData";
import endpoints from "./endpoints.json";
import { io } from "socket.io-client";

const BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
).replace(/\/$/, "");
export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE ?? "false").toLowerCase() === "true";

export function makeRequest(url, options = {})
{
    return new Promise(function (resolve, reject)
    {
        const headers = {
            ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(options.headers || {})
        };

        fetch(url, { ...options, headers: headers })
            .then(function (response)
            {
                response.json()
                    .then(function (payload)
                    {
                        if (!response.ok)
                        {
                            reject(new Error(payload.message || `Request failed (${response.status})`));
                        }
                        else
                        {
                            resolve(payload.data ?? payload);
                        }
                    })
                    .catch(function (error)
                    {
                        console.error(`[webservices.makeRequest] parse response from ${url} failed`, {
                            url: url,
                            error: error
                        });
                        reject(error);
                    });
            })
            .catch(function (error)
            {
                console.error(`[webservices.makeRequest] send request to ${url} failed`, {
                    url: url,
                    error: error
                });
                reject(error);
            });
    });
}

function wait(milliseconds = 350)
{
    return new Promise(function (resolve)
    {
        window.setTimeout(resolve, milliseconds);
    });
}

function demoResponse(data, milliseconds, source)
{
    return new Promise(function (resolve, reject)
    {
        wait(milliseconds)
            .then(function ()
            {
                resolve(data);
            })
            .catch(function (error)
            {
                console.error(`[webservices.${source}] load demo data failed`, error);
                reject(error);
            });
    });
}

export function getEvaluations()
{
    if (DEMO_MODE)
    {
        return demoResponse(demoEvaluations, 350, "getEvaluations");
    }
    else
    {
        return makeRequest(`${BASE_URL}${endpoints.evaluations}`);
    }
}

export function getEvaluation(id)
{
    if (DEMO_MODE)
    {
        const evaluation = demoEvaluations.find(function (item)
        {
            return item.evaluation_id === id;
        }) || demoEvaluations[0];

        return demoResponse(evaluation, 350, "getEvaluation");
    }
    else
    {
        const url = `${BASE_URL}${endpoints.evaluation.replace(":id", encodeURIComponent(id))}`;
        return makeRequest(url);
    }
}

export function getProcesses()
{
    return makeRequest(`${BASE_URL}${endpoints.processes}`);
}

export function getProcess(id)
{
    const endpoint = endpoints.process.replace(":id", encodeURIComponent(id));
    return makeRequest(`${BASE_URL}${endpoint}`);
}

export function connectProcessSocket()
{
    const socketUrl = BASE_URL.replace(/\/api\/v1$/, "");
    return io(socketUrl, {
        autoConnect: false,
        transports: ["websocket", "polling"]
    });
}

export function uploadRecording(file, metadata)
{
    if (DEMO_MODE)
    {
        const result = {
            evaluation_id: `ev-${Math.floor(1050 + Math.random() * 8999)}`,
            process_id: `pr-${Math.floor(2100 + Math.random() * 8999)}`,
            status: "queued",
            file_name: file.name
        };

        return demoResponse(result, 900, "uploadRecording");
    }
    else
    {
        const body = new FormData();
        body.append("file", file);
        Object.entries(metadata).forEach(function ([key, value])
        {
            body.append(key, value);
        });

        return makeRequest(`${BASE_URL}${endpoints.uploadRecording}`, {
            method: "POST",
            body: body
        });
    }
}

export function runTest(testType, file, metadata)
{
    if (DEMO_MODE)
    {
        const result = {
            test_id: `test-${Date.now()}`,
            test_type: testType,
            status: "completed",
            message: `${testType.replaceAll("-", " ")} test completed in demo mode.`,
            result: {
                status: "completed",
                note: "Switch VITE_DEMO_MODE=false to run against the Node API."
            }
        };

        return demoResponse(result, 1100, "runTest");
    }
    else
    {
        const body = new FormData();
        body.append("file", file);
        Object.entries(metadata).forEach(function ([key, value])
        {
            body.append(key, value);
        });

        const endpoint = endpoints.testing.replace(":type", encodeURIComponent(testType));
        return makeRequest(`${BASE_URL}${endpoint}`, {
            method: "POST",
            body: body
        });
    }
}

export function retryProcess(id)
{
    const endpoint = endpoints.retryProcess.replace(":id", encodeURIComponent(id));
    return makeRequest(`${BASE_URL}${endpoint}`, {
        method: "POST",
        body: JSON.stringify({})
    });
}

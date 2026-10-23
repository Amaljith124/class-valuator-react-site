import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Overview from "./pages/Overview";
import Upload from "./pages/Upload";
import Processes from "./pages/Processes";
import Testing from "./pages/Testing";
import Evaluations from "./pages/Evaluations";
import EvaluationDetail from "./pages/EvaluationDetail";
export default function App()
{
    return (
        <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/processes" element={<Processes />} />
            <Route path="/testing" element={<Testing />} />
            <Route path="/evaluations" element={<Evaluations />} />
            <Route path="/evaluations/:id" element={<EvaluationDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

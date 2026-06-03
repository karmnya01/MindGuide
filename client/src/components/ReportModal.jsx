/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useRef, useState, useEffect } from "react";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import { useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faRocket, faArrowLeft, faFilePdf } from "@fortawesome/free-solid-svg-icons";
Chart.register(...registerables);

const ReportModal = ({ report, open, messages, stressHistory }) => {
  const contentRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const [contentReady, setContentReady] = useState(false);
  const { type: counsellorType } = useParams();
  const navigate = useNavigate();





  const handleRoadmapCreation = async () => {
    const toastId = toast.loading("Generating your personalized roadmap based on this session...", { position: "bottom-center" });
    try {
      const response = await axios.post(
        "/api/v1/chat/roadmap",
        {
          chat: messages,
        }
      );
      if (response.status === 200) {
        toast.update(toastId, { render: "Roadmap generated successfully! Taking you there...", type: "success", isLoading: false, autoClose: 3000 });
        navigate("/account/dashboard/journey");
      } else {
        toast.update(toastId, { render: "Error generating roadmap.", type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      console.error("Error in fetching roadmap", error);
      toast.update(toastId, { render: "Failed to generate roadmap: " + (error.response?.data?.error || error.response?.data || error.message), type: "error", isLoading: false, autoClose: 5000 });
    }
  };

  const downloadReport = (format = "pdf") => {
    const url = format === "pdf" ? report.pdfUrl : report.csvUrl;
    if (url) {
        window.open(`http://localhost:3005${url}`, "_blank");
    } else {
        toast.error("Download link not available yet.");
    }
  };

  return (
    <div>
      <Modal
        open={open}
        center
        closeOnOverlayClick={false}
        closeIcon={
          uploading ? null : (
            <span
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full font-semibold transition-all shadow-sm flex items-center gap-2 border border-slate-200 cursor-pointer"
              onClick={() => {
                if (!uploading) {
                  navigate("../counselors");
                }
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" /> Exit
            </span>
          )
        }
        styles={{
          modal: {
            maxWidth: '900px',
            width: '100%',
            padding: '0',
            borderRadius: '24px',
            background: 'transparent',
            boxShadow: 'none',
          },
          closeButton: {
            top: '20px',
            right: '20px',
            outline: 'none',
          }
        }}
      >
        <div className="bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col font-sans border border-slate-200">
          
          {/* Action Bar (Not Printed) */}
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex items-center justify-between no-print rounded-t-[24px]">
            <div className="flex items-center gap-3 text-slate-600">
              <FontAwesomeIcon icon={faFilePdf} className="text-xl text-rose-500" />
              <h2 className="font-bold text-lg">Session Complete</h2>
            </div>
            
            <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadReport("pdf")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-semibold transition-all shadow-sm ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-slate-400"}`}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  PDF report
                </button>
                
                <button
                  onClick={() => downloadReport("csv")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-semibold transition-all shadow-sm ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-slate-400"}`}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  CSV Data
                </button>
              
              {counsellorType && (
                <button
                  onClick={handleRoadmapCreation}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 py-2.5 px-5 rounded-xl text-white font-semibold transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40"
                  disabled={uploading}
                >
                  <FontAwesomeIcon icon={faRocket} />
                  New Roadmap
                </button>
              )}
            </div>
          </div>

          {/* Printable Report Content */}
          <div ref={contentRef} className="p-10 bg-white">
            
            {/* Report Header */}
            <div className="border-b-2 border-indigo-100 pb-8 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Mind-Guide Report</h1>
                  <p className="text-lg text-indigo-600 font-semibold capitalize">{counsellorType} AI Mentorship</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Generated On</p>
                  <p className="text-lg font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex gap-12 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">User Profile</p>
                  <p className="text-xl font-bold text-slate-800 capitalize">{userInfo?.name || 'Anonymous'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Contact / Email</p>
                  <p className="text-xl font-bold text-slate-800">{userInfo?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Analytics Section */}
            {stressHistory && stressHistory.length > 0 && (
              <div className="mb-10 page-break-inside-avoid">
                <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
                  Session Stress Level Analysis
                </h2>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div style={{ height: "240px" }}>
                    <Line 
                      data={{
                        labels: stressHistory.map((_, i) => `Turn ${i + 1}`),
                        datasets: [{
                          label: "Stress Level (1-10)",
                          data: stressHistory,
                          borderColor: "rgba(99, 102, 241, 1)",
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                          pointBackgroundColor: "rgba(99, 102, 241, 1)",
                          pointBorderColor: "#fff",
                          pointBorderWidth: 2,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                          tension: 0.4,
                          fill: true,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: { 
                            min: 0, 
                            max: 10, 
                            ticks: { stepSize: 2, color: '#64748b' },
                            grid: { color: '#f1f5f9', borderDash: [4, 4] },
                            border: { display: false }
                          },
                          x: {
                            ticks: { color: '#64748b' },
                            grid: { display: false },
                            border: { display: false }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Markdown Report Content */}
            <div className="prose prose-slate prose-indigo max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
              <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
                Mentorship Summary & Insights
              </h2>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <ReactMarkdown>
                  {report.reportData?.debrief?.summary || "Report content initializing..."}
                </ReactMarkdown>
                {report.reportData?.debrief?.keyInsights && (
                    <div className="mt-8 space-y-4 text-slate-700">
                        <p className="font-bold text-slate-900 uppercase text-xs tracking-widest">Strategic Insights</p>
                        {report.reportData.debrief.keyInsights.map((insight, idx) => (
                            <div key={idx} className="flex gap-4 items-start">
                                <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                <p>{insight}</p>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-400 font-medium no-print">
              Mind-Guide AI • Confidential Session Report
            </div>

          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReportModal;

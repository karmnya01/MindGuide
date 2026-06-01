import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faDownload, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";

const GetAllReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:3005/api/v1/user/allReports"
        );
        const sortedData = data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setReports(sortedData);
      } catch (error) {
        console.error("Error fetching reports:", error.response);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scroll-smooth p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">My Reports</h2>
        <p className="text-slate-400">View and download your past session summaries and analyses.</p>
      </div>

      {reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reports.map((report, index) => {
            const reportDate = new Date(report.date).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });
            
            const pdfFileName = report.pdfPath || report.fileName || (
              report.filePath && !/^https?:\/\//i.test(report.filePath)
                ? report.filePath.split("/").pop()?.split("?")[0]
                : null
            );
            if (!pdfFileName) return null;

            const pdfUrl = `http://localhost:3005/api/v1/chat/download/${pdfFileName}`;
            const csvUrl = report.csvPath
              ? `http://localhost:3005/api/v1/chat/download/${report.csvPath}`
              : null;

            return (
              <div key={index} className="group bg-[#111827] border border-slate-700/60 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-indigo-500/10 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <FontAwesomeIcon icon={faFilePdf} className="text-2xl" />
                  </div>
                  <div className="flex gap-2">
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-sm" title="Download PDF Analysis">
                      <FontAwesomeIcon icon={faDownload} className="text-xs" />
                    </a>
                    {csvUrl && (
                      <a href={csvUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-sm" title="Download CSV Data">
                        <FontAwesomeIcon icon={faDownload} className="text-xs" />
                      </a>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight">
                  {report.title || "Session Report"}
                </h3>
                
                <div className="mt-auto pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>{reportDate}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-black text-rose-400 hover:text-rose-300 transition-colors">
                      Strategic PDF Analysis
                    </a>
                    {csvUrl && (
                      <span className="text-slate-700">|</span>
                    )}
                    {csvUrl && (
                      <a href={csvUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-black text-emerald-400 hover:text-emerald-300 transition-colors">
                        Excel/CSV Data
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#111827] border border-slate-700/60 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
            <FontAwesomeIcon icon={faFilePdf} className="text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Reports Found</h3>
          <p className="text-slate-400 max-w-md">
            You haven't generated any tactical session reports yet. Complete a mentorship session to get your first AI analysis.
          </p>
        </div>
      )}
    </div>
  </div>
  );
};

export default GetAllReports;

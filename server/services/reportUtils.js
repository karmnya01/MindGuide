const fs = require("fs");
const path = require("path");

const getReportsDir = () => path.join(__dirname, "..", "reports");

function resolvePdfFileName(report) {
  if (report.pdfPath) return path.basename(report.pdfPath);
  if (report.fileName) return path.basename(report.fileName);
  if (report.filePath) {
    if (/^https?:\/\//i.test(report.filePath)) return null;
    const name = report.filePath.split("/").pop()?.split("?")[0];
    return name || null;
  }
  return null;
}

function resolveCsvFileName(report) {
  if (report.csvPath) return path.basename(report.csvPath);
  return null;
}

function fileExistsWithContent(reportsDir, fileName) {
  if (!fileName) return false;
  const filePath = path.join(reportsDir, path.basename(fileName));
  if (!fs.existsSync(filePath)) return false;
  try {
    return fs.statSync(filePath).size > 0;
  } catch {
    return false;
  }
}

function isDownloadableReport(report, reportsDir = getReportsDir()) {
  return fileExistsWithContent(reportsDir, resolvePdfFileName(report));
}

function filterValidReports(reportHistory = [], reportsDir = getReportsDir()) {
  return reportHistory.filter((report) => isDownloadableReport(report, reportsDir));
}

function migrateReportPaths(reportHistory = [], reportsDir = getReportsDir()) {
  let changed = false;
  const migrated = reportHistory.map((report) => {
    if (!report.pdfPath && report.filePath && !/^https?:\/\//i.test(report.filePath)) {
      const potentialFileName = report.filePath.split("/").pop()?.split("?")[0];
      if (potentialFileName && fileExistsWithContent(reportsDir, potentialFileName)) {
        report.pdfPath = potentialFileName;
        changed = true;
      }
    }
    return report;
  });
  return { migrated, changed };
}

async function syncUserReportHistory(user, reportsDir = getReportsDir()) {
  const { migrated, changed: migratedChanged } = migrateReportPaths(user.reportHistory, reportsDir);
  const validReports = filterValidReports(migrated, reportsDir);
  const needsSave = migratedChanged || validReports.length !== user.reportHistory.length;

  if (needsSave) {
    user.reportHistory = validReports;
    await user.save();
  }

  return validReports;
}

module.exports = {
  getReportsDir,
  resolvePdfFileName,
  resolveCsvFileName,
  isDownloadableReport,
  filterValidReports,
  syncUserReportHistory,
};

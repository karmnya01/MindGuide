import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapSigns,
  faLink,
  faCommentDots,
  faWandMagicSparkles,
  faRoute,
  faSpinner,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const InteractiveRoadmap = ({ data, trackTitle }) => {
  const [steps, setSteps] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [pendingSelection, setPendingSelection] = useState(null);
  const [reviseLoading, setReviseLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [committed, setCommitted] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(data)) setSteps(data);
    else if (data && Array.isArray(data.steps)) setSteps(data.steps);
  }, [data]);

  const normalizedSteps = useMemo(() => {
    const normalizeResources = (resources) => {
      if (!Array.isArray(resources)) return [];
      return resources
        .map((r) => ({
          title: r?.title || r?.name || "",
          url: r?.url || r?.link || r?.href || "",
        }))
        .filter((r) => r.title || r.url);
    };

    const normalizeTasks = (rawTasks) => {
      if (!Array.isArray(rawTasks)) return [];
      return rawTasks
        .map((t) => {
          if (typeof t === "string") return { text: t, done: false };
          return {
            text: t?.text || t?.title || "",
            done: Boolean(t?.done),
          };
        })
        .filter((t) => t.text);
    };

    return (steps || []).map((s, index) => {
      const title = s?.title || s?.Goal || `Step ${index + 1}`;
      const description = s?.description || s?.Description || "";
      const tasksRaw = s?.tasks || s?.todos || s?.Tasks || [];
      const resourcesRaw =
        s?.resources || s?.recommendations || s?.Recommendations || [];

      return {
        title,
        description,
        tasks: normalizeTasks(tasksRaw),
        resources: normalizeResources(resourcesRaw),
      };
    });
  }, [steps]);

  const handleTextSelect = useCallback((stepIndex) => {
    // Selection text is sometimes updated *after* mouseup; defer to next frame.
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      const quote = sel?.toString()?.trim();
      const fallbackSnippet = normalizedSteps?.[stepIndex]?.description
        ? String(normalizedSteps[stepIndex].description).trim().slice(0, 140)
        : "";

      const safeQuote =
        quote && quote.length >= 2 ? quote : fallbackSnippet;

      if (!safeQuote || safeQuote.length < 2) return;

      setPendingSelection({ stepIndex, quote: safeQuote });
      setCommentDraft("");
    });
  }, [normalizedSteps]);

  const addComment = () => {
    if (!pendingSelection || !commentDraft.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        stepIndex: pendingSelection.stepIndex,
        quote: pendingSelection.quote,
        text: commentDraft.trim(),
      },
    ]);
    setPendingSelection(null);
    setCommentDraft("");
    window.getSelection()?.removeAllRanges();
  };

  const removeComment = (id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const applyFeedback = async () => {
    if (comments.length === 0) {
      toast.info("Select text on a step and add a comment first.");
      return;
    }
    setReviseLoading(true);
    try {
      const { data: res } = await axios.post("/api/v1/chat/roadmap/revise", {
        steps: normalizedSteps,
        comments: comments.map(({ stepIndex, quote, text }) => ({
          stepIndex,
          quote,
          text,
        })),
      });
      if (res?.steps?.length) {
        setSteps(res.steps);
        setComments([]);
        toast.success("Roadmap updated from your feedback.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not apply feedback");
    } finally {
      setReviseLoading(false);
    }
  };

  const commitToJourney = async () => {
    setCommitLoading(true);
    try {
      const title =
        trackTitle ||
        normalizedSteps[0]?.title?.replace(/^(step\s*\d+:?\s*)/i, "") ||
        "My learning path";
      const { data: res } = await axios.post("/api/v1/chat/roadmap/commit", {
        title,
        steps: normalizedSteps,
      });
      if (res?.success) {
        setCommitted(true);
        toast.success("Roadmap saved to your Journey map.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save to Journey");
    } finally {
      setCommitLoading(false);
    }
  };

  if (!Array.isArray(normalizedSteps) || normalizedSteps.length === 0) {
    return (
      <p className="text-rose-600 p-4 bg-rose-50 rounded-xl border border-rose-100 text-sm">
        Could not load roadmap steps.
      </p>
    );
  }

  return (
    <div ref={cardRef} className="w-full mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <FontAwesomeIcon icon={faMapSigns} className="text-white text-sm" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Your roadmap</h3>
            <p className="text-[11px] text-slate-500">
              Highlight text to comment · Apply edits · Commit to Journey
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {normalizedSteps.map((step, index) => (
          <motion.div
            key={`${step.title}-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <h4 className="text-[15px] font-bold text-slate-900 mb-2 flex items-start gap-2">
              <span className="shrink-0 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase px-2 py-1 rounded-md">
                Step {index + 1}
              </span>
              <span>{step.title}</span>
            </h4>

            <p
              className="text-[14px] text-slate-600 leading-relaxed mb-4 select-text cursor-text"
              onMouseUpCapture={() => handleTextSelect(index)}
            >
              {step.description}
            </p>

            {step.tasks?.length > 0 && (
              <ul className="mb-4 space-y-1.5">
                {step.tasks.map((task, ti) => (
                  <li
                    key={ti}
                    className="text-[13px] text-slate-600 flex items-start gap-2"
                  >
                    <span className="text-indigo-400 mt-0.5">○</span>
                    {typeof task === "string" ? task : task.text}
                  </li>
                ))}
              </ul>
            )}

            {step.resources?.length > 0 && (
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLink} className="text-indigo-500" />
                  Resources
                </p>
                <ul className="space-y-2">
                  {step.resources.map((res, ri) => (
                    <li key={ri}>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-indigo-600 hover:underline font-medium break-all"
                      >
                        {res.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {pendingSelection && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
          >
            <p className="text-[10px] font-bold uppercase text-amber-800 tracking-wider mb-1">
              Comment on selection
            </p>
            <p className="text-[12px] text-amber-900/80 italic mb-2 line-clamp-2">
              &ldquo;{pendingSelection.quote}&rdquo;
            </p>
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="e.g. Make this shorter, add more practice projects..."
              className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 mb-2 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addComment}
                disabled={!commentDraft.trim()}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg disabled:opacity-40"
              >
                Add comment
              </button>
              <button
                type="button"
                onClick={() => setPendingSelection(null)}
                className="px-3 py-1.5 text-amber-800 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {comments.length > 0 && (
        <div className="mx-4 mb-4 p-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faCommentDots} className="text-indigo-500" />
            Pending feedback ({comments.length})
          </p>
          <ul className="space-y-2 mb-3 max-h-32 overflow-y-auto">
            {comments.map((c) => (
              <li
                key={c.id}
                className="text-[12px] text-slate-600 border-l-2 border-indigo-300 pl-2"
              >
                <span className="font-semibold text-slate-800">
                  Step {c.stepIndex + 1}:
                </span>{" "}
                {c.text}
                <button
                  type="button"
                  onClick={() => removeComment(c.id)}
                  className="ml-2 text-rose-500 text-[10px] font-bold uppercase"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={applyFeedback}
            disabled={reviseLoading}
            className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {reviseLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faWandMagicSparkles} />
            )}
            Apply feedback & update plan
          </button>
        </div>
      )}

      <div className="p-4 pt-0 flex flex-col sm:flex-row gap-2 border-t border-slate-100 bg-white">
        {committed ? (
          <Link
            to="/account/dashboard/journey"
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faCheck} />
            Open Journey map
          </Link>
        ) : (
          <button
            type="button"
            onClick={commitToJourney}
            disabled={commitLoading}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
          >
            {commitLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faRoute} />
            )}
            Commit to Journey
          </button>
        )}
      </div>
    </div>
  );
};

export default InteractiveRoadmap;

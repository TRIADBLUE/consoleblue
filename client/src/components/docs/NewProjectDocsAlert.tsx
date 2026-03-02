import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import type { Notification } from "@/hooks/use-notifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, ExternalLink, CheckCircle2 } from "lucide-react";

/**
 * NewProjectDocsAlert
 *
 * Auto-popup that appears when there are unread "new_project_docs"
 * notifications. This enforces the rule: agents must review their
 * onboarding docs BEFORE doing any work on a new project.
 *
 * Renders as a modal dialog that cannot be easily dismissed —
 * the user must acknowledge they've read the docs.
 */
export function NewProjectDocsAlert() {
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [, navigate] = useLocation();
  const [activeAlert, setActiveAlert] = useState<Notification | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<number>>(new Set());

  // Find unread new_project_docs notifications
  useEffect(() => {
    if (!data?.notifications) return;

    const unreadDocAlerts = data.notifications.filter(
      (n) =>
        n.type === "new_project_docs" &&
        !n.read &&
        !acknowledged.has(n.id),
    );

    // Show the most recent unread alert
    if (unreadDocAlerts.length > 0 && !activeAlert) {
      setActiveAlert(unreadDocAlerts[0]);
    }
  }, [data?.notifications, acknowledged, activeAlert]);

  function handleAcknowledge() {
    if (!activeAlert) return;

    // Mark as read via API
    markRead.mutate(activeAlert.id);

    // Track locally so we don't re-show
    setAcknowledged((prev) => new Set(prev).add(activeAlert.id));
    setActiveAlert(null);
  }

  function handleViewDocs() {
    if (!activeAlert?.metadata) return;

    const meta = activeAlert.metadata as Record<string, unknown>;
    const projectSlug = meta.projectSlug as string;

    if (projectSlug) {
      navigate(`/projects/${projectSlug}`);
    }

    handleAcknowledge();
  }

  if (!activeAlert) return null;

  const meta = (activeAlert.metadata || {}) as Record<string, unknown>;
  const projectSlug = meta.projectSlug as string;
  const docsGenerated = meta.docsGenerated as number;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg"
        // Prevent closing by clicking overlay or pressing Escape
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                New Project Onboarded
              </DialogTitle>
              <DialogDescription className="text-sm">
                Documentation review required before starting work
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Alert Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">
              {activeAlert.title.replace("📋 ", "")}
            </p>
            <p className="text-sm text-amber-700">{activeAlert.message}</p>
          </div>

          {/* What was generated */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Auto-generated documents ({docsGenerated}):
            </p>
            <div className="space-y-1.5">
              {[
                {
                  title: "Company Identity & Overview",
                  category: "handbook",
                  desc: "Who we are, ecosystem context, core values",
                },
                {
                  title: "Project Restrictions & Boundaries",
                  category: "policy",
                  desc: "Non-negotiable rules, branding, data privacy",
                },
                {
                  title: "Unique Features & Capabilities",
                  category: "handbook",
                  desc: "Project identity, ConsoleBlue integration, config",
                },
                {
                  title: "General Direction & Standards",
                  category: "procedure",
                  desc: "Work process, tech stack, code standards",
                },
              ].map((doc, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-md bg-gray-50"
                >
                  <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {doc.title}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {doc.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{doc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enforcement message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 font-medium">
              These documents contain policy, procedures, and handbooks — not
              prompts. They define the rules and standards for this project.
              Review them before making any changes.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {projectSlug && (
            <Button
              onClick={handleViewDocs}
              className="gap-1.5"
            >
              <ExternalLink className="h-4 w-4" />
              View Docs Now
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleAcknowledge}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            I've Reviewed the Docs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

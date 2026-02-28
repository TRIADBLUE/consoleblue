import { SharedDocList } from "@/components/docs/SharedDocList";

export default function SharedDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Docs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage shared docs that get included in every project's CLAUDE.md
            push. Project-specific docs are managed within each project's Docs
            tab.
          </p>
        </div>

        <SharedDocList />
      </div>
    </div>
  );
}

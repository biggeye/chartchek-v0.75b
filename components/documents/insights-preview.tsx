export default function DocumentInsightsPreview() {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Document Insights Preview</h3>
      <div className="space-y-2 text-sm">
        <div className="p-4 rounded-lg bg-muted">
          "Patient shows marked improvement in mood regulation based on last 3 sessions"
        </div>
        <div className="p-4 rounded-lg bg-muted">
          "New risk factors identified: sleep pattern disruption (4.5h avg)"
        </div>
      </div>
    </div>
  );
}

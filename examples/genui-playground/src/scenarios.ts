export const DASHBOARD_PROGRAM = `
root = Container("column", 1, "round", [header, alertBox, progress, metricTable])
header = Text("🛰️ TERMINA CLUSTER MONITOR", "cyan", true)
alertBox = Alert("Security Advisory", "Cluster running kernel v6.12. Maintenance tonight.", "warning")
progress = ProgressBar(82, "Cluster Memory Utilization")
metricTable = Table(["Service", "Status", "Latency"], [
	{"Service": "auth-api", "Status": "healthy", "Latency": "12ms"},
	{"Service": "billing-worker", "Status": "healthy", "Latency": "45ms"},
	{"Service": "inference-gateway", "Status": "degraded", "Latency": "180ms"}
])
`.trim();

export const FORM_PROGRAM = `
root = Container("column", 1, "single", [header, envInput, regionSelect, actionBtn, status])
header = Text("⚙️ AGENT CONFIGURATION FORM", "green", true)
envInput = TextInput("envName", "Environment Name", "e.g. staging-cluster", "production-edge")
regionSelect = Select("region", "Deployment Region", ["us-east-1", "eu-central-1", "ap-south-1"])
actionBtn = Button("Apply Settings", "applyConfig")
status = StatusMessage("Runtime values bound to form state", "info")
`.trim();

export const STREAMING_CHUNKS = [
	'root = Container("column", 1, "double", [',
	'title, ',
	'badge, ',
	'progress, ',
	'preview])\n',
	'title = Text("⚡ GENERATIVE UI LIVE STREAM", "yellow", true)\n',
	'badge = Badge("STREAMING IN PROGRESS", "info")\n',
	'progress = ProgressBar(95, "Synthesizing Structured Tree")\n',
	'preview = CodeBlock("function renderGenUI() {\\n  return <GenUIRenderer />;\\n}", "typescript")\n',
];

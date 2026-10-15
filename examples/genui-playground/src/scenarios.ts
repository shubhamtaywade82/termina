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
	'root = Container("column", 1, "round", [',
	'header, ',
	'auditBadge, ',
	'overview, ',
	'progress, ',
	'patchDiff, ',
	'findingsTable, ',
	'status, ',
	'mergeBtn])\n',
	'header = Text("🤖 AI AGENT: AUTO-REMEDIATION & REFACTOR", "cyan", true)\n',
	'auditBadge = Badge("MEMORY LEAK HOTFIX", "warning")\n',
	'overview = Markdown("Detected runaway allocations in worker-pool.ts. Auto-generating cleanup handler and benchmarking memory.")\n',
	'progress = ProgressBar(84, "Running Regression & Leak Verification")\n',
	'patchDiff = CodeBlock("async function drain(pool: WorkerPool): Promise<void> {\\n  for (const worker of pool.workers) {\\n    await worker.terminate();\\n    worker.removeAllListeners();\\n  }\\n  pool.workers.length = 0;\\n}", "typescript")\n',
	'findingsTable = Table(["Resource", "Before", "After", "Delta"], [\n',
	'  {"Resource": "Heap Memory", "Before": "1.42 GB", "After": "184 MB", "Delta": "-87%"},\n',
	'  {"Resource": "Active Handles", "Before": "1,240", "After": "12", "Delta": "-99%"},\n',
	'  {"Resource": "P99 Latency", "Before": "420ms", "After": "18ms", "Delta": "-95%"}\n',
	'])\n',
	'status = StatusMessage("Mitigation verified: 42/42 regression tests passing without leaks", "success")\n',
	'mergeBtn = Button("Deploy Hotfix to Production", "deployHotfix")\n',
];

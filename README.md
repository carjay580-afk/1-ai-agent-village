# 1-ai-agent-village
AI all in one agent
ai-agent-village/
│
├── config/
│   └── canonical_agent_configuration_v1.0.json
│
├── database/
│   ├── migrations/
│   │   └── 0001_initial_village_schema.sql
│   │
│   └── docs/
│       └── village_schema_v1.0.md
│
├── tests/
│   └── DBT-001/
│       ├── DBT-001_fixture_v1.0.sql
│       ├── DBT-001_assertions_v1.0.sql
│       ├── DBT-001_transaction_rollback_v1.0.sql
│       ├── compose.dbt001.yaml
│       ├── run_DBT-001.sh
│       └── village-test.sh
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── testing/
│
├── .github/
│   └── workflows/
│       └── dbt-001.yml
│
├── .gitignore
└── README.md

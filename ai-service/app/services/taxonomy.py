"""Skill taxonomy used by the ATS matching engine.

Each entry is (canonical_name, category, family, aliases). ``family`` groups
skills that are related but not identical, which is what lets the analyzer
report a *partial* match (e.g. the job asks for PostgreSQL and the resume shows
MySQL) instead of a flat miss.

Matching is word-boundary based and case-insensitive, so ``C++`` and ``C#``
never collide with ``C``.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Skill:
    name: str
    category: str
    family: str
    aliases: tuple


SKILLS: tuple = (
    # ---------------------------------------------------------------- languages
    Skill("Python", "language", "python-core", ("python", "python3", "python 3")),
    Skill("Java", "language", "jvm", ("java", "java8", "java 8", "java11", "java 17", "core java")),
    Skill("C", "language", "systems", ("c language", "ansi c")),
    Skill("C++", "language", "systems", ("c++", "cpp", "c plus plus")),
    Skill("C#", "language", "dotnet", ("c#", "csharp", "c sharp")),
    Skill("JavaScript", "language", "js-ts", ("javascript", "js", "es6", "ecmascript", "vanilla js")),
    Skill("TypeScript", "language", "js-ts", ("typescript", "ts")),
    Skill("Go", "language", "systems", ("golang", "go lang")),
    Skill("Rust", "language", "systems", ("rust",)),
    Skill("PHP", "language", "php", ("php",)),
    Skill("Ruby", "language", "ruby", ("ruby",)),
    Skill("Kotlin", "language", "jvm", ("kotlin",)),
    Skill("Swift", "language", "apple", ("swift",)),
    Skill("Scala", "language", "jvm", ("scala",)),
    Skill("R", "language", "analytics", ("r programming", "r language")),
    Skill("MATLAB", "language", "analytics", ("matlab",)),
    Skill("Bash", "language", "scripting", ("bash", "shell scripting", "shell script", "zsh")),
    Skill("SQL", "language", "sql", ("sql", "structured query language")),
    Skill("HTML", "language", "frontend-markup", ("html", "html5")),
    Skill("CSS", "language", "frontend-markup", ("css", "css3", "styling")),
    Skill("Solidity", "language", "blockchain", ("solidity",)),

    # ----------------------------------------------------------------- frameworks
    Skill("React", "framework", "frontend", ("react", "reactjs", "react.js", "react 18", "react hooks")),
    Skill("Next.js", "framework", "frontend", ("nextjs", "next.js", "next 13", "next 14")),
    Skill("Vue.js", "framework", "frontend", ("vue", "vuejs", "vue.js", "vue 3")),
    Skill("Angular", "framework", "frontend", ("angular", "angularjs", "angular 2+")),
    Skill("Svelte", "framework", "frontend", ("svelte", "sveltekit")),
    Skill("Redux", "framework", "frontend-state", ("redux", "redux toolkit", "rtk")),
    Skill("Tailwind CSS", "framework", "frontend-styling", ("tailwind", "tailwindcss", "tailwind css")),
    Skill("Bootstrap", "framework", "frontend-styling", ("bootstrap",)),
    Skill("Node.js", "framework", "node-runtime", ("node", "nodejs", "node.js", "node js")),
    Skill("Express.js", "framework", "node-runtime", ("express", "expressjs", "express.js")),
    Skill("NestJS", "framework", "node-runtime", ("nestjs", "nest.js")),
    Skill("Django", "framework", "python-web", ("django", "django rest framework", "drf")),
    Skill("Flask", "framework", "python-web", ("flask",)),
    Skill("FastAPI", "framework", "python-web", ("fastapi", "fast api")),
    Skill("Spring Boot", "framework", "jvm", ("spring", "spring boot", "springboot", "spring mvc")),
    Skill("Hibernate", "framework", "jvm", ("hibernate", "jpa")),
    Skill(".NET", "framework", "dotnet", (".net", "dotnet", "asp.net", "asp net", ".net core")),
    Skill("Ruby on Rails", "framework", "ruby", ("rails", "ruby on rails")),
    Skill("Laravel", "framework", "php", ("laravel",)),
    Skill("Flutter", "framework", "mobile", ("flutter", "dart")),
    Skill("React Native", "framework", "mobile", ("react native", "reactnative")),
    Skill("Jest", "framework", "testing", ("jest",)),
    Skill("Pytest", "framework", "testing", ("pytest", "py.test")),
    Skill("JUnit", "framework", "testing", ("junit", "j unit")),
    Skill("Selenium", "framework", "testing", ("selenium", "webdriver")),
    Skill("Cypress", "framework", "testing", ("cypress",)),
    Skill("PyTorch", "framework", "ml-framework", ("pytorch", "torch")),
    Skill("TensorFlow", "framework", "ml-framework", ("tensorflow", "tf.keras", "keras")),
    Skill("Scikit-learn", "framework", "ml-framework", ("scikit-learn", "sklearn", "scikit learn")),
    Skill("OpenCV", "framework", "ml-framework", ("opencv", "cv2")),
    Skill("Hugging Face", "framework", "ml-framework", ("hugging face", "huggingface", "transformers")),
    Skill("LangChain", "framework", "llm", ("langchain", "llamaindex", "llm chain")),
    Skill("Socket.IO", "framework", "realtime", ("socket.io", "socketio", "websocket", "websockets")),
    Skill("GraphQL", "framework", "api", ("graphql", "apollo")),
    Skill("gRPC", "framework", "api", ("grpc", "protocol buffers", "protobuf")),

    # ------------------------------------------------------------------ databases
    Skill("MySQL", "database", "sql-db", ("mysql",)),
    Skill("PostgreSQL", "database", "sql-db", ("postgresql", "postgres", "psql")),
    Skill("Oracle DB", "database", "sql-db", ("oracle", "oracle db", "oracle database", "plsql", "pl/sql")),
    Skill("Microsoft SQL Server", "database", "sql-db", ("sql server", "mssql", "t-sql", "tsql")),
    Skill("SQLite", "database", "sql-db", ("sqlite", "sqlite3")),
    Skill("MongoDB", "database", "nosql-db", ("mongodb", "mongo", "mongoose")),
    Skill("Redis", "database", "cache-store", ("redis", "redis cache", "elasticache")),
    Skill("Cassandra", "database", "nosql-db", ("cassandra",)),
    Skill("DynamoDB", "database", "nosql-db", ("dynamodb", "dynamo db")),
    Skill("Firebase", "database", "baas", ("firebase", "firestore", "firebase auth")),
    Skill("Elasticsearch", "database", "search", ("elasticsearch", "elastic search", "opensearch")),
    Skill("Neo4j", "database", "graph-db", ("neo4j", "graph database")),
    Skill("Snowflake", "database", "warehouse", ("snowflake",)),
    Skill("BigQuery", "database", "warehouse", ("bigquery", "big query")),

    # ---------------------------------------------------------------------- cloud
    Skill("AWS", "cloud", "cloud", ("aws", "amazon web services", "ec2", "s3", "eks")),
    Skill("Azure", "cloud", "cloud", ("azure", "microsoft azure", "azure devops")),
    Skill("Google Cloud", "cloud", "cloud", ("gcp", "google cloud", "google cloud platform", "cloud run")),
    Skill("Vercel", "cloud", "hosting", ("vercel",)),
    Skill("Netlify", "cloud", "hosting", ("netlify",)),
    Skill("Heroku", "cloud", "hosting", ("heroku",)),
    Skill("DigitalOcean", "cloud", "hosting", ("digitalocean", "digital ocean")),

    # ---------------------------------------------------------------------- tools
    Skill("Git", "tool", "vcs", ("git", "version control")),
    Skill("GitHub", "tool", "vcs", ("github",)),
    Skill("GitLab", "tool", "vcs", ("gitlab", "git lab")),
    Skill("Bitbucket", "tool", "vcs", ("bitbucket",)),
    Skill("Docker", "tool", "container", ("docker", "dockerfile", "docker compose", "docker-compose", "containerization")),
    Skill("Kubernetes", "tool", "container", ("kubernetes", "k8s", "helm", "aks")),
    Skill("Jenkins", "tool", "ci-cd", ("jenkins",)),
    Skill("GitHub Actions", "tool", "ci-cd", ("github actions", "gh actions")),
    Skill("GitLab CI", "tool", "ci-cd", ("gitlab ci", "gitlab-ci")),
    Skill("Terraform", "tool", "iac", ("terraform", "infrastructure as code", "iac")),
    Skill("Ansible", "tool", "iac", ("ansible",)),
    Skill("Nginx", "tool", "server", ("nginx", "reverse proxy")),
    Skill("Apache Kafka", "tool", "messaging", ("kafka", "apache kafka")),
    Skill("RabbitMQ", "tool", "messaging", ("rabbitmq", "rabbit mq", "amqp")),
    Skill("Celery", "tool", "messaging", ("celery", "task queue")),
    Skill("Postman", "tool", "api-testing", ("postman", "swagger", "openapi")),
    Skill("Jira", "tool", "project-mgmt", ("jira", "confluence")),
    Skill("Linux", "tool", "os", ("linux", "ubuntu", "unix", "centos", "debian")),
    Skill("Agile", "tool", "process", ("agile", "scrum", "kanban", "sprint planning")),
    Skill("Figma", "tool", "design", ("figma", "wireframe", "prototyping")),
    Skill("Webpack", "tool", "build", ("webpack", "vite", "rollup", "bundler")),
    Skill("npm", "tool", "build", ("npm", "yarn", "pnpm", "package manager")),
    Skill("Prometheus", "tool", "observability", ("prometheus", "grafana", "datadog")),
    Skill("MLflow", "tool", "ml-ops", ("mlflow", "ml ops", "mlops", "kubeflow")),

    # -------------------------------------------------------------------- concepts
    Skill("Data Structures", "concept", "dsa", ("data structures", "data structure")),
    Skill("Algorithms", "concept", "dsa", ("algorithms", "algorithm", "algorithmic")),
    Skill("Dynamic Programming", "concept", "dsa", ("dynamic programming", "memoization", "tabulation")),
    Skill("Graph Algorithms", "concept", "dsa", ("graph algorithm", "graph algorithms", "bfs", "dfs", "dijkstra", "topological sort")),
    Skill("Time Complexity Analysis", "concept", "dsa", ("time complexity", "big o", "big-o", "asymptotic analysis")),
    Skill("Object Oriented Programming", "concept", "oop", ("object oriented", "object-oriented", "oop", "oops", "solid principles")),
    Skill("Design Patterns", "concept", "oop", ("design patterns", "design pattern", "singleton", "observer pattern")),
    Skill("DBMS", "concept", "dbms", ("dbms", "database management system", "database management systems")),
    Skill("Normalization", "concept", "dbms", ("normalization", "normalisation", "third normal form", "3nf")),
    Skill("Transactions & ACID", "concept", "dbms", ("acid", "transactions", "transaction isolation", "isolation level")),
    Skill("Indexing", "concept", "dbms", ("indexing", "b-tree", "btree", "query optimisation", "query optimization")),
    Skill("Operating Systems", "concept", "os-theory", ("operating systems", "operating system", "process scheduling", "deadlock")),
    Skill("Computer Networks", "concept", "networks", ("computer networks", "computer network", "tcp/ip", "tcp", "http", "https", "dns")),
    Skill("System Design", "concept", "system-design", ("system design", "high level design", "hld", "low level design", "lld", "scalability")),
    Skill("Microservices", "concept", "system-design", ("microservices", "micro services", "service oriented architecture", "soa")),
    Skill("REST API", "concept", "api", ("rest", "rest api", "restful", "api design", "api development")),
    Skill("Authentication & Authorization", "concept", "security", ("authentication", "authorization", "jwt", "oauth", "oauth2", "sso", "rbac")),
    Skill("Caching", "concept", "system-design", ("caching", "cache", "cdn", "memcached")),
    Skill("Load Balancing", "concept", "system-design", ("load balancing", "load balancer", "horizontal scaling")),
    Skill("Message Queues", "concept", "system-design", ("message queue", "message broker", "pub/sub", "event driven")),
    Skill("Unit Testing", "concept", "testing", ("unit testing", "unit test", "integration testing", "test coverage", "tdd")),
    Skill("CI/CD", "concept", "ci-cd", ("ci/cd", "cicd", "continuous integration", "continuous deployment", "continuous delivery")),
    Skill("Machine Learning", "concept", "ml", ("machine learning", "supervised learning", "model training", "feature engineering")),
    Skill("Deep Learning", "concept", "ml", ("deep learning", "neural network", "neural networks", "cnn", "rnn", "lstm")),
    Skill("Natural Language Processing", "concept", "ml", ("natural language processing", "nlp", "text mining", "tokenization")),
    Skill("Data Analysis", "concept", "analytics", ("data analysis", "data analytics", "pandas", "numpy", "data cleaning", "eda")),
    Skill("Data Visualization", "concept", "analytics", ("data visualization", "data visualisation", "matplotlib", "seaborn", "tableau", "power bi")),
    Skill("Statistics", "concept", "analytics", ("statistics", "statistical", "probability", "hypothesis testing", "regression")),
    Skill("Big Data", "concept", "data-eng", ("big data", "hadoop", "spark", "pyspark", "data pipeline", "etl")),
    Skill("Web Security", "concept", "security", ("web security", "xss", "csrf", "sql injection", "owasp", "security best practices")),
    Skill("Version Control Workflow", "concept", "vcs", ("pull request", "code review", "branching strategy", "git flow")),
    Skill("Responsive Design", "concept", "frontend-styling", ("responsive design", "responsive", "mobile first", "accessibility", "a11y")),
    Skill("State Management", "concept", "frontend-state", ("state management", "context api", "zustand", "redux thunk")),
    Skill("Performance Optimization", "concept", "system-design", ("performance optimization", "performance tuning", "latency", "throughput", "profiling")),
    Skill("Testing & Debugging", "concept", "testing", ("debugging", "debug", "troubleshooting", "root cause analysis")),
    Skill("Communication", "soft", "soft-skill", ("communication", "presentation", "stakeholder management")),
    Skill("Teamwork", "soft", "soft-skill", ("teamwork", "collaboration", "cross functional", "cross-functional")),
    Skill("Problem Solving", "soft", "soft-skill", ("problem solving", "problem-solving", "analytical thinking", "critical thinking")),
    Skill("Leadership", "soft", "soft-skill", ("leadership", "mentoring", "team lead", "ownership")),
)


def _build_alias_index() -> dict:
    """Map every alias (lower-cased) back to its canonical Skill."""
    index: dict = {}
    for skill in SKILLS:
        index[skill.name.lower()] = skill
        for alias in skill.aliases:
            index[alias.lower()] = skill
    return index


ALIAS_INDEX: dict = _build_alias_index()

# Canonical lookup by lower-case name, used after a match is resolved.
SKILL_BY_NAME: dict = {skill.name.lower(): skill for skill in SKILLS}

FAMILY_MEMBERS: dict = {}
for _skill in SKILLS:
    FAMILY_MEMBERS.setdefault(_skill.family, set()).add(_skill.name)


def all_alias_phrases() -> list:
    """Every alias, longest first, so multi-word phrases win over their prefixes."""
    return sorted(ALIAS_INDEX.keys(), key=len, reverse=True)


def family_mates(skill_name: str) -> set:
    skill = SKILL_BY_NAME.get(skill_name.lower())
    if not skill:
        return set()
    return FAMILY_MEMBERS.get(skill.family, set()) - {skill.name}
